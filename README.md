An 'Internet technologies and full-stack development' course finale project.

# Pop Store Web Application

This project is a full-stack web application for a **funko POP! Store** where users can browse, purchase, and interact with products in the store. 

The application uses Node.js, Express, and various middleware for features like user authentication, session management, and rate-limiting.

## Key Features

- **Pop of the Month**: Admins can set a featured "Pop of the Month" from the available products.
- **Product Management**: Add, update, or delete products from the store.
- **Reviews**: Registered users can submit reviews, and admins can manage them.
- **User Cart**: Users can add/remove products from their cart.
- **Best Sellers**: Retrieve and display best-seller information based on purchase history.
- **IP Blacklisting**: Implement rate-limiting and IP blacklisting for malicious users.
- **Session Management**: User session with authentication tokens and logout functionality.
  
## Technologies Used

- **Node.js**: The runtime environment for the server-side JavaScript.
- **Express.js**: Web framework for building the backend of the web application.
- **Multer**: Middleware for handling file uploads (e.g., product images).
- **Axios**: For making HTTP requests.
- **Body-parser** & **Cookie-parser**: To handle form data and cookies.
- **Session Management**: Using `express-session` for managing user sessions.
- **Rate Limiting**: Protect against abuse using `express-rate-limit`.
- **Helmet**: Secures HTTP headers.

## Setup Instructions

1. Clone the repository:
    ```bash
    git clone https://github.com/NofarNahum1/pop-store.git
    cd pop-store-master
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Run the server:
    ```bash
    npm start
    ```

## Endpoints Overview

- **GET /api/products**: Fetches all products in the store.
- **POST /api/admin/pop-of-the-month**: Allows admins to set the pop of the month.
- **POST /api/reviews**: Allows users to submit reviews.
- **POST /api/cart**: Adds a product to the user's cart.
- **DELETE /api/cart/delete**: Deletes a product from the user's cart.
- **GET /api/best-sellers**: Retrieves the list of best-selling products.
- **GET /api/admin/logs**: Fetches activity logs (admin only).
  
## Folder Structure

```plaintext
.
├── public                # Static files (HTML, CSS, images)
├── routes                # API routes (auth, admin, purchases)
├── data                  # JSON files (products, reviews, etc.)
├── middleware            # Authentication and other middleware
├── persist.js            # Data persistence (reading/writing files)
├── server.js             # Main server file
├── .env                  # Environment variables file
└── README.md             # Project description
