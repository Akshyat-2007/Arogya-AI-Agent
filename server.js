const app = require('./app');
const sequelize = require('./database');

const PORT = process.env.PORT || 5000;

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
