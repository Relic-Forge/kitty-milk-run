#!/bin/zsh
set -euo pipefail

APP_NAME="Kitty Milk Run"
APP_DIR="/Users/jeffdarcy/Projects/kitty-milk-run"
PORT="${KITTY_MILK_RUN_PORT:-5173}"
HOST="127.0.0.1"
URL="http://${HOST}:${PORT}/"
LOG_DIR="$HOME/Library/Logs"
LOG_FILE="$LOG_DIR/kitty-milk-run-launcher.log"

mkdir -p "$LOG_DIR"
cd "$APP_DIR"

if ! command -v npm >/dev/null 2>&1; then
  osascript -e "display alert \"$APP_NAME\" message \"npm was not found. Install Node.js, then launch again.\""
  exit 1
fi

if [ ! -d node_modules ]; then
  npm install >>"$LOG_FILE" 2>&1
fi

if ! lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  nohup /bin/zsh -lc "cd '$APP_DIR' && exec npm run dev -- --host '$HOST' --port '$PORT'" >>"$LOG_FILE" 2>&1 </dev/null &!
fi

for _ in {1..60}; do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    open "$URL"
    exit 0
  fi
  sleep 0.25
done

open "$URL"
osascript -e "display notification \"Started launch command, but the browser check timed out. See $LOG_FILE\" with title \"$APP_NAME\""
