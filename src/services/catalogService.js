import { query } from "../db.js";

function asWebpPath(value) {
  if (!value || typeof value !== "string") return value;
  return value.replace(/\.jpe?g(\?.*)?$/i, ".webp$1");
}

function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    img: asWebpPath(row.img),
    detailImg: asWebpPath(row.detail_img),
    type: row.type,
    standard: row.standard,
    materials: row.materials || [],
    coatings: row.coatings || [],
    keywords: row.keywords || "",
    description: row.description || "",
    specs: row.specs || [],
    fields: row.fields || []
  };
}

export async function getCategories() {
  const { rows } = await query("SELECT id, title, img, path FROM categories ORDER BY title ASC");
  return rows.map((row) => ({ ...row, img: asWebpPath(row.img) }));
}

export async function getServices() {
  const { rows } = await query("SELECT title, text FROM services ORDER BY id ASC");
  return rows;
}

export async function getFilters() {
  const { rows } = await query("SELECT type, standard, material, coating FROM filters WHERE key = $1", [
    "catalog"
  ]);
  if (!rows[0]) {
    return { type: [], standard: [], material: [], coating: [] };
  }
  return {
    type: rows[0].type || [],
    standard: rows[0].standard || [],
    material: rows[0].material || [],
    coating: rows[0].coating || []
  };
}

export async function filterProducts(queryParams) {
  const q = (queryParams.q || "").toLowerCase().replace(/ё/g, "е").trim();
  const where = [];
  const params = [];

  if (queryParams.type) {
    params.push(queryParams.type);
    where.push(`type = $${params.length}`);
  }
  if (queryParams.standard) {
    params.push(queryParams.standard);
    where.push(`standard = $${params.length}`);
  }
  if (queryParams.material) {
    params.push(queryParams.material);
    where.push(`$${params.length} = ANY(materials)`);
  }
  if (queryParams.coating) {
    params.push(queryParams.coating);
    where.push(`$${params.length} = ANY(coatings)`);
  }
  if (q) {
    params.push(`%${q}%`);
    where.push(
      `replace(lower(title || ' ' || coalesce(keywords, '')), 'ё', 'е') LIKE $${params.length}`
    );
  }

  const sql =
    "SELECT * FROM products" +
    (where.length ? " WHERE " + where.join(" AND ") : "") +
    " ORDER BY title ASC";

  const { rows } = await query(sql, params);
  return rows.map(mapProduct);
}

export async function findProduct(id) {
  const { rows } = await query("SELECT * FROM products WHERE id = $1", [id]);
  return mapProduct(rows[0]);
}
