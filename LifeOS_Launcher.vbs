Set WshShell = CreateObject("WScript.Shell")
' El 0 al final indica que la ventana debe estar oculta
WshShell.Run chr(34) & "run_lifeos.bat" & chr(34), 0
Set WshShell = Nothing
