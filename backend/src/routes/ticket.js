// backend/src/routes/ticket.js
const express = require('express');
const nodemailer = require('nodemailer');
const pool = require('../db');

const router = express.Router();

router.post('/send/:customerId', async (req, res) => {
  const { customerId } = req.params;

  try {
    // Hier ggf. vorher PDF generieren & lokal speichern oder als Buffer erzeugen
    // Einfachheitshalber: Nur Text-Mail mit Kundendaten

    const customerResult = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [customerId]
    );
    const customer = customerResult.rows[0];

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.TANSS_MAIL,
      subject: `Onboarding: ${customer.company}`,
      text: `Neuer Kunde:\nFirma: ${customer.company}\nStandort: ${customer.location}\nKontakt: ${customer.contact_person}`,
      // attachments: [ { filename:'...', content: pdfBuffer } ]
    });

    res.json({ message: 'Ticket an TANSS gesendet' });
  } catch (err) {
    console.error('Mailfehler', err);
    res.status(500).json({ message: 'Fehler beim Versand an TANSS' });
  }
});

module.exports = router;
