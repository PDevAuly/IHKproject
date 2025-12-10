// backend/src/routes/export.js
const express = require('express');
const pool = require('../db');
const PDFDocument = require('pdfkit');

const router = express.Router();

router.get('/pdf/:customerId', async (req, res) => {
  const { customerId } = req.params;

  try {
    const customerResult = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [customerId]
    );
    const infraResult = await pool.query(
      'SELECT * FROM infrastructure WHERE customer_id = $1',
      [customerId]
    );

    const customer = customerResult.rows[0];
    const infra = infraResult.rows[0];

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');

    doc.text(`Kunde: ${customer.company}`);
    doc.text(`Ansprechpartner: ${customer.contact_person}`);
    doc.text(`Standort: ${customer.location}`);
    doc.moveDown();

    doc.text('Infrastruktur:');
    doc.text(`Server: ${infra.server_count}`);
    doc.text(`Firewall: ${infra.firewall}`);
    doc.text(`Benutzer: ${infra.user_count}`);
    doc.text(`Bemerkungen: ${infra.notes || '-'}`);

    doc.end();
    doc.pipe(res);
  } catch (err) {
    console.error('PDF-Fehler', err);
    res.status(500).json({ message: 'Fehler beim PDF-Export' });
  }
});

module.exports = router;
