These scripts are to be used with [External Hooks][1] plugin for
[Atlassian Bitbucket Server][2].

* **nodehook.cmd** <br>
  a Windows wrapper for node.js hook scripts
* **perlhook.cmd** <br>
  a Windows wrapper for perl hook scripts.<br>
  Using perl scripts is not recommended because perl modules are not
  very portable. Some modules that you use on Linux may be not available
  under Windows.
* **validate-issue.js** <br>
  a node.js pre-commit hook script to validate a commit log against JIRA.<br>
  It checks commit log format, JIRA issue assignee, and JIRA issue status.<br>
* **validate-issue.conf** <br>
  a configuration template file for the validate-issue.js script.<br>
  The file format is JSON (with comments) and the contents are self-documented.<br>
  This file must reside in the same directory with the validate-issue.js script.

[1]: https://marketplace.atlassian.com/plugins/com.ngs.stash.externalhooks.external-hooks/server/overview
[2]: https://www.atlassian.com/software/bitbucket
