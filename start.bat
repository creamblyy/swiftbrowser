@echo off
setlocal
cd /d "%~dp0"

echo Starting Swift Browser...

if not exist "node_modules\electron\dist\electron.exe" (
    echo Dependencies are missing. Installing...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
)

call npm start
if errorlevel 1 (
    echo.
    echo Swift Browser exited with an error.
    pause
)

endlocal
