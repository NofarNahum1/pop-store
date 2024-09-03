const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testRoute(route, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
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

    // Test POST /api/admin/pop-of-the-month
    const popOfTheMonthData = {
        title: 'Ladypool',
        intro: 'Ladypool is the Pop! of the month, celebrating the release of the new deadpool & Wolverine movie, perfect for fans who want a collectible as fierce and iconic as the characters themselves!'
    };
    if (await testRoute('/api/admin/pop-of-the-month', 'POST', popOfTheMonthData)) {
        passed++;
    } else {
        failed++;
    }

    // Add more tests for other routes as needed

    console.log(`Tests completed. Passed: ${passed}, Failed: ${failed}`);
}

runTests();