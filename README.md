# Introduction

These scripts are to be used with [Atlassian Bitbucket Server][1] to
restrict commits by the contents of the commit logs.

[1]: https://www.atlassian.com/software/bitbucket

Bitbucket Server as of version 5.0.1 only supports `pre-receive` and
`post-receive` hooks via its web UI. Neither of those git hooks has
access to the commit log messages. Only the `update` hook can
process it.

# Files

`update`

The git update hook

`validate-issue.js`

A node.js commit log validation script.<br>
It checks commit log format, JIRA issue assignee, and JIRA issue status.<br>
Requires 'jsmin' module to be installed.

`validate-issue.conf`

A configuration template file for the validate-issue.js script.<br>
The file format is JSON (with comments) and the contents are self-documented.<br>
This file must reside in the same directory with the validate-issue.js script.

# Installing for a single repository

If you're running Windows, then your actual hooks for each repository
are located in a place like `C:\Atlassian\ApplicationData\Bitbucket\shared\data\repositories\<your_repo_number>\hooks`, provided that you have installed Bitbucket Server into `C:\Atlassian`.

Put all the above files right there and don't forget to edit the `validate-issue.conf` file.

# Installing as a template

In order for these hooks to be installed automatically for each new repository,
put those files in the git's `templates` directory, which is located inside Bitbucket's
`shared/config` directory like this:

`C:\Atlassian\ApplicationData\Bitbucket\shared\config\git\templates\hooks`
