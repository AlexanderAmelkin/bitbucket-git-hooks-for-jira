@echo off

echo Executing perl hook %1
set SCRIPT="%~p0\%1"
shift
perl %SCRIPT% %*