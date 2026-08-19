const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'arogya_ai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection and auto-initialize database & table
async function testConnection() {
  let connection;
  try {
    // 1. First connect without specifying database to create it if it doesn't exist
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    const dbName = process.env.DB_NAME || 'arogya_ai';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    // 2. Create the users table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(100) NULL,
        hashed_password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createTableQuery);
    console.log(`Connected to MySQL database. Database "${dbName}" and "users" table ensured.`);
  } catch (error) {
    console.error('Error connecting or initializing MySQL database:', error.message);
    console.error('Ensure that the MySQL server is running and the credentials specified in server/.env are correct.');
  } finally {
    if (connection) await connection.end();
  }
}

// User repository functions
const UserRepository = {
  /**
   * Find a user by email.
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Find a user by ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT id, email, username, created_at FROM users WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Create a new user.
   * @param {object} user
   * @param {string} user.email
   * @param {string} user.username
   * @param {string} user.hashedPassword
   * @returns {Promise<number>} Returns the ID of the created user.
   */
  async create({ email, username, hashedPassword }) {
    const [result] = await pool.query(
      'INSERT INTO users (email, username, hashed_password) VALUES (?, ?, ?)',
      [email, username || null, hashedPassword]
    );
    return result.insertId;
  }
};

module.exports = {
  pool,
  testConnection,
  UserRepository
};
