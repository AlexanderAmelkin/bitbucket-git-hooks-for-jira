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

The scripts must be installed in the repository's directory inside Bitbucket Server:

  1. Go to Bitbucket home, e.g. on Windows that may be
     `C:\Atlassian\ApplicationData\Bitbucket`
  2. Go to `shared/data/repositories` and identify which of the numbered directories
     there contain your repository. You can use `git log` inside those directories
     to do that.
  3. Go to the hooks dir of your repository's directory, e.g. `13/hooks`
  4. Put the files of this project listed above into that directory
  5. Run `npm install jsmin` to install the `jsmin` module required for validate-issue.js
  6. Edit validate-issue.conf to reflect your network and account configuration

# Installing as a template

In order for these hooks to be installed automatically for each new repository,
take the same steps as for single repository installation, but put instead of steps 2 and 3,
go directly to the hook templates directory `shared/config/git/templates/hooks`.
