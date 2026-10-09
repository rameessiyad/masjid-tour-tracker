import "./config/db.js"; // loads dotenv first
import app from "./app.js";
import { initSchema, pool } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await initSchema();
    console.log("Database ready");
  } catch (err) {
    console.error("Could not connect to the database:", err.message);
    process.exit(1);
  }
  const server = app.listen(PORT, () => console.log(`API running on port ${PORT}`));

  const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
