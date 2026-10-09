export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON in request body" });
  }
  console.error(err);
  const dbDown = ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "57P01", "08006", "08001"].includes(err.code);
  res.status(dbDown ? 503 : 500).json({
    success: false,
    message: dbDown ? "Database is unreachable. Please try again." : "Something went wrong on the server",
  });
}
