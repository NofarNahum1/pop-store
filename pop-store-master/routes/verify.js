const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

// Middleware to parse JSON bodies
router.use(express.json());

router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.log("i am here")
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log("i am there")

    return res.status(401).json({ success: false, message: 'Token missing.' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
        console.log("lol")

      return res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
    }

    // Token is valid
    console.log("ok")

    res.json({ success: true });
  });
});

module.exports = router;
