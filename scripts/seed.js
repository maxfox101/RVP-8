import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { connectDb, pool, ordersPool, query, ordersQuery } from "../src/db.js";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaSql = fs.readFileSync(path.join(__dirname, "..", "src", "schema.sql"), "utf8");
const ordersSchemaSql = fs.readFileSync(
  path.join(__dirname, "..", "src", "schema-orders.sql"),
  "utf8"
);
const catalog = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "catalog.json"), "utf8")
);

async function ensureOrdersDatabase() {
  const adminUrl =
    process.env.ADMIN_DATABASE_URL || "postgresql://bazmet@127.0.0.1:5433/postgres";
  const admin = new Pool({ connectionString: adminUrl });
  try {
    const { rows } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = 'bazmet_orders'"
    );
    if (!rows.length) {
      await admin.query("CREATE DATABASE bazmet_orders OWNER bazmet");
      console.log("Создана БД bazmet_orders");
    }
  } finally {
    await admin.end();
  }
}

function contentTypeFor(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

async function seedImages() {
  const imagesDir = path.join(__dirname, "..", "public", "images");
  const files = fs.readdirSync(imagesDir).filter((name) => /\.(jpe?g|png|webp|gif)$/i.test(name));
  let loaded = 0;

  for (const file of files) {
    const data = fs.readFileSync(path.join(imagesDir, file));
    const imagePath = `/images/${file}`;
    await query(
      `INSERT INTO images (path, content_type, data)
       VALUES ($1, $2, $3)
       ON CONFLICT (path) DO UPDATE
         SET content_type = EXCLUDED.content_type,
             data = EXCLUDED.data`,
      [imagePath, contentTypeFor(file), data]
    );
    loaded += 1;
  }

  return loaded;
}

async function seedCatalog() {
  await query(schemaSql);
  await query("DROP TABLE IF EXISTS orders CASCADE");
  await query("TRUNCATE categories, services, products, filters, images RESTART IDENTITY");

  for (const item of catalog.categories) {
    await query(
      `INSERT INTO categories (id, title, img, path) VALUES ($1, $2, $3, $4)`,
      [item.id, item.title, item.img, item.path]
    );
  }

  for (const item of catalog.services) {
    await query(`INSERT INTO services (title, text) VALUES ($1, $2)`, [item.title, item.text]);
  }

  for (const item of catalog.products) {
    await query(
      `INSERT INTO products
        (id, title, img, detail_img, type, standard, materials, coatings, keywords, description, specs, fields)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        item.id,
        item.title,
        item.img,
        item.detailImg,
        item.type,
        item.standard,
        item.materials || [],
        item.coatings || [],
        item.keywords || "",
        item.description || "",
        item.specs || [],
        JSON.stringify(item.fields || [])
      ]
    );
  }

  await query(
    `INSERT INTO filters (key, type, standard, material, coating)
     VALUES ('catalog', $1::jsonb, $2::jsonb, $3::jsonb, $4::jsonb)`,
    [
      JSON.stringify(catalog.filters.type),
      JSON.stringify(catalog.filters.standard),
      JSON.stringify(catalog.filters.material),
      JSON.stringify(catalog.filters.coating)
    ]
  );

  return seedImages();
}

async function seedOrdersDb() {
  await ordersQuery(ordersSchemaSql);
  await ordersQuery("TRUNCATE orders, customers RESTART IDENTITY CASCADE");

  const { rows: customers } = await ordersQuery(
    `INSERT INTO customers (name, phone, email)
     VALUES
       ('Демо Клиент', '+7 (900) 000 - 00 - 00', 'demo@bazmet.ru'),
       ('Иван Петров', '+7 (900) 111 - 22 - 33', 'ivan@mail.ru')
     RETURNING id, email`
  );

  const demoId = customers.find((c) => c.email === "demo@bazmet.ru").id;
  const ivanId = customers.find((c) => c.email === "ivan@mail.ru").id;

  await ordersQuery(
    `INSERT INTO orders (id, customer_id, service, description, created_at)
     VALUES
       ('ord-demo-1', $1, 'Лазерная гравировка', 'Тестовая заявка для наполнения БД', NOW()),
       ('ord-demo-2', $2, 'Гайка ГОСТ 5915-70', 'Нужна партия М10', NOW())`,
    [demoId, ivanId]
  );
}

async function seed() {
  await ensureOrdersDatabase();
  await connectDb();

  const imagesLoaded = await seedCatalog();
  await seedOrdersDb();

  const catalogCounts = {};
  for (const table of ["categories", "services", "products", "filters", "images"]) {
    const { rows } = await query(`SELECT count(*)::int AS n FROM ${table}`);
    catalogCounts[table] = rows[0].n;
  }

  const ordersCounts = {};
  for (const table of ["customers", "orders"]) {
    const { rows } = await ordersQuery(`SELECT count(*)::int AS n FROM ${table}`);
    ordersCounts[table] = rows[0].n;
  }

  console.log("БД bazmet (каталог):", catalogCounts);
  console.log(`Картинки в images: ${imagesLoaded} файлов (BYTEA)`);
  console.log("БД bazmet_orders (заявки):", ordersCounts);

  await pool.end();
  await ordersPool.end();
}

seed().catch(async (err) => {
  console.error(err);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  try {
    await ordersPool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
