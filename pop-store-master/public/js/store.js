document.addEventListener('DOMContentLoaded', function() {
    fetchProducts();
});

function fetchProducts() {
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.json();
        })
        .then(products => {
            displayProducts(products);
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            document.getElementById('products').innerHTML = '<p style="width: 100%; text-align: center;">Failed to load products.</p>';
        });
}

function displayProducts(products) {
    const productsDiv = document.getElementById('products');
    productsDiv.innerHTML = '';
    if (products.length === 0) {
        productsDiv.innerHTML = '<p style="width: 100%; text-align: center;">No products found.</p>';
        return;
    }
    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product';

        // Convert price to number if it is a string
        const price = !isNaN(product.price) ? parseFloat(product.price).toFixed(2) : 'N/A';

        productDiv.innerHTML = `
            <img src="/images/${product.image}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            <div class="price">$${price}</div>
            <button class="icon-button" onclick="checkAuthAndAddToCart('${product.title}')">
                <i class="fa fa-cart-plus"></i>
                Add to Cart
            </button>
        `;
        productsDiv.appendChild(productDiv);
    });
}

function searchProducts() {
    const query = document.getElementById('search').value;
    fetch(`/api/products/search?query=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.json();
        })
        .then(products => {
            displayProducts(products);
        })
        .catch(error => {
            console.error('Error searching products:', error);
            document.getElementById('products').innerHTML = '<p style="width: 100%; text-align: center;">Failed to search products.</p>';
        });
}

function checkAuthAndAddToCart(title) {
    fetch('/api/check', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include' // Ensure cookies are included in the request
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        if (data.isAuthenticated) {
            addToCart(title);
        } else {
            alert('You must login to buy products');
            window.location.href = 'login.html'; // Redirect to the login page if not authenticated
        }
    })
    .catch(error => {
        console.error('Error checking authentication:', error);
        alert('You must login to buy products');
        window.location.href = 'login.html';
    });
}

async function addToCart(productTitle, username) {
    try {

        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: productTitle,username:username })
        });
        const result = await response.json();
        if (result.success) {
            alert('Product added to cart successfully');
            // await logActivity(username, `add-to-cart:"${productTitle}"`);
        } else {
            console.error('Failed to add product to cart:', result.error);
        }
    } catch (error) {
        console.error('Error adding product to cart:', error);
    }
}



// function verifyToken(req) {
//     const token = req.cookies.token;
//     if (!token) {
//       throw new Error('No token provided');
//     }
  
//     const decoded = jwt.verify(token,process.env.JWT_SECRET ); 
//     return decoded.username;
//   }








function checkAuthAndRedirectToCart() {
    fetch('/api/check', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include' // Ensure cookies are included in the request
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        if (data.isAuthenticated) {
            window.location.href = '/cart'; // Redirect to the cart page if authenticated
        } else {
            alert('You must login to view the cart');
            window.location.href = 'login.html'; // Redirect to the login page if not authenticated
        }
    })
    .catch(error => {
        console.error('Error checking authentication:', error);
        alert('You must login to view the cart');
        window.location.href = 'login.html';
    });
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
                alert('You need to login,in order to logout');
                window.location.href = 'login.html';

            }
        })
        .catch(error => {
            console.error('Logout error:', error);
            alert('You need to login,in order to logout');
            window.location.href = 'login.html';

        });
    });
});


async function logActivity(username, activity) {
    try {
        const response = await fetch('/api/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, activity })
        });
        const result = await response.json();
        if (!result.success) {
            console.error('Failed to log activity:', result.error);
        }
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}



