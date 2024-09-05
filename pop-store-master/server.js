require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const rateLimit = require('express-rate-limit');
const axios = require('axios'); // Add axios for HTTP requests
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { getPurchases ,removeProduct,saveProduct, getProducts, saveLog, getLogs, getReviews, loadBlacklistedIPs, saveBlacklistedIPs, blacklistedIPs} = require('./persist');
const app = express();
const verifyToken = require('./middleware/authMiddleware');
const verifyAdminToken = require('./middleware/adminAuthMiddleware');
const helmet = require('helmet'); // Import Helmet

// Use Helmet to secure your app by setting various HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            "script-src-attr": ["'unsafe-inline'"], // Allow inline event handlers
            // Add other directives as needed
        }
    }
}));

let myIP = '127.0.0.1'; // Set to loopback address for local testing

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.static('public'));

// Middleware to check if IP is blacklisted
app.use((req, res, next) => {
    const clientIp = req.ip === '::1' ? '127.0.0.1' : req.ip; // Normalize loopback address
    console.log('Request from IP:', clientIp);
    // if (clientIp !== myIP && blacklistedIPs.has(clientIp)) {
    if (blacklistedIPs.has(clientIp)) {
        console.log(`IP blacklisted: ${clientIp}`);
        req.socket.destroy(); // Close the connection immediately
        //return; // Stop further processing
        return res.status(403).send('Your IP has been blacklisted due to excessive requests.');
    }
    next();
});

// Apply rate limiting to all requests
const limiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutes
    max: 600, // Limit each IP to 500 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    handler: async (req, res, next, options) => {
        const clientIp = req.ip === '::1' ? '127.0.0.1' : req.ip; // Normalize loopback address
        if (!blacklistedIPs.has(clientIp)) {
            blacklistedIPs.add(clientIp); // Add IP to blacklist when limit is reached
            await saveBlacklistedIPs(blacklistedIPs); // Save blacklisted IPs to file
            console.log(`IP added to blacklist: ${clientIp}`);
        }
        res.status(options.statusCode).send(options.message);
    },
    skip: (req, res) => req.ip === myIP
});
app.use(limiter);


// Configure session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 } // Session expires after 1 minute for demo purposes
}));


// Route to print blacklisted IPs
app.get('/blacklisted-ips', (req, res) => {
    const clientIp = req.ip === '::1' ? '127.0.0.1' : req.ip;
    if (clientIp === myIP) {
        console.log('Blacklisted IPs:', Array.from(blacklistedIPs));
        res.send('Check the console for the list of blacklisted IPs.');
    } else {
        res.status(403).send('Access denied.');
    }
});


// the /readme.html route
app.get('/readme.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'readme.html'));
});

const POP_OF_THE_MONTH_FILE = path.join(__dirname, 'data', 'pop-of-the-month.json');
let body = {}
// gets the input of the admin and checks if the product is in the products.json file if it is - set the pop of the month
app.post('/api/admin/pop-of-the-month', verifyAdminToken, async (req, res) => {
    const { title, intro } = req.body;
    console.log('body:', req.body); 
    console.log('Received request to set Pop of the Month:', title, intro);

    if (!title || !intro) {
        console.log('Invalid data');
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        const productsData = await fs.readFile(path.join(__dirname, 'data', 'products.json'), 'utf8');
        const products = JSON.parse(productsData);

        const product = products.find(p => p.title === title);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const popOfTheMonth = { title, intro, ...product };
        console.log('Setting Pop of the Month:', popOfTheMonth);
        body = popOfTheMonth;
        
        // Save the Pop of the Month data to a file
        await fs.writeFile(POP_OF_THE_MONTH_FILE, JSON.stringify(popOfTheMonth, null, 2));

        res.status(200).json({ message: 'Pop of the Month set successfully' });
    } catch (error) {
        console.error('Error setting Pop of the Month:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve the data to the new HTML page via a GET request
app.get('/api/pop-of-the-month',  async (req, res) => {
    try {
        const popOfTheMonthData = await fs.readFile(POP_OF_THE_MONTH_FILE, 'utf8');
        const popOfTheMonth = JSON.parse(popOfTheMonthData);
        console.log('Pop of the Month fetched:', popOfTheMonth);
        res.json(popOfTheMonth);

    }catch (error) {
        console.error('Error fetching Pop of the Month:', error);
        res.status(500).json({ error: 'Failed to fetch Pop of the Month' });
        console.log('Failed to fetch Pop of the Month');
    }
  });

const reviewsFilePath = path.join(__dirname, 'data', 'reviews.json');
// gets the input review of the user and saves it to the reviews.json file
app.post('/api/reviews',verifyToken, async (req, res) => {
    const { username, comment } = req.body; 
    
    console.log('Received review:', comment);
    console.log('Username:', username);

    if (!comment) {
        console.log('Invalid review text');
        return res.status(400).json({ error: 'Invalid data' });
    }
    // const reviewData = JSON.stringify({ review: comment }, null, 2);

    try {
        const reviews = await getReviews();
        console.log('Reviews fetched successfully:', reviews);
        // reviews.push({ review: comment });
        reviews.push({ review: comment, username: username });
        // console.log('Setting review:', JSON.stringify(reviews, null, 2));
        await fs.writeFile(reviewsFilePath, JSON.stringify(reviews, null, 2), 'utf8');
        console.log('Successfully wrote to products.json');


    } catch (error) {
        console.error('Error setting the reviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
  });

  
// Serve the data to the new HTML page via a GET request
app.get('/api/admin/reviews', verifyAdminToken, async (req, res) => {
    try {
        const reviews = await getReviews();
        res.json(reviews);
        console.log('Reviews fetched in the GET req: ', reviews);
  
    }catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
        console.log('Failed to fetch reviews');
    }
});

const PurchasesFilePath = path.join(__dirname, 'data', 'users_purchase.json');
// gets the user purchases(purchase details only) from the users_purchase.json file 
app.get('/api/best-sellers', async (req, res) => {
    try {
        const purchases = await getPurchases();
        const purchaseDetails = purchases.map(purchase => purchase.purchase);
        console.log('Purchases fetched in the GET req: ', JSON.stringify(purchaseDetails, null, 2));
        res.json(purchaseDetails);
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        res.status(500).json({ error: 'Failed to fetch best sellers' });
        console.log('Failed to fetch best sellers');
    }
});

// Variable to store the correct guess
let correctGuess = 'groot';

app.post('/api/submit-guess', (req, res) => {
    const { guess } = req.body;
    console.log('Received guess:', guess);

    if (!guess) {
        res.status(400).json({ error: 'Guess is required' });
        return;
    }

    // Initialize guess counter if not present
    if (!req.session.guessCount) {
        req.session.guessCount = 0;
    }
    
    req.session.guessCount++;

    // Check if the user has exceeded the maximum number of guesses
    if (req.session.guessCount > 3) {
        res.json({ message: 'You have exceeded the maximum number of guesses.' });
        return;
    }

    if (guess.toLowerCase() === correctGuess.toLowerCase()) {
        res.json({ message: 'You win! Please provide your details.', win: true });
        // res.json({ message: 'You win!' });
    } else {
        res.json({ message: 'Try again!', win: false });
    }
});


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/images'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

app.post('/api/log', async (req, res) => {
    const { username, activity } = req.body;
    try {
        await saveLog(username, activity);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving log:', error);
        res.status(500).json({ error: 'Failed to save log' });
    }
});

app.post('/api/logout', verifyToken, async (req, res) => {
    try {
        const { username, activity } = req.body;
        // Save logout activity log
        userId = req.username;
        await saveLog(userId, 'logout');

        res.clearCookie('token'); // Clear the token cookie
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/logout', verifyAdminToken, async (req, res) => {
    try {
        const adminId = req.adminUsername;
        await saveLog(adminId, 'admin-logout');

        res.clearCookie('adminToken'); // Clear the admin token cookie
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes); // Ensure this line is correct

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/store', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'store.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/statistics', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'statistics.html'));
});


// Fetch all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await getProducts();
        console.log('Products fetched successfully:', products.length);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Search products
app.get('/api/products/search', async (req, res) => {
    const query = req.query.query.toLowerCase();
    try {
        const products = await getProducts();
        const results = products.filter(p =>
            p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
        );
        res.json(results);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User-specific carts
const userCarts = new Map();
// Get cart items
app.get('/api/cart/items', verifyToken, (req, res) => {
    const userId = req.username; // Changed from req.user.id to req.username
    const userCart = userCarts.get(userId) || [];
    res.json(userCart);
});

// Add product to cart
app.post('/api/cart', verifyToken, async (req, res) => {
    console.log("request body")
    console.log("Username from token:", req.username);

    const userId = req.username;
    console.log()
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Product title is required' });
    }

    try {
        const products = await getProducts();
        const product = products.find(p => p.title.toLowerCase() === title.toLowerCase());

        if (product) {
            if (!userCarts.has(userId)) {
                userCarts.set(userId, []);
            }
            console.log(userId)
            userCarts.get(userId).push(product);
            console.log(userCarts)
            res.json({ success: true, message: 'Product added to cart successfully' });
            await saveLog(userId ,` add-to-cart: "${title}"`);

        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (err) {
        console.error('Error adding product to cart:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

app.delete('/api/cart/delete', verifyToken, (req, res) => {
    const userId = req.username; // Changed from req.user.id to req.username
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Product title is required' });
    }

    const userCart = userCarts.get(userId) || [];
    const index = userCart.findIndex(item => item.title.toLowerCase() === title.toLowerCase());
    if (index !== -1) {
        userCart.splice(index, 1);
        res.json({ success: true, message: 'Product deleted from cart successfully' });
    } else {
        res.status(404).json({ error: 'Product not found in cart' });
    }
});

const purchasesRouter = require('./routes/purchases');
const { Console } = require('console');
app.use('/api/purchase', purchasesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Something broke!', details: err.message });
});

app.post('/api/cart/clear', verifyToken, (req, res) => {
    const userId = req.username; // Changed from req.user.id to req.username
    if (userCarts.has(userId)) {
        userCarts.set(userId, []); // Clear the cart by setting an empty array
    }
    res.json({ success: true, message: 'Cart cleared successfully' });
});



app.use(verifyAdminToken);
app.get('/admin-dashboard', verifyAdminToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});


app.get('/api/admin/logs', verifyAdminToken, async (req, res) => {
    try {
        const filter = req.query.filter || '';
        const logs = await getLogs();
        const filteredLogs = logs.filter(log => log.username && log.username.startsWith(filter));
        res.json(filteredLogs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin routes
app.post('/admin/products', upload.single('image'), async (req, res) => {
    const { title, description, price } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!title || !description || !price) {
        return res.status(400).json({ error: 'Title, description, and price are required' });
    }

    try {
        await saveProduct( title, description, price, image );
        res.json({ success: true, message: 'Product added successfully' });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.delete('/admin/products', verifyAdminToken, async (req, res) => {
    const { title } = req.query;
    if (!title) {
        return res.status(400).json({ error: 'Product title is required' });
    }

    try {
        await removeProduct(title);
        res.json({ success: true, message: 'Product removed successfully' });
    } catch (error) {
        if (error.message === 'Product not found') {
            return res.status(404).json({ error: 'Product not found' });
        }
        console.error('Error removing product:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/api/admin/purchases', verifyAdminToken, async (req, res) => {
    try {
        const purchases = await getPurchases();
        res.json(purchases);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});






app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, async () => {
//     await loadBlacklistedIPs(); // Load blacklisted IPs on server start
//     console.log(`Server running on port ${PORT}`);
// });

// Start the server
const PORT = process.env.PORT || 3000;
loadBlacklistedIPs().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to load blacklisted IPs:', error);
    process.exit(1); // Exit the process if loading blacklisted IPs fails
});

// run with npm start (be inside the dir with the server)
// website in http://localhost:3000/index.html
