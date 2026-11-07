import { Router } from "express";
import {
  filterProducts,
  findProduct,
  getCategories,
  getFilters,
  getServices
} from "../services/catalogService.js";
import { getCustomers, getOrders, saveOrder } from "../services/ordersService.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "bazmet-api",
    storage: "postgresql",
    databases: {
      catalog: "bazmet",
      orders: "bazmet_orders"
    }
  });
});

router.get("/categories", async (_req, res, next) => {
  try {
    res.json(await getCategories());
  } catch (err) {
    next(err);
  }
});

router.get("/services", async (_req, res, next) => {
  try {
    res.json(await getServices());
  } catch (err) {
    next(err);
  }
});

router.get("/filters", async (_req, res, next) => {
  try {
    res.json(await getFilters());
  } catch (err) {
    next(err);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const list = await filterProducts(req.query);
    res.json({ count: list.length, items: list });
  } catch (err) {
    next(err);
  }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const item = await findProduct(req.params.id);
    if (!item) return res.status(404).json({ error: "Изделие не найдено" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.get("/customers", async (_req, res, next) => {
  try {
    res.json(await getCustomers());
  } catch (err) {
    next(err);
  }
});

router.get("/orders", async (_req, res, next) => {
  try {
    res.json(await getOrders());
  } catch (err) {
    next(err);
  }
});

router.post("/orders", async (req, res, next) => {
  try {
    const { service = "", name = "", phone = "", email = "", description = "" } = req.body || {};
    if (!String(name).trim() || !String(phone).trim() || !String(email).trim()) {
      return res.status(400).json({ error: "Укажите имя, телефон и e-mail" });
    }
    const saved = await saveOrder({
      service: String(service).trim(),
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim(),
      description: String(description).trim()
    });
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

export default router;
