// backend/server.js

require("dotenv").config(); // .env laden

const express = require("express");
const cors = require("cors");
const pool = require("./db/pool");
const bcrypt = require("bcrypt");  
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const multer = require("multer");


const app = express();
const PORT = process.env.PORT || 5000;

// Upload-Verzeichnis sicherstellen
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer-Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // z.B. 1700000000000_originalname.pdf
    const uniquePrefix = Date.now();
    const safeOriginal = file.originalname.replace(/\s+/g, "_");
    cb(null, `${uniquePrefix}_${safeOriginal}`);
  },
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());

// Debug-Logger
app.use((req, res, next) => {
  console.log("Request:", req.method, req.url);
  next();
});

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || "devsecret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}


// Health-Check (GET)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend mit DB-Anbindung läuft" });
});

// DB-Test (GET)
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({
      ok: true,
      message: "DB-Verbindung erfolgreich",
      now: result.rows[0].now,
    });
  } catch (err) {
    console.error("DB-Test Fehler:", err);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

// Test-Register-Route (POST) – noch ohne DB-Insert!
app.post("/api/auth/register", async (req, res) => {
  console.log("🔥 /api/auth/register wurde aufgerufen, body:", req.body);
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email und Passwort sind Pflichtfelder." });
    }

    // Prüfen, ob User bereits existiert
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "Ein Benutzer mit dieser E-Mail existiert bereits." });
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 10);

    // User in DB speichern
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name || null, email, passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: "Benutzer erfolgreich registriert.",
      user,
      token,
    });
  } catch (err) {
    console.error("Register-Fehler:", err);
    res
      .status(500)
      .json({ message: "Interner Serverfehler bei der Registrierung." });
  }
});

// Login eines bestehenden Users
app.post("/api/auth/login", async (req, res) => {
  console.log("🔥 /api/auth/login wurde aufgerufen, body:", req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email und Passwort sind Pflichtfelder." });
    }

    // User aus DB holen
    const result = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Ungültige Zugangsdaten." });
    }

    const user = result.rows[0];

    // Passwort prüfen
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ message: "Ungültige Zugangsdaten." });
    }

    const token = generateToken(user);

    res.json({
      message: "Login erfolgreich.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error("Login-Fehler:", err);
    res
      .status(500)
      .json({ message: "Interner Serverfehler beim Login." });
  }
});

// Neuen Kunden anlegen
app.post("/api/customers", async (req, res) => {
  console.log("🔥 /api/customers (POST) wurde aufgerufen, body:", req.body);
  try {
    const {
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      street,
      zip_code,
      city,
      notes,
    } = req.body;

    if (!company_name) {
      return res
        .status(400)
        .json({ message: "Firmenname (company_name) ist Pflicht." });
    }

    const result = await pool.query(
      `INSERT INTO customers
       (company_name, contact_name, contact_email, contact_phone, street, zip_code, city, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, company_name, contact_name, contact_email, contact_phone, street, zip_code, city, notes, created_at`,
      [
        company_name,
        contact_name || null,
        contact_email || null,
        contact_phone || null,
        street || null,
        zip_code || null,
        city || null,
        notes || null,
      ]
    );

    res.status(201).json({
      message: "Kunde erfolgreich angelegt.",
      customer: result.rows[0],
    });
  } catch (err) {
    console.error("Customer-POST-Fehler:", err);
    res.status(500).json({ message: "Fehler beim Anlegen des Kunden." });
  }
});

// Alle Kunden abrufen
app.get("/api/customers", async (req, res) => {
  console.log("🔥 /api/customers (GET) wurde aufgerufen");
  try {
    const result = await pool.query(
      `SELECT id, company_name, contact_name, contact_email, contact_phone,
              street, zip_code, city, notes, created_at
       FROM customers
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Customer-GET-Fehler:", err);
    res.status(500).json({ message: "Fehler beim Laden der Kunden." });
  }
});



// Infrastruktur-Eintrag anlegen
app.post("/api/infrastructure", async (req, res) => {
  console.log("🔥 /api/infrastructure (POST) wurde aufgerufen, body:", req.body);
  try {
    const {
      customer_id,
      system_name,
      system_type,
      os_version,
      ip_address,
      location,
      notes,
    } = req.body;

    if (!customer_id || !system_name) {
      return res
        .status(400)
        .json({ message: "customer_id und system_name sind Pflichtfelder." });
    }

    const result = await pool.query(
      `INSERT INTO infrastructure
       (customer_id, system_name, system_type, os_version, ip_address, location, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, customer_id, system_name, system_type, os_version,
                 ip_address, location, notes, created_at`,
      [
        customer_id,
        system_name,
        system_type || null,
        os_version || null,
        ip_address || null,
        location || null,
        notes || null,
      ]
    );

    res.status(201).json({
      message: "Infrastruktur-Eintrag erfolgreich angelegt.",
      infrastructure: result.rows[0],
    });
  } catch (err) {
    console.error("Infrastructure-POST-Fehler:", err);
    res
      .status(500)
      .json({ message: "Fehler beim Anlegen des Infrastruktur-Eintrags." });
  }
});

// Infrastruktur eines Kunden abrufen
app.get("/api/infrastructure", async (req, res) => {
  console.log("🔥 /api/infrastructure (GET) wurde aufgerufen, query:", req.query);
  try {
    const { customer_id } = req.query;

    if (!customer_id) {
      return res
        .status(400)
        .json({ message: "customer_id muss als Query-Parameter übergeben werden." });
    }

    const result = await pool.query(
      `SELECT id, customer_id, system_name, system_type, os_version,
              ip_address, location, notes, created_at
       FROM infrastructure
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
      [customer_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Infrastructure-GET-Fehler:", err);
    res
      .status(500)
      .json({ message: "Fehler beim Laden der Infrastruktur-Daten." });
  }
});

// Datei-Upload für einen Kunden
app.post("/api/upload", upload.single("file"), async (req, res) => {
  console.log("🔥 /api/upload wurde aufgerufen, body:", req.body);
  try {
    const { customer_id } = req.body;
    const file = req.file;

    if (!customer_id) {
      return res.status(400).json({ message: "customer_id ist erforderlich." });
    }
    if (!file) {
      return res.status(400).json({ message: "Es wurde keine Datei hochgeladen." });
    }

    const result = await pool.query(
      `INSERT INTO uploads
       (customer_id, file_name, original_name, mime_type, file_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, customer_id, file_name, original_name, mime_type, file_size, uploaded_at`,
      [
        customer_id,
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
      ]
    );

    res.status(201).json({
      message: "Datei erfolgreich hochgeladen.",
      upload: result.rows[0],
    });
  } catch (err) {
    console.error("Upload-Fehler:", err);
    res.status(500).json({ message: "Fehler beim Hochladen der Datei." });
  }
});

// Alle Uploads eines Kunden abrufen
app.get("/api/uploads", async (req, res) => {
  console.log("🔥 /api/uploads (GET) wurde aufgerufen, query:", req.query);
  try {
    const { customer_id } = req.query;

    if (!customer_id) {
      return res
        .status(400)
        .json({ message: "customer_id muss als Query-Parameter übergeben werden." });
    }

    const result = await pool.query(
      `SELECT id, customer_id, file_name, original_name, mime_type, file_size, uploaded_at
       FROM uploads
       WHERE customer_id = $1
       ORDER BY uploaded_at DESC`,
      [customer_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Uploads-GET-Fehler:", err);
    res.status(500).json({ message: "Fehler beim Laden der Uploads." });
  }
});


app.listen(PORT, () => {
  console.log(`Backend läuft auf Port ${PORT}`);
});
