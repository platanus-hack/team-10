const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
const whatsappRoutes = require('./routes/whatsappRoutes');
app.use('/whatsapp', whatsappRoutes);

module.exports = app;
