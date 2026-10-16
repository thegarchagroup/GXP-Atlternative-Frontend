@echo off
REM One-command local start (Windows): installs packages, creates .env, runs the dev server.
cd /d "%~dp0"
if not exist .env copy .env.example .env >nul
if not exist node_modules call npm install
echo.
echo Open http://localhost:5173  (make sure the backend is running on port 1802)
call npm run dev
