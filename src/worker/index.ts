import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
const app = new Hono<{ Bindings: Env }>();

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET = "your-super-secret-jwt-key-change-in-production";

// Authentication middleware
const authMiddleware = jwt({
  secret: JWT_SECRET,
});

// Users table schema:
// id TEXT PRIMARY KEY (UUID), first_name TEXT, last_name TEXT, email TEXT UNIQUE, role TEXT, password_hash TEXT, created_at DATETIME

// Customers table schema (South African market specific):
// id TEXT PRIMARY KEY, user_id TEXT UNIQUE, customer_number TEXT UNIQUE, account_number TEXT UNIQUE,
// title TEXT, first_name TEXT NOT NULL, last_name TEXT NOT NULL, id_number TEXT, passport_number TEXT,
// date_of_birth DATE, nationality TEXT DEFAULT 'South African', email TEXT UNIQUE, phone TEXT, mobile TEXT NOT NULL,
// whatsapp_number TEXT, address_line1 TEXT, address_line2 TEXT, suburb TEXT, city TEXT NOT NULL,
// province TEXT NOT NULL, postal_code TEXT NOT NULL, complex_name TEXT, unit_number TEXT,
// street_number TEXT, street_name TEXT, company_name TEXT, company_registration_number TEXT, tax_number TEXT,
// vat_number TEXT, customer_type TEXT DEFAULT 'residential', status TEXT DEFAULT 'active',
// registration_date DATETIME DEFAULT CURRENT_TIMESTAMP, credit_vetted BOOLEAN DEFAULT false,
// credit_limit DECIMAL(10,2), payment_method TEXT, banking_details TEXT, contract_start_date DATE,
// contract_end_date DATE, preferred_language TEXT DEFAULT 'english', communication_preference TEXT DEFAULT 'sms',
// marketing_consent BOOLEAN DEFAULT false, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
// updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, created_by TEXT, last_modified_by TEXT

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Ensure table exists helper
async function ensureTable(env: Env) {
  try {
    // Try to add the password_hash column (will fail if it already exists)
    try {
      await env.D1.prepare(
        "ALTER TABLE users ADD COLUMN password_hash TEXT"
      ).run();
      console.log("Added password_hash column to existing users table");
    } catch (err: Error | unknown) {
      // Column might already exist, which is fine
      if (
        err instanceof Error &&
        (!err.message || !err.message.includes("duplicate column name"))
      ) {
        console.log("Column might already exist or other error:", err.message);
      }
    }

    // Create new table if it doesn't exist
    await env.D1.prepare(
      `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            first_name TEXT,
            last_name TEXT,
            email TEXT UNIQUE,
            role TEXT,
            password_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    ).run();

    // Create customers table for South African market
    await env.D1.prepare(
      `CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE,
            customer_number TEXT UNIQUE,
            account_number TEXT UNIQUE,
            title TEXT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            id_number TEXT,
            passport_number TEXT,
            date_of_birth DATE,
            nationality TEXT DEFAULT 'South African',
            email TEXT UNIQUE,
            phone TEXT,
            mobile TEXT NOT NULL,
            whatsapp_number TEXT,
            address_line1 TEXT,
            address_line2 TEXT,
            suburb TEXT,
            city TEXT NOT NULL,
            province TEXT NOT NULL,
            postal_code TEXT NOT NULL,
            complex_name TEXT,
            unit_number TEXT,
            street_number TEXT,
            street_name TEXT,
            company_name TEXT,
            company_registration_number TEXT,
            tax_number TEXT,
            vat_number TEXT,
            customer_type TEXT DEFAULT 'residential',
            status TEXT DEFAULT 'active',
            registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            credit_vetted BOOLEAN DEFAULT false,
            credit_limit DECIMAL(10,2),
            payment_method TEXT,
            banking_details TEXT,
            contract_start_date DATE,
            contract_end_date DATE,
            preferred_language TEXT DEFAULT 'english',
            communication_preference TEXT DEFAULT 'sms',
            marketing_consent BOOLEAN DEFAULT false,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            last_modified_by TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`
    ).run();
  } catch (err) {
    console.error("D1 ensureTable error", err);
    throw err;
  }
}

// Authentication endpoints
app.post("/api/auth/login", async (c) => {
  const env = c.env as Env;
  await ensureTable(env);
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const user = await env.D1.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first();

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  // For demo purposes, if no password hash exists, create one with "password123"
  if (!user.password_hash) {
    const passwordHash = await hashPassword("password123");
    await env.D1.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
      .bind(passwordHash, user.id)
      .run();
    user.password_hash = passwordHash;
  }

  const isValid = await verifyPassword(password, user.password_hash as string);
  if (!isValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = await sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    },
    JWT_SECRET
  );

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
  });
});

app.post("/api/auth/register", async (c) => {
  const env = c.env as Env;
  await ensureTable(env);
  const body = await c.req.json();
  const { first_name, last_name, email, password, role = "user" } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  // Check for existing email
  const existing = await env.D1.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first();
  if (existing) {
    return c.json({ error: "Email already exists" }, 409);
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  try {
    await env.D1.prepare(
      "INSERT INTO users (id, first_name, last_name, email, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(
        id,
        first_name || null,
        last_name || null,
        email,
        role,
        passwordHash
      )
      .run();
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes("UNIQUE constraint failed")
    ) {
      return c.json({ error: "Email already exists" }, 409);
    }
    console.error("D1 insert error", err);
    throw err;
  }

  const row = await env.D1.prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first();

  if (!row) {
    return c.json({ error: "Failed to create user" }, 500);
  }

  const token = await sign(
    {
      sub: row.id,
      email: row.email,
      role: row.role,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
    JWT_SECRET
  );

  return c.json({
    token,
    user: {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      role: row.role,
    },
  });
});

app.get("/api/auth/me", authMiddleware, async (c) => {
  const env = c.env as Env;
  const payload = c.get("jwtPayload");

  const user = await env.D1.prepare(
    "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?"
  )
    .bind(payload.sub)
    .first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
});

// Protected user management endpoints
app.get("/api/users", authMiddleware, async (c) => {
  const env = c.env as Env;
  const payload = c.get("jwtPayload");

  // Only admins can view all users
  if (payload.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  await ensureTable(env);
  const res = await env.D1.prepare(
    "SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY id DESC"
  ).all();
  return c.json({ users: res.results });
});

app.post("/api/users", authMiddleware, async (c) => {
  const env = c.env as Env;
  const payload = c.get("jwtPayload");

  // Only admins can create users
  if (payload.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  await ensureTable(env);
  const body = await c.req.json();
  const { first_name, last_name, email, role, password } = body;

  if (!email) return c.json({ error: "Email required" }, 400);
  if (!password) return c.json({ error: "Password required" }, 400);

  // Check for existing email
  const existing = await env.D1.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first();
  if (existing) return c.json({ error: "Email already exists" }, 409);

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  try {
    await env.D1.prepare(
      "INSERT INTO users (id, first_name, last_name, email, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(
        id,
        first_name || null,
        last_name || null,
        email,
        role || "user",
        passwordHash
      )
      .run();
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes("UNIQUE constraint failed")
    ) {
      return c.json({ error: "Email already exists" }, 409);
    }
    console.error("D1 insert error", err);
    throw err;
  }

  const row = await env.D1.prepare(
    "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?"
  )
    .bind(id)
    .first();
  return c.json({ user: row });
});

app.get("/api/users/:id", authMiddleware, async (c) => {
  const env = c.env as Env;
  const payload = c.get("jwtPayload");
  const id = c.req.param("id");

  // Users can view their own profile, admins can view any
  if (payload.role !== "admin" && payload.sub !== id) {
    return c.json({ error: "Access denied" }, 403);
  }

  await ensureTable(env);
  const row = await env.D1.prepare(
    "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json({ user: row });
});

app.put("/api/users/:id", authMiddleware, async (c) => {
  const env = c.env as Env;
  const payload = c.get("jwtPayload");
  const id = c.req.param("id");
  const body = await c.req.json();
  const { first_name, last_name, email, role } = body;

  // Users can update their own profile (except role), admins can update any
  if (payload.role !== "admin" && payload.sub !== id) {
    return c.json({ error: "Access denied" }, 403);
  }

  if (payload.role !== "admin" && role !== undefined) {
    return c.json({ error: "Cannot change role" }, 403);
  }

  await ensureTable(env);
  await env.D1.prepare(
    "UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = COALESCE(?, email), role = COALESCE(?, role) WHERE id = ?"
  )
    .bind(
      first_name || null,
      last_name || null,
      email || null,
      payload.role === "admin" ? role || null : null,
      id
    )
    .run();
  const row = await env.D1.prepare(
    "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json({ user: row });
});

app.delete("/api/users/:id", authMiddleware, async (c) => {
  const env = c.env as Env;
  const payload = c.get("jwtPayload");
  const id = c.req.param("id");

  // Only admins can delete users
  if (payload.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  await ensureTable(env);
  await env.D1.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  return c.json({ message: "deleted" });
});

// Customer management endpoints
app.get("/api/customers", authMiddleware, async (c) => {
  const env = c.env as Env;
  const payload = c.get("jwtPayload");
  const url = new URL(c.req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const province = url.searchParams.get("province") || "";

  // Only admins and support agents can view customers
  if (payload.role !== "admin" && payload.role !== "support") {
    return c.json({ error: "Admin or support access required" }, 403);
  }

  await ensureTable(env);

  let query = "SELECT * FROM customers WHERE 1=1";
  const params: (string | number)[] = [];

  if (search) {
    query +=
      " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR customer_number LIKE ? OR mobile LIKE ?)";
    const searchPattern = `%${search}%`;
    params.push(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern
    );
  }

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  if (province) {
    query += " AND province = ?";
    params.push(province);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const customers = await env.D1.prepare(query)
    .bind(...params)
    .all();

  // Get total count for pagination
  let countQuery = "SELECT COUNT(*) as total FROM customers WHERE 1=1";
  const countParams: (string | number)[] = [];

  if (search) {
    countQuery +=
      " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR customer_number LIKE ? OR mobile LIKE ?)";
    const searchPattern = `%${search}%`;
    countParams.push(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern
    );
  }

  if (status) {
    countQuery += " AND status = ?";
    countParams.push(status);
  }

  if (province) {
    countQuery += " AND province = ?";
    countParams.push(province);
  }

  const countResult = await env.D1.prepare(countQuery)
    .bind(...countParams)
    .first();
  const total = Number(countResult?.total) || 0;

  return c.json({
    customers: customers.results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

app.post("/api/customers", authMiddleware, async (c) => {
  const env = c.env as Env;
  const payload = c.get("jwtPayload");

  // Only admins can create customers
  if (payload.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  await ensureTable(env);
  const body = await c.req.json();

  const {
    title,
    first_name,
    last_name,
    id_number,
    passport_number,
    date_of_birth,
    nationality,
    email,
    phone,
    mobile,
    whatsapp_number,
    address_line1,
    address_line2,
    suburb,
    city,
    province,
    postal_code,
    complex_name,
    unit_number,
    street_number,
    street_name,
    company_name,
    company_registration_number,
    tax_number,
    vat_number,
    customer_type,
    credit_limit,
    payment_method,
    banking_details,
    contract_start_date,
    contract_end_date,
    preferred_language,
    communication_preference,
    marketing_consent,
  } = body;

  // Validation
  if (!first_name || !last_name) {
    return c.json({ error: "First name and last name are required" }, 400);
  }

  if (!mobile) {
    return c.json({ error: "Mobile number is required" }, 400);
  }

  if (!city || !province || !postal_code) {
    return c.json(
      { error: "City, province, and postal code are required" },
      400
    );
  }

  // Generate unique customer and account numbers
  const customerNumber = `CUST-${Date.now().toString().slice(-6)}`;
  const accountNumber = `ACC-${Date.now().toString().slice(-8)}`;
  const id = crypto.randomUUID();

  try {
    await env.D1.prepare(
      `INSERT INTO customers (
        id, user_id, customer_number, account_number, title, first_name, last_name,
        id_number, passport_number, date_of_birth, nationality, email, phone, mobile,
        whatsapp_number, address_line1, address_line2, suburb, city, province, postal_code,
        complex_name, unit_number, street_number, street_name, company_name,
        company_registration_number, tax_number, vat_number, customer_type, credit_limit,
        payment_method, banking_details, contract_start_date, contract_end_date,
        preferred_language, communication_preference, marketing_consent, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        payload.sub, // created_by
        customerNumber,
        accountNumber,
        title || null,
        first_name,
        last_name,
        id_number || null,
        passport_number || null,
        date_of_birth || null,
        nationality || "South African",
        email || null,
        phone || null,
        mobile,
        whatsapp_number || null,
        address_line1 || null,
        address_line2 || null,
        suburb || null,
        city,
        province,
        postal_code,
        complex_name || null,
        unit_number || null,
        street_number || null,
        street_name || null,
        company_name || null,
        company_registration_number || null,
        tax_number || null,
        vat_number || null,
        customer_type || "residential",
        credit_limit || null,
        payment_method || null,
        banking_details || null,
        contract_start_date || null,
        contract_end_date || null,
        preferred_language || "english",
        communication_preference || "sms",
        marketing_consent || false,
        payload.sub
      )
      .run();
  } catch (err: unknown) {
    console.error("D1 customer insert error", err);
    return c.json({ error: "Failed to create customer" }, 500);
  }

  const customer = await env.D1.prepare("SELECT * FROM customers WHERE id = ?")
    .bind(id)
    .first();

  return c.json({ customer });
});

app.get("/api/customers/:id", authMiddleware, async (c) => {
  const env = c.env as Env;
  const payload = c.get("jwtPayload");
  const id = c.req.param("id");

  // Only admins and support agents can view customer details
  if (payload.role !== "admin" && payload.role !== "support") {
    return c.json({ error: "Admin or support access required" }, 403);
  }

  await ensureTable(env);
  const customer = await env.D1.prepare("SELECT * FROM customers WHERE id = ?")
    .bind(id)
    .first();

  if (!customer) {
    return c.json({ error: "Customer not found" }, 404);
  }

  return c.json({ customer });
});

app.put("/api/customers/:id", authMiddleware, async (c) => {
  const env = c.env as Env;
  const payload = c.get("jwtPayload");
  const id = c.req.param("id");
  const body = await c.req.json();

  // Only admins can update customers
  if (payload.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  await ensureTable(env);

  const {
    title,
    first_name,
    last_name,
    id_number,
    passport_number,
    date_of_birth,
    nationality,
    email,
    phone,
    mobile,
    whatsapp_number,
    address_line1,
    address_line2,
    suburb,
    city,
    province,
    postal_code,
    complex_name,
    unit_number,
    street_number,
    street_name,
    company_name,
    company_registration_number,
    tax_number,
    vat_number,
    customer_type,
    status,
    credit_limit,
    payment_method,
    banking_details,
    contract_start_date,
    contract_end_date,
    preferred_language,
    communication_preference,
    marketing_consent,
  } = body;

  try {
    await env.D1.prepare(
      `UPDATE customers SET
        title = COALESCE(?, title),
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        id_number = COALESCE(?, id_number),
        passport_number = COALESCE(?, passport_number),
        date_of_birth = COALESCE(?, date_of_birth),
        nationality = COALESCE(?, nationality),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        mobile = COALESCE(?, mobile),
        whatsapp_number = COALESCE(?, whatsapp_number),
        address_line1 = COALESCE(?, address_line1),
        address_line2 = COALESCE(?, address_line2),
        suburb = COALESCE(?, suburb),
        city = COALESCE(?, city),
        province = COALESCE(?, province),
        postal_code = COALESCE(?, postal_code),
        complex_name = COALESCE(?, complex_name),
        unit_number = COALESCE(?, unit_number),
        street_number = COALESCE(?, street_number),
        street_name = COALESCE(?, street_name),
        company_name = COALESCE(?, company_name),
        company_registration_number = COALESCE(?, company_registration_number),
        tax_number = COALESCE(?, tax_number),
        vat_number = COALESCE(?, vat_number),
        customer_type = COALESCE(?, customer_type),
        status = COALESCE(?, status),
        credit_limit = COALESCE(?, credit_limit),
        payment_method = COALESCE(?, payment_method),
        banking_details = COALESCE(?, banking_details),
        contract_start_date = COALESCE(?, contract_start_date),
        contract_end_date = COALESCE(?, contract_end_date),
        preferred_language = COALESCE(?, preferred_language),
        communication_preference = COALESCE(?, communication_preference),
        marketing_consent = COALESCE(?, marketing_consent),
        updated_at = CURRENT_TIMESTAMP,
        last_modified_by = ?
        WHERE id = ?`
    )
      .bind(
        title || null,
        first_name || null,
        last_name || null,
        id_number || null,
        passport_number || null,
        date_of_birth || null,
        nationality || null,
        email || null,
        phone || null,
        mobile || null,
        whatsapp_number || null,
        address_line1 || null,
        address_line2 || null,
        suburb || null,
        city || null,
        province || null,
        postal_code || null,
        complex_name || null,
        unit_number || null,
        street_number || null,
        street_name || null,
        company_name || null,
        company_registration_number || null,
        tax_number || null,
        vat_number || null,
        customer_type || null,
        status || null,
        credit_limit || null,
        payment_method || null,
        banking_details || null,
        contract_start_date || null,
        contract_end_date || null,
        preferred_language || null,
        communication_preference || null,
        marketing_consent || null,
        payload.sub,
        id
      )
      .run();
  } catch (err: unknown) {
    console.error("D1 customer update error", err);
    return c.json({ error: "Failed to update customer" }, 500);
  }

  const customer = await env.D1.prepare("SELECT * FROM customers WHERE id = ?")
    .bind(id)
    .first();

  return c.json({ customer });
});

app.delete("/api/customers/:id", authMiddleware, async (c) => {
  const env = c.env as Env;
  const payload = c.get("jwtPayload");
  const id = c.req.param("id");

  // Only admins can delete customers
  if (payload.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  await ensureTable(env);

  // Check if customer exists
  const customer = await env.D1.prepare("SELECT id FROM customers WHERE id = ?")
    .bind(id)
    .first();

  if (!customer) {
    return c.json({ error: "Customer not found" }, 404);
  }

  await env.D1.prepare("DELETE FROM customers WHERE id = ?").bind(id).run();

  return c.json({ message: "Customer deleted successfully" });
});

export default app;
