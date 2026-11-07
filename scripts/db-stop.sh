#!/bin/bash
set -euo pipefail
export PATH="/Library/PostgreSQL/18/bin:$PATH"
PGDATA="$(cd "$(dirname "$0")/.." && pwd)/.pg-bazmet"
if [ ! -d "$PGDATA" ]; then
  echo "Кластер не найден"
  exit 0
fi
pg_ctl -D "$PGDATA" stop -m fast || true
