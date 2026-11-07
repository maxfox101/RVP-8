import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./db.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { findImage } from "./services/imageService.js";
import apiRouter from "./routes/api.js";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./swagger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

async function main() {
  await connectDb();

  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());
  app.use(requestLogger);

  // Картинки из PostgreSQL (таблица images), иначе — файлы с диска
  app.get("/images/:file", async (req, res, next) => {
    try {
      const imagePath = `/images/${req.params.file}`;
      const row = await findImage(imagePath);
      if (!row) return next();
      res.set("Content-Type", row.content_type);
      res.set("Cache-Control", "public, max-age=86400");
      res.send(row.data);
    } catch (err) {
      next(err);
    }
  });
  app.use("/images", express.static(path.join(__dirname, "..", "public", "images")));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customSiteTitle: "БазМет API — Swagger"
  }));
  app.get("/api/openapi.json", (_req, res) => res.json(openApiSpec));
  app.use("/api", apiRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "Маршрут не найден", path: req.originalUrl });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  });

  const host = process.env.HOST || "0.0.0.0";
  app.listen(PORT, host, () => {
    console.log(`БазМет API (PostgreSQL): http://${host}:${PORT}`);
    console.log(`Swagger UI: http://${host}:${PORT}/api/docs`);
  });
}

main().catch((err) => {
  console.error("Не удалось запустить сервер:", err);
  process.exit(1);
});
