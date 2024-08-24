// File: middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.token || req.headers['x-auth-token'];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Failed to authenticate token' });
        }

        req.username = decoded.username; // Ensure `username` is extracted from the token
        req.isAdmin = decoded.isAdmin; // Optional: Extract `isAdmin` if needed
        next();
    });
}

module.exports = verifyToken;
