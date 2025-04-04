Set objShell = CreateObject("WScript.Shell") 
objShell.Run "cmd /c node --title Guardian src\master.js", 0, False 
