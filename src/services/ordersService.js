import { ordersQuery } from "../db.js";

function mapOrder(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    service: row.service || "",
    name: row.name,
    phone: row.phone,
    email: row.email,
    description: row.description || "",
    createdAt: row.created_at
  };
}

function mapCustomer(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
    ordersCount: row.orders_count
  };
}

/** Найти или создать пользователя по e-mail */
export async function upsertCustomer({ name, phone, email }) {
  const existing = await ordersQuery("SELECT * FROM customers WHERE email = $1", [email]);
  if (existing.rows[0]) {
    const { rows } = await ordersQuery(
      `UPDATE customers
       SET name = $1, phone = $2
       WHERE email = $3
       RETURNING *`,
      [name, phone, email]
    );
    return rows[0];
  }

  const { rows } = await ordersQuery(
    `INSERT INTO customers (name, phone, email)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, phone, email]
  );
  return rows[0];
}

export async function getCustomers() {
  const { rows } = await ordersQuery(
    `SELECT c.*, count(o.id)::int AS orders_count
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id
     GROUP BY c.id
     ORDER BY c.created_at DESC`
  );
  return rows.map(mapCustomer);
}

export async function getOrders() {
  const { rows } = await ordersQuery(
    `SELECT o.id, o.customer_id, o.service, o.description, o.created_at,
            c.name, c.phone, c.email
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     ORDER BY o.created_at DESC`
  );
  return rows.map(mapOrder);
}

export async function saveOrder(order) {
  const customer = await upsertCustomer({
    name: order.name,
    phone: order.phone,
    email: order.email
  });

  const record = {
    id: "ord-" + Date.now(),
    customerId: customer.id,
    service: order.service || "",
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    description: order.description || "",
    createdAt: new Date()
  };

  await ordersQuery(
    `INSERT INTO orders (id, customer_id, service, description, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [record.id, record.customerId, record.service, record.description, record.createdAt]
  );

  return record;
}
