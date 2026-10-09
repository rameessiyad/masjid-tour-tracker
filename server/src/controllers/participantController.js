import { pool } from "../config/db.js";
import { validateParticipant } from "../utils/validate.js";

// amount_paid is returned as a number (NUMERIC comes back from pg as a string).
const COLS = "id, name, amount_paid::float8 AS amount_paid";

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, status, message, errors) =>
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    fail(res, 400, "Invalid participant id");
    return null;
  }
  return id;
}

export async function listParticipants(req, res, next) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const { rows } = search
      ? await pool.query(
          `SELECT ${COLS} FROM participants WHERE name ILIKE $1 ORDER BY LOWER(name), id`,
          [`%${search.replace(/[\\%_]/g, "\\$&")}%`]
        )
      : await pool.query(`SELECT ${COLS} FROM participants ORDER BY LOWER(name), id`);
    ok(res, rows);
  } catch (e) {
    next(e);
  }
}

export async function getParticipant(req, res, next) {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const { rows } = await pool.query(`SELECT ${COLS} FROM participants WHERE id = $1`, [id]);
    if (!rows.length) return fail(res, 404, "Participant not found");
    ok(res, rows[0]);
  } catch (e) {
    next(e);
  }
}

export async function createParticipant(req, res, next) {
  try {
    const { errors, value } = validateParticipant(req.body);
    if (Object.keys(errors).length) return fail(res, 400, "Validation failed", errors);
    const { rows } = await pool.query(
      `INSERT INTO participants (name, amount_paid) VALUES ($1, $2) RETURNING ${COLS}`,
      [value.name, value.amount_paid]
    );
    ok(res, rows[0], 201);
  } catch (e) {
    next(e);
  }
}

export async function updateParticipant(req, res, next) {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const { errors, value } = validateParticipant(req.body);
    if (Object.keys(errors).length) return fail(res, 400, "Validation failed", errors);
    const { rows } = await pool.query(
      `UPDATE participants SET name = $1, amount_paid = $2 WHERE id = $3 RETURNING ${COLS}`,
      [value.name, value.amount_paid, id]
    );
    if (!rows.length) return fail(res, 404, "Participant not found");
    ok(res, rows[0]);
  } catch (e) {
    next(e);
  }
}

export async function deleteParticipant(req, res, next) {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const { rowCount } = await pool.query("DELETE FROM participants WHERE id = $1", [id]);
    if (!rowCount) return fail(res, 404, "Participant not found");
    ok(res, { id });
  } catch (e) {
    next(e);
  }
}

export async function getDashboard(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total_participants,
              COALESCE(SUM(amount_paid), 0)::float8 AS total_collected
       FROM participants`
    );
    ok(res, rows[0]);
  } catch (e) {
    next(e);
  }
}

export async function health(req, res) {
  try {
    await pool.query("SELECT 1");
    res.json({ success: true, status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ success: false, status: "error", database: "disconnected" });
  }
}
