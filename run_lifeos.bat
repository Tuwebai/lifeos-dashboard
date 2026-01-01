@echo off
cd /d "%~dp0"
:: Iniciamos el servidor de desarrollo en segundo plano dentro del mismo proceso invisible
:: Usamos call para asegurar que el entorno de npm esté disponible si se usa nvm u otros
start /b cmd /c "npm run dev"
:: Esperamos 5 segundos a que el servidor levante
timeout /t 5 /nobreak > nul
:: Abrimos Brave directamente en el localhost
start brave "http://localhost:3000"
exit
