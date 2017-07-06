These scripts are to be used with External Hooks plugin for
Atlassian Bitbucket Server.

nodehook.cmd        - a Windows wrapper for node.js hook scripts
perlhook.cmd        - a Windows wrapper for perl hook scripts
validate-issue.js   - a node.js pre-commit hook script to validate
                      a commit log against JIRA. It checks commit
                      log format, JIRA issue assignee, and JIRA
                      issue status.
validate-issue.conf - a configuration template file for the
                      validate-issue.js script. The file format
                      is JSON (with comments) and the contents are
                      self-documented. This file must reside in
                      the same directory with the validate-issue.js
                      script.
