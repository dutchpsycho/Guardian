Set objShell = CreateObject("WScript.Shell") 
objShell.Run "cmd /c node --title HYDRASEC src\master.js", 0, False 
