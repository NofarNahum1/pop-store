document.addEventListener('DOMContentLoaded', function() {
    loadCheckoutItems();

    const paymentForm = document.getElementById('paymentForm');
    const submitButton = paymentForm.querySelector('button[type="submit"]');

    paymentForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        // Get checkout items from local storage
        const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');

        // Check if cart is empty
        if (checkoutItems.length === 0) {
            alert('Your cart is empty. Please add items before attempting to purchase.');
            return;
        }

        // Fetch authenticated user details
        fetch('/api/check', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Please login again.');
            }
            return response.json();
        })
        .then(data => {
            // Send purchase data to server
            return fetch('/api/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: data.username, purchase: checkoutItems })
            });
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            alert('Purchase successful');
            clearCart();
            window.location.href = 'thank-you.html';


        })
        .catch(error => {
            alert('Purchase failed: ' + error.message);
        });
    });
});

function loadCheckoutItems() {
    const orderItemsDiv = document.getElementById('orderItems');
    const totalPriceDiv = document.getElementById('totalPrice');
    const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
    const submitButton = document.querySelector('#paymentForm button[type="submit"]');

    let total = 0;
    const consolidatedItems = {};

    if (checkoutItems.length === 0) {
        orderItemsDiv.innerHTML = '<tr><td colspan="4" style="text-align: center;">Your cart is empty,you must add products.</td></tr>';
        totalPriceDiv.textContent = '$0.00';
        submitButton.disabled = true;
        return;
    }

    // Enable submit button if cart is not empty
    submitButton.disabled = false;

    // Clear existing content
    orderItemsDiv.innerHTML = '';

    // Consolidate items
    checkoutItems.forEach(item => {
        if (consolidatedItems[item.title]) {
            consolidatedItems[item.title].quantity += 1;
        } else {
            consolidatedItems[item.title] = {
                ...item,
                quantity: 1
            };
        }
    });

    Object.values(consolidatedItems).forEach(item => {
        const price = parseFloat(item.price);
        const quantity = item.quantity;
        const totalItemPrice = price * quantity;
        total += totalItemPrice;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><i class="fas fa-box product-icon"></i> ${item.title}</td>
            <td>$${price.toFixed(2)}</td>
            <td>${quantity}</td>
            <td>$${totalItemPrice.toFixed(2)}</td>
        `;
        orderItemsDiv.appendChild(row);
    });

    totalPriceDiv.textContent = `$${total.toFixed(2)}`;
}

function clearCart() {
    localStorage.removeItem('checkoutItems');
    loadCheckoutItems(); // This will update the UI to show an empty cart
}

document.addEventListener('DOMContentLoaded', function() {
    const logoutLink = document.getElementById('logout');

    logoutLink.addEventListener('click', function(event) {
        event.preventDefault();

        fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove token from localStorage
                localStorage.removeItem('token');
                
                // Redirect to login page
                window.location.href = 'login.html';
                alert('You are loged out');

            } else {
                alert('Logout failed: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Logout error:', error);
            alert('Logout failed: ' + error.message);
        });
    });
});
