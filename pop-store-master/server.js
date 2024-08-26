require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { getPurchases ,removeProduct,saveProduct, getProducts, saveLog, getLogs } = require('./persist');
const app = express();
const verifyToken = require('./middleware/authMiddleware');
const verifyAdminToken = require('./middleware/adminAuthMiddleware');
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const getPopOfTheMonth = async () => {
    try {
        const filePath = path.join(__dirname, 'data', 'products.json');
        const data = await fs.readFile(filePath, 'utf8');
        console.log('Data:', data);
        const products = JSON.parse(data);
        console.log('Products fetched successfully:', products.type);

        // Find the product with the title "Ladypool"
        const ladypool = products.find(product => product.title === "Ladypool");
        // Return the Ladypool object or an appropriate message if not found
        return ladypool || { message: "Ladypool not found" };
    } catch (error) {
        console.error('Error reading or parsing the JSON file:', error);
        throw error;
    }
};

// Endpoint to fetch Pop! of the Month
app.get('/api/pop-of-the-month', async (req, res) => {
    console.log('Received request for Pop of the Month');
    try {
        const popOfTheMonth = await getPopOfTheMonth(); // fetches the Pop of the Month from products.json
        console.log('Fetched Pop of the Month:', popOfTheMonth);
        res.setHeader('Content-Type', 'application/json');
        res.json(popOfTheMonth);
    } catch (error) {
        console.error('Error fetching Pop of the Month:', error);
        res.status(500).json({ error: 'Failed to fetch Pop of the Month' });
        console.log('Failed to fetch Pop of the Month');
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

app.post('/api/logout', verifyToken,async (req, res) => {
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


// Route to generate and serve top-selling products
app.get('/api/generate-top-selling-products', async (req, res) => {
    try {
        // Read and parse the purchase data
        const data = await fs.readFile('users_purchase.json', 'utf8');
        const purchases = JSON.parse(data);

        // Count the occurrences of each product
        const productCount = {};
        purchases.forEach(entry => {
            const items = entry.purchase || [];
            items.forEach(item => {
                const title = item.title;
                if (title) {
                    if (!productCount[title]) {
                        productCount[title] = 0;
                    }
                    productCount[title]++;
                }
            });
        });

        // Sort the products by count in descending order and get the top 3
        const topProducts = Object.entries(productCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        // Save the top products to a JSON file in the public directory
        const outputPath = path.join(__dirname, 'public', 'top_selling_products.json');
        await fs.writeFile(outputPath, JSON.stringify(topProducts, null, 4));

        res.json({ success: true, message: 'Top-selling products generated successfully' });
    } catch (error) {
        console.error('Error generating top-selling products:', error);
        res.status(500).json({ error: 'Failed to generate top-selling products' });
    }
});


app.get('/api/top-selling-products', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'top_selling_products.json');
    res.sendFile(filePath);
});


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// run with npm start (be inside the dir with the server)
// website in http://localhost:3000/index.html