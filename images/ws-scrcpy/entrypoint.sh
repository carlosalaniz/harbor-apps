#!/bin/sh
# Starts adb, keeps it connected to every address in ADB_CONNECT (space separated host:port; an Android container
# boots slowly and may restart), then runs ws-scrcpy on port 8000.
# HARBOR_INPUT=<host>:<port> (optional): the browser's taps and keys go to harbor-input inside Android as hardware
# input. This loop makes adbd root (Android debug builds allow it), pushes the daemon and starts it whenever it is not
# running (after an Android restart, too).
set -eu
adb start-server >/dev/null
input_port="${HARBOR_INPUT:-}"; input_port="${input_port##*:}"
ensure_input() {
  target="$1"
  [ -n "${HARBOR_INPUT:-}" ] || return 0
  if [ "$(adb -s "$target" shell id -u 2>/dev/null | tr -d '\r')" != 0 ]; then
    adb -s "$target" root >/dev/null 2>&1 || true # adbd restarts as root; the next round reconnects
    return 0
  fi
  adb -s "$target" shell pidof harbor-input >/dev/null 2>&1 && return 0
  adb -s "$target" push /usr/local/lib/harbor-input /data/local/tmp/harbor-input >/dev/null 2>&1 || return 0
  adb -s "$target" shell "chmod 755 /data/local/tmp/harbor-input; setsid /data/local/tmp/harbor-input $input_port </dev/null >/dev/null 2>&1 &" || true
}
if [ -n "${ADB_CONNECT:-}" ]; then
  (
    while :; do
      for target in $ADB_CONNECT; do
        if adb devices | grep -q "^${target}[[:space:]]*device$"; then
          ensure_input "$target"
        else
          adb connect "$target" >/dev/null 2>&1 || true
        fi
      done
      sleep 5
    done
  ) &
fi
exec node /app/index.js
