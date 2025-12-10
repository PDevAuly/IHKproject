// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const infraRoutes = require('./routes/infrastructure');
const uploadRoutes = require('./routes/uploads');
const exportRoutes = require('./routes/export');
const ticketRoutes = require('./routes/ticket');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/infrastructure', infraRoutes);
app.use('/uploads', uploadRoutes);
app.use('/export', exportRoutes);
app.use('/ticket', ticketRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend läuft auf Port ${PORT}`));
