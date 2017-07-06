#!/usr/bin/env nodejs

/*
 * This script is cross-platform and should work fine both on Linux and Windows.
 */

// Configuration part (defaults)
var summary_line_width = 50
var max_line_width = 72

// ===================== CODE STARTS HERE, DO NOT CHANGE BELOW THIS LINE =======================

String.prototype.chomp = function () {
	return this.replace(/(\n|\r)+$/, '');
}

var readline = require('readline')
var http = require('http')
var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: false
	})
var fs = require('fs'),
    path = require('path'),
    filePath = path.join(__dirname, 'validate-issue.conf')
var config
var jsmin = require('jsmin').jsmin

try {
	config = JSON.parse(jsmin(fs.readFileSync(filePath).toString('utf8').chomp()))
}
catch(e) {
	console.log("Failed to read config: " + e.message)
}

if (!config) {
	console.log("Config not available")
	process.exit(1)
}
else if (!config.user) {
	console.log("JIRA User name is not defined in config")
	process.exit(1)
}
else if (!config.pass) {
	console.log("JIRA User password is not defined in config")
	process.exit(1)
}
else if (!config.server) {
	console.log("JIRA Server hostname is not defined in config")
	process.exit(1)
}
else if (!config.port) {
	console.log("JIRA Server port is not defined in config")
	process.exit(1)
}
else if (!config.path) {
	console.log("JIRA Server base path is not defined in config")
	process.exit(1)
}

var jira_host = config.server
var jira_port = config.port
var jira_path = config.path
var auth = config.user + ":" + config.pass;

var lines = 0
var problems = [] // List of problems found (plain text strings)
var args = process.argv.slice(2)
var issue_key = ""
// Take user e-mail from command line.
// If not provided, then fallback to what Bitbucket provides in the environment
// Otherwise set to "unknown"
var curruser = args[0] || process.env.STASH_USER_EMAIL || "unknown"

// Descriptions for errors that may occur in multiple lines
// but should be displayed just once
var flags = {
	"tabs": { "text": "TABs are used in commit log. Use spaces only" },
	"trailing_whitespace": { "text": "Trailing whitespace found in commit log" },
	"long_lines" : { "text" : "Some lines exceed "+max_line_width+" characters in length" }
}

function process_line(line)
{
	lines++

	if (1 == lines) {
		fields = line.match(/^([A-Z]+-[0-9]+):( ?(.+)\s*)?$/)
		issue_key = fields[1] || ""
		var summary = fields[3] || ""

		if (!issue_key) {
			problems.push("First line doesn't contain an issue key")
		}
		if (!summary) {
			problems.push("Summary text is empty")
		}
		if (line.length > summary_line_width) {
			problems.push("First line exceeds "+summary_line_width+" characters")
		}
	}

	if (2 == lines && "" != line) {
		problems.push("There must be an empty line between the summary and the rest of the message")
		return
	}

	// Don't process empty lines any further
	if ("" == line) {
		return
	}

	if (line.match(/\t/)) {
		flags.tabs.value = 1
	}

	if (line.match(/\s+$/)) {
		flags.trailing_whitespace.value = 1
	}

	// Check line length
	if (lines > 1 && line.length > max_line_width) {
		flags.long_lines.value = 1
	}
}

function report_and_exit(jira_problems) {
	Object.keys(flags).forEach(function(flag) {
		if (flags[flag].value) {
			problems.push(flags[flag].text)
		}
	})
	problems.forEach(function(problem) {
		console.log("ERROR: "+problem)
	})

	if (problems.length && !jira_problems) {
		console.log(
		            "*************************************************************\n" +
		            "\n" +
		            "Please use the following template:\n" +
		            "\n" +
		            "-----------------------------------------------------------------------\n" +
		            "KEY-123: Summary, up to 50 chars with the key\n" +
		            "\n" +
		            "Long detailed description that may span across multiple lines, each not\n" +
		            "exceeding 72 characters in length.\n" +
		            "\n" +
		            "It may, for readability/formatting reasons contain empty lines like\n" +
		            "above or include markdown-style formatting like this:\n" +
		            "\n" +
		            "  - A list item\n" +
		            "  - Another list item\n" +
		            "    - Branch list item\n" +
		            "    - Another one\n" +
		            "  - Back to the top level\n" +
		            "\n" +
		            "The empty line after the summary line is mandatory if there is a\n" +
		            "detailed description following it.\n" +
		            "-----------------------------------------------------------------------"
		           )
	}
	else if (problems.length) {
		console.log("Commit validation FAILED")
	}
	else {
		console.log("Commit has been validated OK")
	}

	process.exit(problems.length)
}

function check_issue()
{
	if (problems.length) {
		// Do not try to contact JIRA if there are problems with
		// the commit log format
		report_and_exit(false)
	}

	console.log("Commit log format is OK");
	console.log("Validating commit against JIRA issue " + issue_key + "...");

	var options = {
		protocol : "http:",
		hostname : jira_host,
		port : jira_port,
		method : "GET",
		auth : auth,
		path : jira_path + "rest/api/2/issue/" + issue_key,
		json : true
	}

//	console.log("Requesting "  + jira_url + "/rest/api/2/issue/" + issue_key);
	var req = http.request(options, function(res) {
		const statusCode = res.statusCode
		const contentType = res.headers['content-type']

		if (statusCode != 200) {
			problems.push("JIRA Request failed with code " + statusCode)
			res.resume()
		} else if (!/^application\/json/.test(contentType)) {
			problems.push("JIRA returned invalid response of type " + contentType)
			res.resume()
		}

		res.setEncoding('utf8')
		var rawData = ''

		res.on('data', function(chunk) {
			rawData += chunk
		})

		res.on('end', function() {
			try {
				var parsedData = JSON.parse(rawData)
				if (parsedData.errorMessages) {
					parsedData.errorMessages.forEach(function(msg) {
						problems.push(msg)
					})
					report_and_exit(true)
				}

				if (parsedData.fields.assignee) {
					var assignee = parsedData.fields.assignee.emailAddress
					if (assignee != curruser)
					problems.push("Issue " + issue_key + " is not assigned to " + args[0])
				}
				if (!parsedData.fields.status.name.match(/^In Progress/))
					problems.push("Issue " + issue_key + " is not 'In Progress', can't commit")
			} catch (e) {
				problems.push("JIRA Response Parse error: " + e.message);
			}
			report_and_exit(true)
		})
		res.on('error', function(e) {
		       problems.push("Failed to query JIRA: " + e.message);
		       report_and_exit(true);
		})

	})

	req.on('error', function(e) {
		problems.push("Failed to query JIRA: " + e.message);
		report_and_exit(true);
	})

	req.end()
};

console.log("Validating commit log...");
rl.on('line', process_line)
rl.on('close', check_issue)
