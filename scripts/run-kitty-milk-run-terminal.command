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
  npm install 2>&1 | tee -a "$LOG_FILE"
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  open "$URL"
  echo "$APP_NAME is already running at $URL"
  exit 0
fi

(
  for _ in {1..80}; do
    if curl -fsS "$URL" >/dev/null 2>&1; then
      open "$URL"
      exit 0
    fi
    sleep 0.25
  done
  open "$URL"
) &

echo "Starting $APP_NAME at $URL"
echo "Leave this Terminal window open while playing. Press Control-C here to stop the server."
exec npm run dev -- --host "$HOST" --port "$PORT"
