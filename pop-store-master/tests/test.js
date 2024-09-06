// const fs = require('fs');
// const path = require('path');
// const fetch = require('node-fetch');
// const FormData = require('form-data');

(async () => {
    const fetch = (await import('node-fetch')).default;

    const BASE_URL = 'http://localhost:3000';

    async function authenticateAdmin() {
        const loginData = {
            username: 'sasi',
            password: 'sasi'
        };

        const response = await fetch(`${BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();
        if (response.ok) {
            return data.token; // Assuming the token is returned in the response
        } else {
            throw new Error(`Failed to authenticate: ${data.error}`);
        }
    }

    async function authenticateUser() {
        const loginData = {
            username: 'sasi',
            password: 'sasi'
        };

        const response = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData),
            
        });

        const responseText = await response.text(); // Get the response text for debugging
        console.log('Response text:', responseText); // Log the response text
        try {
            const data = JSON.parse(responseText); // Parse the response text as JSON
            if (response.ok) {
                return data.token; // Assuming the token is returned in the response
            } else {
                throw new Error(`Failed to authenticate: ${data.error}`);
            }
        } catch (error) {
            throw new Error(`Failed to authenticate: ${responseText}`);
        }
        
        // const data = await response.json();
        // if (response.ok) {
        //     return data.token;
        // } else {
        //     throw new Error(`Failed to authenticate: ${data.error}`);
        // }
    }

    async function testRoute(route, method = 'GET', body = null, token = null, isAdmin = false) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        if (token) {
            if (isAdmin) {
                options.headers['Authorization'] = `Bearer ${token}`;
            } else {
                options.headers['x-auth-token'] = token; // Use x-auth-token for user
            }
        }
        // console.log('Request options:', options); // Log the request options for debugging

        try {
            const response = await fetch(`${BASE_URL}${route}`, options);
            const data = await response.json();
            console.log(`Test ${method} ${route}: ${response.status} ${response.statusText}`);
            console.log('Response:', data);
            return response.ok;
        } catch (error) {
            console.error(`Error testing ${method} ${route}:`, error);
            return false;
        }
    }

    async function runTests() {
        let passed = 0;
        let failed = 0;

        console.log('Running tests...');

        // Test GET /readme.html
        // try {
        //     const response = await fetch(`${BASE_URL}/readme.html`);
        //     if (response.ok) {
        //         console.log('Test GET /readme.html: 200 OK');
        //         passed++;
        //     } else {
        //         console.log('Test GET /readme.html: Failed');
        //         failed++;
        //     }
        // } catch (error) {
        //     console.error('Error testing GET /readme.html:', error);
        //     failed++;
        // }
        
        console.log('');

        // Test GET /api/pop-of-the-month
        if (await testRoute('/api/pop-of-the-month')) {
            passed++;
            console.log("+ test for '/api/pop-of-the-month' passed");
            console.log('');
        } else {
            failed++;
            console.log("- test for '/api/pop-of-the-month' failed");
            console.log('');
        }

        // Authenticate as admin
        let adminToken;
        try {
            adminToken = await authenticateAdmin();
            console.log('Admin authenticated successfully');
            console.log('');
        } catch (error) {
            console.error('Admin authentication failed:', error);
            failed++;
        }

        // Test POST /api/admin/pop-of-the-month with a valid product
        if (adminToken) {
            const popOfTheMonthData = {
                title: 'Ladypool',
                intro: 'Ladypool is the Pop! of the month, celebrating the release of the new deadpool & Wolverine movie, perfect for fans who want a collectible as fierce and iconic as the characters themselves!'
            };
            if (await testRoute('/api/admin/pop-of-the-month', 'POST', popOfTheMonthData, adminToken, true)) {
                console.log("+ test for '/api/admin/pop-of-the-month' passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/api/admin/pop-of-the-month' failed");
                console.log('');
                failed++;
            }
        }

        // Test POST /api/admin/pop-of-the-month with a non-existent product
        if (adminToken) {
            const nonExistentProductData = {
                title: 'NonExistentProduct',
                intro: 'This product does not exist in the database.'
            };
            if (await testRoute('/api/admin/pop-of-the-month', 'POST', nonExistentProductData, adminToken, true)) {
                console.log("- test for '/api/admin/pop-of-the-month' with non-exist product failed");
                console.log('');
                failed++; // This should fail, so we increment failed if it passes
            } else {
                console.log("+ test for '/api/admin/pop-of-the-month' with non-exist product passed");
                console.log('');
                passed++; // This should fail, so we increment passed if it fails
            }
        }
        console.log('############################################################');
        console.log('');

        // Authenticate as user
        let userToken;
        try {
            userToken = await authenticateUser();
            console.log('User authenticated successfully');
            console.log('');
        } catch (error) {
            console.error('User authentication failed:', error);
            failed++;
        }

        // Test GET /api/admin/reviews
        if (adminToken) {
            if (await testRoute('/api/admin/reviews', 'GET', null, adminToken, true)) {
                console.log("+ test for '/api/admin/reviews' passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/api/admin/reviews' failed");
                console.log('');
                failed++;
            }
        }
        console.log("");

        // Test POST /api/reviews with an invalid review (missing comment)
        if (userToken) {
            const invalidReviewData = {
                username: 'nofar',
                comment: ''
            };
            if (await testRoute('/api/reviews', 'POST', invalidReviewData, userToken)) {
                console.log("- test for '/api/reviews' with invalid data failed");
                console.log('');
                failed++; // This should fail, so we increment failed if it passes
            } else {
                console.log("+ test for '/api/reviews' with invalid data passed");
                console.log('');
                passed++; // This should fail, so we increment passed if it fails
            }        
        }

        // Test POST /api/reviews with a valid review
        if (userToken) {
            const reviewData = {
                username: 'nofar',
                comment: 'This is a test review.'
            };
            if (await testRoute('/api/reviews', 'POST', reviewData, userToken)) {
                console.log("+ test for '/api/reviews' passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/api/reviews' failed");
                console.log('');
                failed++;
            }        
        }

        console.log('############################################################');
        console.log('');

        // const form = new FormData();
        // form.append('title', 'Test Product');
        // form.append('description', 'This is a test product');
        // form.append('price', '19.99');
        // // form.append('image', fs.createReadStream(path.join("./public/images", 'reviews.jpg')));
        // form.append('image', fs.createReadStream('pop-store-master\public\images\reviews.png'));

        // const options = {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${adminToken}`
        //     },
        //     body: form
        // };

        // try {
        //     const response = await fetch(`${BASE_URL}/admin/products`, options);
        //     const data = await response.json();
        //     console.log(`Test POST /admin/products: ${response.status} ${response.statusText}`);
        //     console.log('Response:', data);
        //     if (response.ok) {
        //         console.log('Product added successfully');
        //     } else {
        //         console.error('Failed to add product:', data);
        //     }
        // } catch (error) {
        //     console.error('Error testing POST /admin/products:', error);
        // }

        // Add more tests for other routes as needed

        console.log(`Tests completed. Passed: ${passed}, Failed: ${failed}`);
        process.exit(0); // Ensure the script exits after tests complete
    }

    runTests();
})();