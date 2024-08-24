document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            messageElement.textContent = data.message;
            messageElement.className = 'message-success';
            // Show success message and redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);  // Redirect after 1 second
        } else {
            messageElement.textContent = data.error || 'An error occurred';
            messageElement.className = 'message-error';
        }
    } catch (error) {
        messageElement.textContent = 'An error occurred. Please try again.';
        messageElement.className = 'message-error';
    }
});
