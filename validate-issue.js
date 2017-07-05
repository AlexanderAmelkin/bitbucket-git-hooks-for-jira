// Configuration part
var summary_line_width = 50
var max_line_width = 72
var jira_url = "http://fst-jira.prosoft.ri:8080/"
var bb_username = "amelkin"
var bb_password = "isho5Phix"

// ===================== CODE STARTS HERE, DO NOT CHANGE BELOW THIS LINE =======================
var readline = require('readline')
var http = require('http')
var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: false
	})

var lines = 0
var problems = [] // List of problems found (plain text strings)
var args = process.argv.slice(2)
var issue_key = ""

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

function report_and_exit() {
	console.log("Checked issue "+issue_key+".")
	Object.keys(flags).forEach(function(flag) {
		if (flags[flag].value) {
			problems.push(flags[flag].text)
		}
	})
	problems.forEach(function(problem) {
		console.log("ERROR: "+problem)
	})

	if (problems.length) {
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

	process.exit(problems.length)
}

function check_issue()
{
	if (problems.length) {
		console.log("Some problems")
		report_and_exit()
	}

	console.log("Requesting "  + jira_url + "/rest/api/2/issue/" + issue_key);
	var r = http.get(jira_url + "/rest/api/2/issue/" + issue_key, function(res) {
		const statusCode = res.statusCode
		const contentType = res.headers['content-type']

		console.log("X");

		if (statusCode == 404) {
			console.log("404")
			problems.push("Issue " + issue_key + " doesn't exist")
			res.resume()
			report_and_exit()
			return
		}
		else if (statusCode !== 200) {
			console.log("!200")
			problems.push("JIRA Request failed with code " + statusCode)
			res.resume()
			report_and_exit()
			return
		} else if (!/^application\/json/.test(contentType)) {
			console.log("!JSON")
			problems.push("JIRA returned invalid response of type " + contentType)
			res.resume()
			report_and_exit()
			return
		}

		res.setEncoding('utf8')
		let rawData = ''
		res.on('data', (chunk) => { rawData += chunk; console.log("Chunk") })
		res.on('end', () => {
			console.log("end")
			try {
				let parsedData = JSON.parse(rawData)
				console.log(parsedData)
				if (parsedData.fields.assignee) {
					var assignee = parsedData.fields.assignee.emailAddress
					if (assignee != args[0])
					problems.push("Issue " + issue_key + " is not assigned to " + args[0])
				}
				if (!parsedData.status.match(/^In Progress/))
					problems.push("Issue " + issue_key + " is not 'In Progress', can't commit")
			} catch (e) {
				problems.push("JIRA Response Parse error: " + e.message);
			}
		})
	})
	r.on('error', (e) => {
		problems.push("JIRA Request failed: " + e.message)
	})

	report_and_exit()
}

rl.on('line', process_line)
rl.on('close', check_issue)
