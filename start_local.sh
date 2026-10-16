#!/usr/bin/env bash
# One-command local start (Linux/macOS): installs packages, creates .env, runs the dev server.
set -e
cd "$(dirname "$0")"
[ -f .env ] || cp .env.example .env
[ -d node_modules ] || npm install
echo ""
echo "Open http://localhost:5173  (make sure the backend is running on port 1802)"
npm run dev
