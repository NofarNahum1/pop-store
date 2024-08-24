// const fs = require('fs');

// // Load and parse the JSON data from a file
// fs.readFile('users_purchase.json', 'utf8', (err, data) => {
//     if (err) {
//         console.error("Error reading file:", err);
//         return;
//     }

//     // Parse the JSON data
//     const purchases = JSON.parse(data);

//     // Create a dictionary to count occurrences of each product
//     const productCount = {};

//     purchases.forEach(entry => {
//         const items = entry.purchase || [];
//         items.forEach(item => {
//             const title = item.title;
//             if (title) {
//                 if (!productCount[title]) {
//                     productCount[title] = 0;
//                 }
//                 productCount[title]++;
//             }
//         });
//     });

//     // Convert the productCount dictionary to an array of [product, count] pairs
//     const productEntries = Object.entries(productCount);

//     // Sort the products by count in descending order
//     productEntries.sort((a, b) => b[1] - a[1]);

//     // Get the top 3 products
//     const topProducts = productEntries.slice(0, 3);
//     console.log("");

// //     // Print out the results
// //     console.log("Top 3 Best-Selling Products:");
// //     topProducts.forEach(([product, count]) => {
// //         console.log(`${product}: ${count} purchases`);
// //     });

        
//     // Optional: Save the results to a new JSON file
//     const output = JSON.stringify(topProducts, null, 4);
//     fs.writeFile('top_selling_products.json', output, err => {
//         if (err) {
//             console.error("Error writing file:", err);
//         } else {
//             console.log("Top-selling products saved to top_selling_products.json");
//         }
//     });
    
//  });


document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/top-selling-products')
        .then(response => response.json())
        .then(data => {
            const statisticsTable = document.getElementById('statistics');
            data.forEach(product => {
                const row = document.createElement('tr');
                const productNameCell = document.createElement('td');
                const salesCell = document.createElement('td');

                productNameCell.textContent = product[0];
                salesCell.textContent = product[1];

                row.appendChild(productNameCell);
                row.appendChild(salesCell);
                statisticsTable.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching top-selling products:', error));
});
