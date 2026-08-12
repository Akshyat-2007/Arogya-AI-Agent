const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const sequelize = require('./database');
require('./models'); // Load models & associations

const app = express();
const PORT = process.env.PORT || 5000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS Template Engine and Layouts Setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout'); // Defaults to views/layout.ejs

// Serve Static Files
app.use('/static', express.static(path.join(__dirname, 'static')));

// Register Routes
app.use('/', require('./routes/web'));
app.use('/api', require('./routes/api'));

// Sync Database Tables and Start Server
sequelize.sync({ alter: false, force: false })
  .then(() => {
    console.log('Database tables synced successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Localhost Link: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });
