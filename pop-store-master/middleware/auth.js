// File: routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { saveUser, userExists, getUserByUsername, getUserRole } = require('../persist');
const verifyToken = require('../middleware/authMiddleware');

// Registration route
router.post('/register', async (req, res) => {
    try {
        const { username, password, isAdmin } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (await userExists(username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await saveUser(username, hashedPassword, isAdmin);

        console.log(`User registered: ${username}`);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ username: user.username, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
            expiresIn: rememberMe ? '10d' : '30m'
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Always use HTTPS
            sameSite: 'strict',
            maxAge: rememberMe ? 10 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000,
        });

        console.log(`User logged in: ${username}, Token: ${token}`);
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    console.log('User logged out');
    res.json({ message: 'Logout successful' });
});

// Check authentication and admin status route
router.get('/check-admin', verifyToken, async (req, res) => {
    try {
        const { username } = req;
        const user = await getUserByUsername(username);
        
        if (!user) {
            return res.status(401).json({ isAdmin: false });
        }

        res.json({ isAdmin: user.isAdmin });
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({ isAdmin: false });
    }
});

module.exports = router;