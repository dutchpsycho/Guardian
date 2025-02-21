@echo off
setlocal

set CONFIG_FILE=config.toml

if exist "%CONFIG_FILE%" (
    echo [X] config.toml already exists.
) else (
    echo [INFO] Creating config.toml...
    (
        echo [bot]
        echo token = ""
        echo user_id = ""
        echo app_id = ""

        echo.
        echo [channels]
        echo verification = ""

        echo.
        echo [server]
        echo guild_id = ""
        echo verification_role_id = ""

        echo.
        echo [captcha]
        echo timeout = 300
        echo length = 6
        echo footer = ""

        echo.
        echo [permissions]
        echo whitelisted_roles = [""]
    ) > "%CONFIG_FILE%"
    echo [+] config.toml has been created. Please fill in your details.
)

echo [INFO] Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Please check your npm setup.
    exit /b 1
)

echo [!] Setup complete! You can now run the bot with:
echo     hydra.bat

timeout /t 5 /nobreak >nul
exit /b