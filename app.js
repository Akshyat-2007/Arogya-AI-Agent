const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
require('./models'); // Load models & associations

const app = express();

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS Template Engine and Layouts Setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout'); // Defaults to views/layout.ejs

// Serve Static Files
app.use('/static', express.static(path.join(__dirname, 'dist', 'static')));

// Register Routes
app.use('/', require('./routes/web'));
app.use('/api', require('./routes/api'));

module.exports = app;
