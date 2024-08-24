document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : false; // Optional remember me

    const messageElement = document.getElementById('message');

    try {
        const response = await fetch('http://localhost:3000/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, rememberMe }) // Send rememberMe if available
        });

        if (response.ok) {
            const result = await response.json();
            if (result.token) {
                localStorage.setItem('adminToken', result.token); // Store token in localStorage
                document.cookie = `adminToken=${result.token}; path=/; max-age=${rememberMe ? 864000 : 1800}; SameSite=Strict`; // Set cookie with expiration

                // Log the login activity
                // logActivity(username, 'login');

                messageElement.textContent = 'Login successful';
                messageElement.className = 'message-success';
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                    console.log("adm-log")
                }, 1); 
            } else {
                messageElement.textContent = 'Login failed: ' + (result.error || 'Unknown error');
                messageElement.className = 'message-error';
            }
        } else {
            const errorData = await response.json();
            messageElement.textContent = errorData.error || 'Invalid username or password';
            messageElement.className = 'message-error';
        }
    } catch (error) {
        messageElement.textContent = 'Error: ' + error.message;
        messageElement.className = 'message-error';
    }
});

function logActivity(username, activity) {
    fetch('http://localhost:3000/api/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, activity }),
        credentials: 'include'
    })
    .catch(logError => {
        console.error('Logging error:', logError);
    });
}
