@echo off
setlocal
rem Run pnpm in the caller's directory. Changing into this checkout's root made
rem nested pnpm calls from other worktrees run against this checkout whenever
rem its bin directory is on PATH. Forward slashes keep the shim path bash-safe.
set "PNPM_SHIM=%~dp0pnpm"
set "PNPM_SHIM=%PNPM_SHIM:\=/%"
set "BASH_EXE="
if exist "%ProgramFiles%\Git\bin\bash.exe" set "BASH_EXE=%ProgramFiles%\Git\bin\bash.exe"
if not defined BASH_EXE if exist "%ProgramFiles%\Git\usr\bin\bash.exe" set "BASH_EXE=%ProgramFiles%\Git\usr\bin\bash.exe"
if not defined BASH_EXE for /f "delims=" %%I in ('where bash 2^>nul') do if not defined BASH_EXE set "BASH_EXE=%%I"
if not defined BASH_EXE (
  echo Git Bash or another bash-compatible shell must be available on PATH. 1>&2
  exit /b 1
)
"%BASH_EXE%" "%PNPM_SHIM%" %*
exit /b %ERRORLEVEL%
