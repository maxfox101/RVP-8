#!/bin/sh
set -eu

echo "Ожидание PostgreSQL…"
retries=60
while [ "$retries" -gt 0 ]; do
  if node -e "
    import('pg').then(async ({ default: pg }) => {
      const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
      try {
        await pool.query('SELECT 1');
        process.exit(0);
      } catch {
        process.exit(1);
      } finally {
        await pool.end().catch(() => {});
      }
    });
  "; then
    break
  fi
  retries=$((retries - 1))
  sleep 2
done

if [ "$retries" -le 0 ]; then
  echo "PostgreSQL недоступен"
  exit 1
fi

echo "Проверка наполнения каталога…"
NEED_SEED="$(node -e "
  import('pg').then(async ({ default: pg }) => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
      const { rows } = await pool.query(\"SELECT to_regclass('public.products') AS t\");
      if (!rows[0].t) {
        console.log('yes');
        process.exit(0);
      }
      const count = await pool.query('SELECT count(*)::int AS n FROM products');
      console.log(count.rows[0].n === 0 ? 'yes' : 'no');
    } catch {
      console.log('yes');
    } finally {
      await pool.end().catch(() => {});
    }
  });
")"

if [ "$NEED_SEED" = "yes" ]; then
  echo "Заполнение БД (seed)…"
  node scripts/seed.js
else
  echo "Каталог уже заполнен — seed пропущен."
fi

echo "Запуск API…"
exec node src/index.js
