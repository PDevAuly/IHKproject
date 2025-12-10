// backend/src/routes/customers.js
const express = require('express');
const pool = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { company, contact_person, phone, email, location } = req.body;

  if (!company || !contact_person) {
    return res.status(400).json({ message: 'Pflichtfelder fehlen' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers (company, contact_person, phone, email, location)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [company, contact_person, phone, email, location]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Kundenanlage Fehler', err);
    res.status(500).json({ message: 'Fehler beim Speichern des Kunden' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Fehler beim Laden der Kunden' });
  }
});

module.exports = router;
