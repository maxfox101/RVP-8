#!/bin/bash
set -euo pipefail
export PATH="/Library/PostgreSQL/18/bin:$PATH"
PGDATA="$(cd "$(dirname "$0")/.." && pwd)/.pg-bazmet"
if [ ! -d "$PGDATA" ]; then
  echo "Нет кластера $PGDATA — сначала выполните init (см. README)"
  exit 1
fi
if pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
  echo "PostgreSQL уже запущен (порт 5433)"
  exit 0
fi
pg_ctl -D "$PGDATA" -l "$PGDATA/server.log" start
pg_isready -h 127.0.0.1 -p 5433
