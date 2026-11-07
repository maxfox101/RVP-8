#!/bin/bash
set -euo pipefail
# Создаём вторую БД для заявок (каталог уже создан через POSTGRES_DB=bazmet).
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  SELECT 'CREATE DATABASE bazmet_orders OWNER ${POSTGRES_USER}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bazmet_orders')\gexec
EOSQL
