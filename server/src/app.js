import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// CLIENT_URL may be a comma-separated list of allowed origins.
const origins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json({ limit: "100kb" }));

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
