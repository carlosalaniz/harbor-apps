#!/bin/sh
# Starts adb, keeps it connected to every address in ADB_CONNECT (space separated host:port; an Android container
# boots slowly and may restart), then runs ws-scrcpy on port 8000.
set -eu
adb start-server >/dev/null
if [ -n "${ADB_CONNECT:-}" ]; then
  (
    while :; do
      for target in $ADB_CONNECT; do
        adb devices | grep -q "^${target}[[:space:]]*device$" || adb connect "$target" >/dev/null 2>&1 || true
      done
      sleep 5
    done
  ) &
fi
exec node /app/index.js
