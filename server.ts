
import express = require('express');
import path from 'path';
import cors = require('cors');
import { Pool } from 'pg';
import 'dotenv/config';
import { User } from './types';

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Heroku/Render may require SSL connection for Postgres
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());

// Helper to convert snake_case from DB to camelCase for JS
const toCamelCase = (s: string) => s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

const convertObjectKeys = (obj: any, converter: (key: string) => string): any => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[converter(key)] = obj[key];
        }
    }
    return newObj;
};

// API Routes
app.get('/api/users', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY role DESC, id ASC');
    const camelCaseRows = result.rows.map(row => convertObjectKeys(row, toCamelCase));
    res.json(camelCaseRows);
  } catch (err) {
    console.error('GET /api/users Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    try {
        const newUserDefaults: Omit<User, 'id'> = {
            role: 'user', isSuspended: false, dailyLimit: 20, messageCount: 0,
            lastCountReset: new Date().toISOString().split('T')[0],
        };
        const result = await pool.query(
            'INSERT INTO users (id, role, is_suspended, daily_limit, message_count, last_count_reset) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, newUserDefaults.role, newUserDefaults.isSuspended, newUserDefaults.dailyLimit, newUserDefaults.messageCount, newUserDefaults.lastCountReset]
        );
        res.status(201).json(convertObjectKeys(result.rows[0], toCamelCase));
    } catch (err) {
        console.error('POST /api/users Error:', err);
        res.status(500).json({ error: 'Failed to create user. It may already exist.' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const updates: Partial<User> = req.body;
    
    const dbUpdates: { [key: string]: any } = {};
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isSuspended !== undefined) dbUpdates.is_suspended = updates.isSuspended;
    if (updates.dailyLimit !== undefined) dbUpdates.daily_limit = updates.dailyLimit;
    if (updates.messageCount !== undefined) dbUpdates.message_count = updates.messageCount;
    if (updates.lastCountReset !== undefined) dbUpdates.last_count_reset = updates.lastCountReset;
    
    const fields = Object.keys(dbUpdates);
    if (fields.length === 0) {
        return res.status(400).json({ error: 'No update fields provided' });
    }
    
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = [...Object.values(dbUpdates), id];

    const query = `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    
    try {
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(convertObjectKeys(result.rows[0], toCamelCase));
    } catch (err) {
        console.error(`PUT /api/users/${id} Error:`, err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(204).send(); // No content
    } catch (err) {
        console.error(`DELETE /api/users/${id} Error:`, err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Serve React App from 'dist' directory
const staticDir = path.join(__dirname, '.');
app.use(express.static(staticDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
