const fs = require('fs');


// Define the path to the JSON file
// const jsonFilePath = path.join(__dirname, '..', 'path_to_directory', 'users_purchase.json'); // Adjust the path as needed

// Load and parse the JSON data from a file
fs.readFile('users_purchase.json', 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading file:", err);
        return;
    }

    // Parse the JSON data
    const purchases = JSON.parse(data);

    // Create a dictionary to count occurrences of each product
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

    // Convert the productCount dictionary to an array of [product, count] pairs
    const productEntries = Object.entries(productCount);

    // Sort the products by count in descending order
    productEntries.sort((a, b) => b[1] - a[1]);

    // Get the top 3 products
    const topProducts = productEntries.slice(0, 3);

    // Print out the results
    console.log("Top 3 Best-Selling Products:");
    topProducts.forEach(([product, count]) => {
        console.log(`${product}: ${count} purchases`);
    });

    // Print out the results
    console.log("Top 3 Best-Selling Products:");
    topProducts.forEach(([product, count], index) => {
        console.log(`${index + 1}. ${product}: ${count} purchases`);
    });

        
    // Optional: Save the results to a new JSON file
    const output = JSON.stringify(topProducts, null, 4);
    fs.writeFile('top_selling_products.json', output, err => {
        if (err) {
            console.error("Error writing file:", err);
        } else {
            console.log("Top-selling products saved to top_selling_products.json");
        }
    });
});
