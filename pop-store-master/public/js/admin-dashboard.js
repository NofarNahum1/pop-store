document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('adminToken');
    const addMessageElement = document.getElementById('addMessage');
    const removeMessageElement = document.getElementById('removeMessage');
    const adminMessageElement = document.getElementById('adminMessage');
    const logoutLink = document.getElementById('logoutLink');

    if (!addMessageElement || !removeMessageElement || !adminMessageElement) {
        console.error('Message elements not found.');
        return;
    }

    // Redirect to login if no token
    if (!token) {
        addMessageElement.textContent = 'You must be logged in to access this page.';
        addMessageElement.className = 'alert error';
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 0);
        return;
    }

    // Verify admin token
    try {
        const response = await fetch('/api/admin/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (!data.success) {
                throw new Error('Verification failed.');
            }
        } else {
            throw new Error('Invalid token or server error.');
        }
    } catch (error) {
        addMessageElement.textContent = 'Error: ' + error.message;
        addMessageElement.className = 'alert error';
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 0);
        return;
    }

    // Handle Add Product form submission
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(event.target);

            try {
                const response = await fetch('/admin/products', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    addMessageElement.textContent = 'Product added successfully';
                    addMessageElement.className = 'alert success';
                    event.target.reset();
                } else {
                    const errorData = await response.json();
                    addMessageElement.textContent = errorData.error || 'Failed to add product';
                    addMessageElement.className = 'alert error';
                }
            } catch (error) {
                addMessageElement.textContent = 'Error: ' + error.message;
                addMessageElement.className = 'alert error';
            }
        });
    }

    // Handle Remove Product form submission
    const removeProductForm = document.getElementById('removeProductForm');
    if (removeProductForm) {
        removeProductForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('titleToRemove').value;

            try {
                const response = await fetch(`/admin/products?title=${encodeURIComponent(title)}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    removeMessageElement.textContent = 'Product removed successfully';
                    removeMessageElement.className = 'alert success';
                    event.target.reset();
                } else {
                    const errorData = await response.json();
                    removeMessageElement.textContent = errorData.error || 'Failed to remove product';
                    removeMessageElement.className = 'alert error';
                }
            } catch (error) {
                removeMessageElement.textContent = 'Error: ' + error.message;
                removeMessageElement.className = 'alert error';
            }
        });
    }

    // Handle Add Admin form submission
    const addAdminForm = document.getElementById('addAdminForm');
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;

            try {
                const response = await fetch('/api/admin/add-admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    adminMessageElement.textContent = 'Admin added successfully';
                    adminMessageElement.className = 'alert success';
                    event.target.reset();
                } else {
                    const errorData = await response.json();
                    adminMessageElement.textContent = errorData.error || 'Failed to add admin';
                    adminMessageElement.className = 'alert error';
                }
            } catch (error) {
                adminMessageElement.textContent = 'Error: ' + error.message;
                adminMessageElement.className = 'alert error';
            }
        });
    }

    // Handle Logout
    if (logoutLink) {
        logoutLink.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                const response = await fetch('/api/admin/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    localStorage.removeItem('adminToken');
                    window.location.href = 'admin-login.html';
                } else {
                    throw new Error('Logout failed.');
                }
            } catch (error) {
                alert('Error during logout: ' + error.message);
            }
        });
    }

    // New functionality for user activity logs
    const activityTableBody = document.querySelector('#activityTable tbody');
    const usernameFilter = document.getElementById('usernameFilter');

    async function fetchAndDisplayLogs(filter = '') {
        try {
            const response = await fetch(`/api/admin/logs?filter=${encodeURIComponent(filter)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const logs = await response.json();
                displayLogs(logs);
            } else {
                console.error('Failed to fetch logs');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    }

    function displayLogs(logs) {
        activityTableBody.innerHTML = ''; // Clear existing rows
        logs.forEach(log => {
            const row = activityTableBody.insertRow();
            row.insertCell(0).textContent = new Date(log.datetime).toLocaleString();
            row.insertCell(1).textContent = log.username;
            row.insertCell(2).textContent = log.activity;
        });
    }

    usernameFilter.addEventListener('input', () => {
        fetchAndDisplayLogs(usernameFilter.value);
    });

    // Initial fetch of logs
    fetchAndDisplayLogs();

const purchasesTableBody = document.querySelector('#purchasesTable tbody');
async function fetchAndDisplayPurchases() {
    try {
        const response = await fetch('/api/admin/purchases', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const purchases = await response.json();
            displayPurchases(purchases);
        } else {
            console.error('Failed to fetch purchases');
        }
    } catch (error) {
        console.error('Error fetching purchases:', error);
    }
}
function displayPurchases(purchases) {
    purchasesTableBody.innerHTML = ''; // Clear existing rows
    purchases.forEach(purchaseEntry => {
        purchaseEntry.purchase.forEach(item => {
            const row = purchasesTableBody.insertRow();
            row.insertCell(0).textContent = new Date(purchaseEntry.datetime || Date.now()).toLocaleString();
            row.insertCell(1).textContent = purchaseEntry.username;
            row.insertCell(2).textContent = item.title;
            row.insertCell(3).textContent = item.description;
            row.insertCell(4).textContent = `$${parseFloat(item.price).toFixed(2)}`;
            
            const imageCell = row.insertCell(5);
            if (item.image) {
                const img = document.createElement('img');
                img.src = `/images/${item.image}`;
                img.alt = item.title;
                img.style.width = '50px';
                imageCell.appendChild(img);
            } else {
                imageCell.textContent = 'No image';
            }
        });
    });
}


// Initial fetch of purchases
fetchAndDisplayPurchases();

});