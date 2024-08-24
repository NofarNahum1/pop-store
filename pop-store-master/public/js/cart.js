document.addEventListener('DOMContentLoaded', function() {
    fetchCartItems();
    fetchProducts();
});

async function fetchCartItems() {
    try {
        const response = await fetch('/api/cart/items');
        const items = await response.json();
        displayCartItems(items);
        saveCartToLocalStorage(items); // Save to localStorage
    } catch (error) {
        console.error('Error fetching cart items:', error);
        document.getElementById('loading').textContent = 'Failed to load cart items.';
    }
}

function saveCartToLocalStorage(items) {
    localStorage.setItem('cartItems', JSON.stringify(items));
}

function displayCartItems(items) {
    const cartItemsDiv = document.getElementById('cartItems');
    cartItemsDiv.innerHTML = '';

    const itemMap = items.reduce((acc, item) => {
        if (acc[item.title]) {
            acc[item.title].quantity += 1;
        } else {
            acc[item.title] = {
                ...item,
                quantity: 1
            };
        }
        return acc;
    }, {});

    const aggregatedItems = Object.values(itemMap);

    if (aggregatedItems.length === 0) {
        cartItemsDiv.innerHTML = '<p style="width: 100%; text-align: center;">Your cart is empty.</p>';
        return;
    }

    aggregatedItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';

        itemDiv.innerHTML = `
            <img src="/images/${item.image}" alt="${item.title}">
            <div class="details">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="price">$${item.price}</div>
                <div class="quantity">
                    <label>Quantity:</label>
                    <span>${item.quantity}</span>
                </div>
            </div>
            <button class="icon-button" onclick="deleteFromCart('${item.title}')"><i class="fa fa-trash"></i></button>
        `;
        cartItemsDiv.appendChild(itemDiv);
    });
}

function deleteFromCart(title) {
    fetch('/api/cart/delete', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            fetchCartItems();
        } else {
            alert('Error deleting product from cart');
        }
    })
    .catch(error => console.error('Error deleting from cart:', error));
}

async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('products-loading').textContent = 'Failed to load products.';
    }
}

function displayProducts(products) {
    const productsDiv = document.getElementById('products');
    productsDiv.innerHTML = '';

    if (products.length === 0) {
        productsDiv.innerHTML = '<p style="width: 100%; text-align: center;">No products available.</p>';
        return;
    }

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product';

        const price = !isNaN(product.price) ? parseFloat(product.price).toFixed(2) : 'N/A';

        productDiv.innerHTML = `
            <img src="/images/${product.image}" alt="${product.title}">
            <div class="details">
                <h3>${product.title}</h3>
                <div class="price">$${price}</div>
            </div>
            <button class="icon-button" onclick="addToCart('${product.title}')"><i class="fa fa-cart-plus"></i></button>
        `;
        productsDiv.appendChild(productDiv);
    });
}

function addToCart(title) {
    fetch('/api/cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            fetchCartItems();
        } else {
            alert('Error adding product to cart');
        }
    })
    .catch(error => console.error('Error adding to cart:', error));
}

function checkout() {
    const cartItemsDiv = document.getElementById('cartItems');
    if (cartItemsDiv.children.length === 0) {
        alert('Your cart is empty. Add items to your cart before proceeding to checkout.');
        return;
    }
    if (confirm('Are you sure you want to proceed to checkout?')) {
        const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        localStorage.setItem('checkoutItems', JSON.stringify(cartItems));
        window.location.href = '/checkout.html';
    }
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

