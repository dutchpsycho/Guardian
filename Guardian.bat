@echo off
setlocal

call setup.bat

set VBS_FILE=Guardian.vbs
set NODE_SCRIPT=src\master.js
set NODE_IDENTIFIER=Guardian

echo Set objShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo objShell.Run "cmd /c node --title %NODE_IDENTIFIER% %NODE_SCRIPT%", 0, False >> "%VBS_FILE%"

wscript "%VBS_FILE%"

cls

echo [INFO] Guardian SECURITY is now running in the background.
echo [*] Please make sure you have any other instances of Guardian closed.
echo ----------------------------------------------
echo [?] To STOP the bot, open Task Manager (Ctrl+Shift+Esc):
echo [1] Go to the "Details" tab, find "node.exe", and look for "Guardian" in the Command Line column.
echo [2] End that process.
echo ----------------------------------------------
echo [?] To RUN the bot on startup:
echo [1] Press Win + R and type: shell:startup
echo [2] Make a shortcut to Guardian.bat
echo [3] Put the shortcut in the startup folder
echo ----------------------------------------------

pause >nul