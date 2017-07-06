@echo off

echo Executing node.js hook %1
set SCRIPT="%~p0\%1"
shift
node %SCRIPT% %*
