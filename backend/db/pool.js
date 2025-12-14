// backend/db/pool.js
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Nur zum Testen, kann später wieder raus:
console.log("✅ PostgreSQL Pool initialisiert");

module.exports = pool;
