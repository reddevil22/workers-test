import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();

// Users table schema:
// id TEXT PRIMARY KEY (UUID), first_name TEXT, last_name TEXT, email TEXT UNIQUE, role TEXT, created_at DATETIME

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Ensure table exists helper
async function ensureTable(env: Env) {
  try {
    await env.D1.prepare(
      `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            first_name TEXT,
            last_name TEXT,
            email TEXT UNIQUE,
            role TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    ).run();
  } catch (err) {
    console.error("D1 ensureTable error", err);
    throw err;
  }
}

app.get("/api/users", async (c) => {
  const env = c.env as Env;
  await ensureTable(env);
  const res = await env.D1.prepare(
    "SELECT * FROM users ORDER BY id DESC"
  ).all();
  return c.json({ users: res.results });
});

app.post("/api/users", async (c) => {
  const env = c.env as Env;
  await ensureTable(env);
  const body = await c.req.json();
  const { first_name, last_name, email, role } = body;
  if (!email) return c.text("email required", 400);
  // Check for existing email to return a friendly 409 conflict
  const existing = await env.D1.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first();
  if (existing) return c.text("email already exists", 409);
  const id = crypto.randomUUID();
  try {
    await env.D1.prepare(
      "INSERT INTO users (id, first_name, last_name, email, role) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(id, first_name || null, last_name || null, email, role || "user")
      .run();
  } catch (err: unknown) {
    // Detect D1 unique constraint error and return 409
    if (
      err instanceof Error &&
      err.message.includes("UNIQUE constraint failed")
    ) {
      return c.text("email already exists", 409);
    }
    console.error("D1 insert error", err);
    throw err;
  }
  const row = await env.D1.prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first();
  return c.json({ user: row });
});

app.get("/api/users/:id", async (c) => {
  const env = c.env as Env;
  await ensureTable(env);
  const id = c.req.param("id");
  const row = await env.D1.prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first();
  if (!row) return c.text("not found", 404);
  return c.json({ user: row });
});

app.put("/api/users/:id", async (c) => {
  const env = c.env as Env;
  await ensureTable(env);
  const id = c.req.param("id");
  const body = await c.req.json();
  const { first_name, last_name, email, role } = body;
  await env.D1.prepare(
    "UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = COALESCE(?, email), role = COALESCE(?, role) WHERE id = ?"
  )
    .bind(
      first_name || null,
      last_name || null,
      email || null,
      role || null,
      id
    )
    .run();
  const row = await env.D1.prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first();
  if (!row) return c.text("not found", 404);
  return c.json({ user: row });
});

app.delete("/api/users/:id", async (c) => {
  const env = c.env as Env;
  await ensureTable(env);
  const id = c.req.param("id");
  await env.D1.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  return c.text("deleted");
});

export default app;
