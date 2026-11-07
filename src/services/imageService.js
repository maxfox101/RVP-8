import { query } from "../db.js";

export async function findImage(imagePath) {
  const { rows } = await query(
    "SELECT path, content_type, data FROM images WHERE path = $1",
    [imagePath]
  );
  return rows[0] || null;
}

export async function countImages() {
  const { rows } = await query("SELECT count(*)::int AS n FROM images");
  return rows[0].n;
}
