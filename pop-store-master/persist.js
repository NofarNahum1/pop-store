// File: persist.js

// Import necessary modules
const fs = require('fs').promises; // File system promises API for async operations
const path = require('path'); // Module for handling file paths

// Define paths for data storage
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ADMIN_FILE_PATH = path.join(DATA_DIR, 'admin.json');
const PURCHASES_FILE = path.join(DATA_DIR, 'users_purchase.json');
const LOGS_FILE =  path.join(DATA_DIR, 'user_logs.json');
const REVIEW_FILE = path.join(DATA_DIR, 'reviews.json');

// Ensure that a directory exists; create it if it does not
async function ensureDirectoryExists(directory) {
    try {
        await fs.access(directory); // Check if directory exists
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Directory does not exist, create it
            await fs.mkdir(directory, { recursive: true });
        } else {
            throw error; // Throw error if it's not about the directory not existing
        }
    }
}

// Ensure that a file exists; create it if it does not
async function ensureFileExists(filePath) {
    try {
        await fs.access(filePath); // Check if file exists
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File does not exist, create it with an empty array
            await fs.writeFile(filePath, '[]');
        } else {
            throw error; // Throw error if it's not about the file not existing
        }
    }

    // Initialize the file with an empty array if it's empty
    const data = await fs.readFile(filePath, 'utf8');
    if (!data.trim()) {
        await fs.writeFile(filePath, '[]');
    }
}

// User-related functions

// Save a new user to the users.json file
async function saveUser(username, hashedPassword) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(USERS_FILE);
    let users = [];
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        users = JSON.parse(data); // Parse existing users
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
    users.push({ username, password: hashedPassword }); // Add new user
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2)); // Save updated users list
}

// Check if a user already exists in the users.json file
async function userExists(username) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(USERS_FILE);

    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        return users.some(user => user.username === username); // Check if username exists
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false; // Return false if file does not exist
        }
        throw error;
    }
}

// Get a user by username from the users.json file
async function getUserByUsername(username) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(USERS_FILE);

    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        return users.find(user => user.username === username); // Find user by username
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null; // Return null if file does not exist
        }
        throw error;
    }
}

// Product-related functions

// Save a new product to products.json
async function saveProduct(title, description, price, image) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(PRODUCTS_FILE);

    let products = [];
    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        products = JSON.parse(data); // Parse existing products
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
    console.log(title)
    // Add new product with correct structure
    products.push({ title, description, price: Number(price), image });
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2)); // Save updated products list
}


// Get all products from the products.json file
async function getProducts() {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(PRODUCTS_FILE);

    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data); // Return products list
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Return empty array if file does not exist
        }
        throw error;
    }
}

// Remove a product by title from products.json
async function removeProduct(title) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(PRODUCTS_FILE);

    let products = [];
    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        products = JSON.parse(data); // Parse existing products
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    const initialLength = products.length;

    // Filter out the product to be removed
    const updatedProducts = products.filter(product => product.title !== title);
    
    if (initialLength === updatedProducts.length) {
        throw new Error('Product not found');
    }

    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(updatedProducts, null, 2)); // Save updated products list
    return true;
}

// Admin-related functions
// Helper function to read admins from the file
async function readAdmins() {
    try {
        const data = await fs.readFile(ADMIN_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // If file doesn't exist, return an empty array
        }
        throw error;
    }
}

// Helper function to write admins to the file
async function writeAdmins(admins) {
    try {
        await fs.writeFile(ADMIN_FILE_PATH, JSON.stringify(admins, null, 2));
    } catch (error) {
        throw error;
    }
}

// Save an admin
async function saveAdmin(username, hashedPassword) {
    const admins = await readAdmins();
    admins.push({ username, password: hashedPassword });
    await writeAdmins(admins);
}

// Check if an admin exists
async function adminExists(username) {
    const admins = await readAdmins();
    return admins.some(admin => admin.username === username);
}

// Get an admin by username
async function getAdminByUsername(username) {
    const admins = await readAdmins();
    return admins.find(admin => admin.username === username) || null;
}


async function savePurchase(username, purchase) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(PURCHASES_FILE);

    let purchases = [];
    try {
        const data = await fs.readFile(PURCHASES_FILE, 'utf8');
        purchases = JSON.parse(data); // Parse existing purchases
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    // Add new purchase with timestamp
    purchases.push({
        username,
        purchase,
        datetime: new Date().toISOString()
    });
    await fs.writeFile(PURCHASES_FILE, JSON.stringify(purchases, null, 2)); // Save updated purchases list
}


// Save a log entry
async function saveLog(username, activity) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(LOGS_FILE);

    let logs = [];
    try {
        const data = await fs.readFile(LOGS_FILE, 'utf8');
        logs = JSON.parse(data); // Parse existing logs
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    // Add new log entry with current date and time
    const datetime = new Date().toISOString();
    logs.push({ datetime, username, activity });
    await fs.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2)); // Save updated logs
}

// Get all logs from the logs.json file
async function getLogs() {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(LOGS_FILE);

    try {
        const data = await fs.readFile(LOGS_FILE, 'utf8');
        return JSON.parse(data); // Return logs list
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Return empty array if file does not exist
        }
        throw error;
    }
}


async function getPurchases() {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(PURCHASES_FILE);

    try {
        const data = await fs.readFile(PURCHASES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Return empty array if file does not exist
        }
        throw error;
    }
}

// Get all reviews from the reviews.json file
async function getReviews() {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(REVIEW_FILE);
    try {
        const data = await fs.readFile(REVIEW_FILE, 'utf8');
        // return JSON.parse(data); // Return Reviews list
        const reviews = JSON.parse(data);
        return Array.isArray(reviews) ? reviews : []; // Ensure it returns an array
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Return empty array if file does not exist
        }
        throw error;
    }
}



// Export functions for use in other modules
module.exports = {
    saveUser,
    userExists,
    getUserByUsername,
    saveProduct,
    getProducts,
    removeProduct,
    saveAdmin,
    adminExists,
    getAdminByUsername,
    savePurchase,
    saveLog,
    getLogs,
    getPurchases,
    getReviews
};