import pg from "pg";

const { Pool } = pg;

const catalogUrl =
  process.env.DATABASE_URL || "postgresql://bazmet@127.0.0.1:5433/bazmet";
const ordersUrl =
  process.env.ORDERS_DATABASE_URL || "postgresql://bazmet@127.0.0.1:5433/bazmet_orders";

/** Каталог: categories, products, images… */
export const pool = new Pool({ connectionString: catalogUrl });

/** Заявки пользователей: customers + orders */
export const ordersPool = new Pool({ connectionString: ordersUrl });

export async function connectDb() {
  const catalogClient = await pool.connect();
  try {
    const { rows } = await catalogClient.query(
      "SELECT current_database() AS db, version() AS version"
    );
    console.log("PostgreSQL (каталог):", rows[0].db);
  } finally {
    catalogClient.release();
  }

  const ordersClient = await ordersPool.connect();
  try {
    const { rows } = await ordersClient.query("SELECT current_database() AS db");
    console.log("PostgreSQL (заявки):", rows[0].db);
  } finally {
    ordersClient.release();
  }
}

export async function query(text, params) {
  return pool.query(text, params);
}

export async function ordersQuery(text, params) {
  return ordersPool.query(text, params);
}
