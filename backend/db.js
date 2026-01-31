const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL if available (Railway provides this), otherwise fallback to local or null
// If null, we will use mock data in server.js
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    })
    : null;

module.exports = {
    query: (text, params) => {
        if (!pool) return null; // Signal to use mock data
        return pool.query(text, params);
    },
    isConnected: () => !!pool
};
