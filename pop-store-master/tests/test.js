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

    async function testRoute(route, method = 'GET', body = null, token = null) {
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
            options.headers['Authorization'] = `Bearer ${token}`;
        }

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

        // Test GET /api/pop-of-the-month
        if (await testRoute('/api/pop-of-the-month')) {
            passed++;
        } else {
            failed++;
        }

        // Authenticate as admin
        let adminToken;
        try {
            adminToken = await authenticateAdmin();
            console.log('Admin authenticated successfully');
        } catch (error) {
            console.error('Admin authentication failed:', error);
            failed++;
        }

        // Test POST /api/admin/pop-of-the-month
        if (adminToken) {
            const popOfTheMonthData = {
                title: 'Ladypool',
                intro: 'Ladypool is the Pop! of the month, celebrating the release of the new deadpool & Wolverine movie, perfect for fans who want a collectible as fierce and iconic as the characters themselves!'
            };
            if (await testRoute('/api/admin/pop-of-the-month', 'POST', popOfTheMonthData, adminToken)) {
                passed++;
            } else {
                failed++;
            }
        }

        // Add more tests for other routes as needed

        console.log(`Tests completed. Passed: ${passed}, Failed: ${failed}`);
    }

    runTests();
})();