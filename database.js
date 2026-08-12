const { Sequelize } = require('sequelize');
const Config = require('./config');
const path = require('path');

let sequelize;

if (Config.DATABASE_URL.startsWith('sqlite:')) {
  // Extract storage path from SQLite URL
  // e.g., sqlite:///path/to/file or sqlite:////tmp/file
  let storagePath;
  if (process.env.VERCEL === '1' || process.env.NETLIFY === 'true') {
    storagePath = '/tmp/nutrition_agent.db';
  } else {
    storagePath = path.join(__dirname, 'instance', 'nutrition_agent.db');
  }
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });
} else {
  // Handles external hosted databases (PostgreSQL/MySQL) if configured
  sequelize = new Sequelize(Config.DATABASE_URL, {
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
}

module.exports = sequelize;
