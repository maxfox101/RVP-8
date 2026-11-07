/** Логирует каждый запрос: метод, путь, код ответа и время. */
export function requestLogger(req, res, next) {
  const started = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - started;
    console.log(`[API] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms} ms)`);
  });
  next();
}
