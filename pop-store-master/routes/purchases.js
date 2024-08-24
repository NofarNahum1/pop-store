// File: routes/purchases.js

const express = require('express');
const router = express.Router();
const persist = require('../persist'); // Adjust the path as needed

// Handle purchase
router.post('/', async (req, res) => {
    console.log('req bod')

    console.log(req.body)
    const { username, purchase } = req.body;

    if (!username || !purchase) {
        return res.status(400).json({ error: 'Username and purchase details are required' });
    }

    try {
        await persist.savePurchase(username, purchase);
        res.status(200).json({ message: 'Purchase saved successfully' });
    } catch (error) {
        console.error('Error saving purchase:', error);
        res.status(500).json({ error: 'Failed to save purchase' });
    }
});

module.exports = router;
