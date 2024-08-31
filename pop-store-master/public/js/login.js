document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, rememberMe }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', username); // Save the username to localStorage
                document.cookie = `token=${data.token}; path=/; max-age=${rememberMe ? 864000 : 1800}; SameSite=Strict`;

                // Log the login activity
                logActivity(username, 'login');

                fetch('/api/cart/clear', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${data.token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                })
                .then(cartResponse => cartResponse.json())
                .then(cartData => {
                    if (cartData.success) {
                        alert('Login successful!');
                        window.location.href = 'store.html';
                    } else {
                        alert('Login successful, but failed to clear cart');
                    }
                })
                .catch(cartError => {
                    console.error('Error clearing cart:', cartError);
                    alert('Login successful, but failed to clear cart');
                });
            } else {
                alert('Login failed: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        });
    });

    function logActivity(username, activity) {
        fetch('/api/log', {
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
});