const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const router = express.Router();
const { saveAdmin, adminExists } = require('../persist');

// Load environment variables
require('dotenv').config();

// Admin login
router.post('/login', async (req, res) => {
    const { username, password, rememberMe } = req.body;

    try {
        const data = await fs.readFile('data/admin.json', 'utf8');
        const admins = JSON.parse(data);
        const admin = admins.find(admin => admin.username === username);

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ username: admin.username, role: 'admin' }, process.env.JWT_SECRET, {
            expiresIn: rememberMe ? '10d' : '30m'
        });

        res.json({ token });
    } catch (err) {
        console.error('Error during admin login:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// Verify admin token
router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token missing.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
        }

        // Token is valid
        res.json({ success: true });
    });
});


router.post('/add-admin', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const adminAlreadyExists = await adminExists(username);
        if (adminAlreadyExists) {
            return res.status(400).json({ error: 'Admin already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await saveAdmin(username, hashedPassword);
        res.status(201).json({ success: true, message: 'Admin created successfully' });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});





module.exports = router;
