#!/usr/bin/env bash
# deploy-multi-agent.sh — Start multiple OpenClaw gateway instances for multi-agent Discord setup
# Usage: bash deploy-multi-agent.sh [start|stop|status]
#
# Prerequisites:
#   1. openclaw installed globally: sudo npm i -g openclaw@latest
#   2. Two Discord bots created at https://discord.com/developers/applications
#   3. Config files placed at:
#      - ~/.openclaw/openclaw.json        (Leader config — port 18789)
#      - ~/.openclaw/openclaw-worker.json  (Worker config — port 18790)
#   4. Both bots invited to the same Discord server with proper permissions
#
# Quick setup:
#   cp openclaw-leader.json ~/.openclaw/openclaw.json
#   cp openclaw-worker.json ~/.openclaw/openclaw-worker.json
#   # Edit both files: fill in API keys, Discord tokens, guild/channel IDs
#   bash deploy-multi-agent.sh start

set -euo pipefail

LEADER_CONFIG="$HOME/.openclaw/openclaw.json"
WORKER_CONFIG="$HOME/.openclaw/openclaw-worker.json"

LEADER_PORT=18789
WORKER_PORT=18790

LEADER_LOG="/tmp/openclaw-leader.log"
WORKER_LOG="/tmp/openclaw-worker.log"

LEADER_PID_FILE="/tmp/openclaw-leader.pid"
WORKER_PID_FILE="/tmp/openclaw-worker.pid"

start_agent() {
  local name="$1"
  local config="$2"
  local port="$3"
  local logfile="$4"
  local pidfile="$5"

  if [ ! -f "$config" ]; then
    echo "ERROR: Config file not found: $config"
    echo "  Copy the template and fill in your credentials:"
    echo "  cp openclaw-${name}.json $config"
    return 1
  fi

  # Kill any existing process on this port
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "[$name] Stopping existing instance (PID $(cat "$pidfile"))..."
    kill "$(cat "$pidfile")" 2>/dev/null || true
    sleep 1
  fi

  # Also kill anything else on the port
  pkill -f "openclaw gateway.*--port $port" 2>/dev/null || true
  sleep 0.5

  echo "[$name] Starting on port $port..."
  echo "[$name] Config: $config"
  echo "[$name] Log: $logfile"

  OPENCLAW_CONFIG="$config" nohup openclaw gateway run \
    --bind loopback \
    --port "$port" \
    --force \
    > "$logfile" 2>&1 &

  local pid=$!
  echo "$pid" > "$pidfile"
  echo "[$name] Started (PID $pid)"
}

stop_agent() {
  local name="$1"
  local pidfile="$2"
  local port="$3"

  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "[$name] Stopping PID $(cat "$pidfile")..."
    kill "$(cat "$pidfile")"
    rm -f "$pidfile"
  else
    echo "[$name] Not running (no PID file)"
  fi

  # Cleanup any orphans
  pkill -f "openclaw gateway.*--port $port" 2>/dev/null || true
}

status_agent() {
  local name="$1"
  local pidfile="$2"
  local port="$3"
  local logfile="$4"

  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "[$name] RUNNING (PID $(cat "$pidfile"), port $port)"
    # Show last 3 lines of log
    if [ -f "$logfile" ]; then
      echo "  Last log lines:"
      tail -3 "$logfile" | sed 's/^/    /'
    fi
  else
    echo "[$name] STOPPED"
  fi
}

case "${1:-status}" in
  start)
    echo "=== Starting Multi-Agent OpenClaw ==="
    echo ""
    start_agent "leader" "$LEADER_CONFIG" "$LEADER_PORT" "$LEADER_LOG" "$LEADER_PID_FILE"
    echo ""
    start_agent "worker" "$WORKER_CONFIG" "$WORKER_PORT" "$WORKER_LOG" "$WORKER_PID_FILE"
    echo ""
    echo "=== Both agents started ==="
    echo "Leader: port $LEADER_PORT, log $LEADER_LOG"
    echo "Worker: port $WORKER_PORT, log $WORKER_LOG"
    echo ""
    echo "Verify with: bash $0 status"
    echo "View logs:   tail -f $LEADER_LOG $WORKER_LOG"
    ;;
  stop)
    echo "=== Stopping Multi-Agent OpenClaw ==="
    stop_agent "leader" "$LEADER_PID_FILE" "$LEADER_PORT"
    stop_agent "worker" "$WORKER_PID_FILE" "$WORKER_PORT"
    echo "=== All agents stopped ==="
    ;;
  status)
    echo "=== Multi-Agent OpenClaw Status ==="
    status_agent "leader" "$LEADER_PID_FILE" "$LEADER_PORT" "$LEADER_LOG"
    status_agent "worker" "$WORKER_PID_FILE" "$WORKER_PORT" "$WORKER_LOG"
    # Check ports
    echo ""
    echo "Port check:"
    ss -ltnp 2>/dev/null | grep -E ":($LEADER_PORT|$WORKER_PORT) " || echo "  No listeners on ports $LEADER_PORT/$WORKER_PORT"
    ;;
  restart)
    bash "$0" stop
    sleep 2
    bash "$0" start
    ;;
  logs)
    tail -f "$LEADER_LOG" "$WORKER_LOG"
    ;;
  *)
    echo "Usage: $0 {start|stop|status|restart|logs}"
    exit 1
    ;;
esac
