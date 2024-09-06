(async () => {
    const fetch = (await import('node-fetch')).default;
    const { FormData } = await import('formdata-node');
    const { fileFromPath } = await import('formdata-node/file-from-path');
    const fs = (await import('fs')).promises;

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
                options.headers['x-auth-token'] = token;
            }
        }

        try {
            const response = await fetch(`${BASE_URL}${route}`, options);
            let data;
            if (route === '/api/admin/logs' || route === '/admin-dashboard' || route === '/cart' || route === '/store' || route === '/login' || route === '/register') {
                data = await response.text(); 
                console.log(`Test ${method} ${route}: ${response.status} ${response.statusText}`);
            } else {
                data = await response.json();
                console.log(`Test ${method} ${route}: ${response.status} ${response.statusText}`);
                console.log('Response:', data);
            }
            return response.ok;
        } catch (error) {
            console.error(`Error testing ${method} ${route}:`, error);
            return false;
        }
    }

    async function testPostRouteWithFile(route, formData, token = null, isAdmin = false) {
        const options = {
            method: 'POST',
            headers: {}
        };
        if (token) {
            if (isAdmin) {
                options.headers['Authorization'] = `Bearer ${token}`;
            } else {
                options.headers['x-auth-token'] = token; // Use x-auth-token for user
            }
        }
        options.body = formData;
        try {
            const response = await fetch(`${BASE_URL}${route}`, options);
            const responseText = await response.text(); // Get the response text for debugging
            console.log('Response status:', response.status); // Log the response status
            if (response.headers.get('content-type')?.includes('application/json')) {
                const data = JSON.parse(responseText); // Parse the response text as JSON
                console.log(`Test POST ${route}: ${response.status} ${response.statusText}`);
                console.log('Response:', data);
                return response.ok;
            } else {
                console.error(`Unexpected response content-type: ${response.headers.get('content-type')}`);
                console.error('Raw response text:', responseText.split('\n')[0]); // Log only the first line of the response
                return false;
            }
        } catch (error) {
            console.error(`Error testing POST ${route}:`, error);
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

        // Test GET /api/best-sellers
        if (await testRoute('/api/best-sellers')) {
            console.log("+ test for '/api/best-sellers' passed");
            console.log('');
            passed++;
        } else {
            console.log("- test for '/api/best-sellers' failed");
            console.log('');
            failed++;
        }
        
        console.log('############################################################');
        console.log('');

        // Test POST /api/submit-guess with a correct guess
        const correctGuessData = { guess: 'groot' };
        if (await testRoute('/api/submit-guess', 'POST', correctGuessData)) {
            console.log("+ test for '/api/submit-guess' with correct guess passed");
            console.log('');
            passed++;
        } else {
            console.log("- test for '/api/submit-guess' with correct guess failed");
            console.log('');
            failed++;
        }

        // Test POST /api/submit-guess with an incorrect guess
        const incorrectGuessData = { guess: 'wrong' };
        if (await testRoute('/api/submit-guess', 'POST', incorrectGuessData)) {
            console.log("+ test for '/api/submit-guess' with incorrect guess passed");
            console.log('');
            passed++;
        } else {
            console.log("- test for '/api/submit-guess' with incorrect guess failed");
            console.log('');
            failed++;
        }

        // Test POST /api/submit-guess with no guess
        const noGuessData = {};
        if (await testRoute('/api/submit-guess', 'POST', noGuessData)) {
            console.log("- test for '/api/submit-guess' with no guess failed");
            console.log('');
            failed++; // This should fail, so we increment failed if it passes
        } else {
            console.log("+ test for '/api/submit-guess' with no guess passed");
            console.log('');
            passed++; // This should fail, so we increment passed if it fails
        }
        console.log('############################################################');
        console.log('Tests for login, logout and register:');
        console.log('');

        // Test GET /login
        if (await testRoute('/login')) {
            console.log("+ test for '/login' passed");
            console.log('');
            passed++;
        } else {
            console.log("- test for '/login' failed");
            console.log('');
            failed++;
        }

        // Test POST /api/log with valid data
        const validLogData = { username: 'testuser', activity: 'login' };
        if (await testRoute('/api/log', 'POST', validLogData)) {
            console.log("+ test for '/api/log' passed (saving log data)");
            console.log('');
            passed++;
        } else {
            console.log("- test for '/api/log' failed");
            console.log('');
            failed++;
        }

        // Test POST /api/logout
        if (userToken) {
            const logoutData = { username: 'nofar', activity: 'logout' };
            if (await testRoute('/api/logout', 'POST', logoutData, userToken)) {
                console.log("+ test for '/api/logout' passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/api/logout' failed");
                console.log('');
                failed++;
            }
        }

        // Test POST /api/admin/logout
        if (adminToken) {
            const logoutData = { username: 'sasi', activity: 'admin-logout' };
            if (await testRoute('/api/admin/logout', 'POST', logoutData, adminToken, true)) {
                console.log("+ test for '/api/admin/logout' passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/api/admin/logout' failed");
                console.log('');
                failed++;
            }
        }
        
        // Test GET /register
        if (await testRoute('/register')) {
            console.log("+ test for '/register' passed");
            console.log('');
            passed++;
        } else {
            console.log("- test for '/register' failed");
            console.log('');
            failed++;
        }

        console.log('############################################################');
        console.log('');

        // Test GET /store
        if (await testRoute('/store')) {
            console.log("+ test for '/store' passed");
            console.log('');
            passed++;
        } else {
            console.log("- test for '/store' failed");
            console.log('');
            failed++;
        }

        // Test GET /cart
        if (await testRoute('/cart')) {
            console.log("+ test for '/cart' passed");
            console.log('');
            passed++;
        } else {
            console.log("- test for '/cart' failed");
            console.log('');
            failed++;
        }

        // Test GET /api/products
        if (await testRoute('/api/products')) {
            console.log("+ test for '/api/products' passed");
            console.log('');
            passed++;
        } else {
            console.log("- test for '/api/products' failed");
            console.log('');
            failed++;
        }

        // Test GET /api/products/search with a query
        const searchQuery = 'bride';
        if (await testRoute(`/api/products/search?query=${searchQuery}`)) {
            console.log("+ test for '/api/products/search' passed");
            console.log('');
            passed++;
        } else {
            console.log("- test for '/api/products/search' failed");
            console.log('');
            failed++;
        }

        // Test GET /api/products/search with a query
        const searchNonExistQuery = 'nonExistPop';
        if (await testRoute(`/api/products/search?query=${searchNonExistQuery}`)) {
            console.log("+ test for '/api/products/search' for non exist query passed");
            console.log('');
            passed++;
        } else {
            console.log("- test for '/api/products/search' for non exist query failed");
            console.log('');
            failed++;
        }

        console.log('############################################################');
        console.log('');

        // Test POST /api/cart
        if (userToken) {
            const cartData = { title: 'Spider-Man' };
            if (await testRoute('/api/cart', 'POST', cartData, userToken)) {
                console.log("+ test for '/api/cart' passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/api/cart' failed");
                console.log('');
                failed++;
            }
        }
        
        // Test DELETE /api/cart/delete
        if (userToken) {
            const deleteData = { title: 'Spider-Man' };
            if (await testRoute('/api/cart/delete', 'DELETE', deleteData, userToken)) {
                console.log("+ test for '/api/cart/delete' passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/api/cart/delete' failed");
                console.log('');
                failed++;
            }
        }

        // Test POST /api/cart/clear
        if (userToken) {
            if (await testRoute('/api/cart/clear', 'POST', null, userToken)) {
                console.log("+ test for '/api/cart/clear' passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/api/cart/clear' failed");
                console.log('');
                failed++;
            }
        }
        console.log('############################################################');
        console.log('');

        // Test GET /admin-dashboard
        if (adminToken) {
            if (await testRoute('/admin-dashboard', 'GET', null, adminToken, true)) {
                console.log("+ test for '/admin-dashboard' passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/admin-dashboard' failed");
                console.log('');
                failed++;
            }
        }

        // Test GET /api/admin/logs without filter
        if (adminToken) {
            if (await testRoute('/api/admin/logs', 'GET', null, adminToken, true)) {
                console.log("+ test for '/api/admin/logs' without filter passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/api/admin/logs' without filter failed");
                console.log('');
                failed++;
            }
        }

        // Test GET /api/admin/logs with filter
        if (adminToken) {
            const filterQuery = 'nofar1'; // Replace with a relevant filter query
            if (await testRoute(`/api/admin/logs?filter=${filterQuery}`, 'GET', null, adminToken, true)) {
                console.log("+ test for '/api/admin/logs' with filter passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/api/admin/logs' with filter failed");
                console.log('');
                failed++;
            }
        }

        // Test POST /admin/products
        if (adminToken) {
            const formData = new FormData();
            formData.set('title', 'Rudolph');
            formData.set('description', 'Light the way for Santa’s sleigh! Enjoy the merriest time of the year with a timeless classic!');
            formData.set('price', '12');
            formData.set('image', await fileFromPath('./public/images/testImg.png'));


            if (await testPostRouteWithFile('/admin/products', formData, adminToken, true)) {
                console.log("+ test for '/admin/products' passed");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/admin/products' failed");
                console.log('');
                failed++;
            }
        }
        
        // Test DELETE /admin/products with existing product
        if (adminToken) {
            const title = "Rudolph";
            if (await testRoute(`/admin/products?title=${encodeURIComponent(title)}`, 'DELETE', null, adminToken, true)) {
                console.log("+ test for '/admin/products' passed (delete existing product)");
                console.log('');
                passed++;
            } else {
                console.log("- test for '/admin/products' failed (delete existing product)");
                console.log('');
                failed++;
            }
        }
        console.log('############################################################');
        console.log('');


        console.log('############################################################');
        console.log('');
        console.log(`Tests completed. Passed: ${passed}, Failed: ${failed}`);
        process.exit(0); // Ensure the script exits after tests complete
    }

    runTests();
})();