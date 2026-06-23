@echo off
setlocal
cd /d "%~dp0.."
set "BASH_EXE="
if exist "%ProgramFiles%\Git\bin\bash.exe" set "BASH_EXE=%ProgramFiles%\Git\bin\bash.exe"
if not defined BASH_EXE if exist "%ProgramFiles%\Git\usr\bin\bash.exe" set "BASH_EXE=%ProgramFiles%\Git\usr\bin\bash.exe"
if not defined BASH_EXE for /f "delims=" %%I in ('where bash 2^>nul') do if not defined BASH_EXE set "BASH_EXE=%%I"
if not defined BASH_EXE (
  echo Git Bash or another bash-compatible shell must be available on PATH. 1>&2
  exit /b 1
)
"%BASH_EXE%" "./bin/6529" %*
exit /b %ERRORLEVEL%
