# DineEase - Restaurant Order Management System

DineEase is a comprehensive, web-based Order Management System (OMS) designed to streamline and simplify restaurant operations. It provides a centralized platform for staff to manage tables, orders, and billing, enhancing coordination, reducing errors, and accelerating service.

## ✨ Features

The system is built around a role-based access control model, providing distinct dashboards and functionalities for different staff members.

###  роли

*   **👨‍💼 Admin:**
    *   Manages the restaurant's menu (Add, Edit, Delete items).
    *   Manages staff accounts and roles.
    *   Can view all dashboards to oversee operations.

*   **🤵 Waiter/Staff:**
    *   Manages table statuses (Vacant, Occupied, Reserved).
    *   Creates new customer orders from the menu.
    *   Views the status of their active orders (Pending, In Progress, Ready).
    *   Can mark "Ready" orders as "Served".

*   **🍳 Kitchen Staff:**
    *   Views all incoming orders on a real-time, Kanban-style board.
    *   Updates order status from "Pending" -> "In Progress" -> "Ready for Service".

*   **💰 Cashier:**
    *   Views all orders that are ready for billing.
    *   Generates itemized bills, including a calculated tax.
    *   Updates the payment status of bills ("Pending", "Done").
    *   Marks tables as "Vacant" once payment is complete.

### 🔑 Authentication

*   Secure user login with hashed passwords.
*   Session-based authentication to protect endpoints.
*   Public sign-up form to create new staff accounts.

### 🚀 Preview Mode

For demonstration and development purposes, the application includes a "preview mode". This mode bypasses the login screen and allows you to switch between the different role dashboards using switcher buttons in the header. This is controlled by a `$is_preview_mode` flag in the PHP API files.

## 🛠️ Technology Stack

*   **Frontend:**
    *   HTML5
    *   Tailwind CSS for styling.
    *   Vanilla JavaScript for all client-side logic and API communication.

*   **Backend:**
    *   PHP
    *   A RESTful API architecture.

*   **Database:**
    *   MySQL

*   **Server Environment:**
    *   XAMPP (Apache, MySQL)

## 📂 Project Structure

```
dineease/
├── api/
│   ├── auth.php         # Handles user login
│   ├── auth_logout.php  # Handles user logout
│   ├── billing.php      # CRUD for bills and payments
│   ├── kitchen.php      # API for the kitchen dashboard
│   ├── menu.php         # CRUD for menu items
│   ├── orders.php       # CRUD for orders
│   ├── signup.php       # Handles new user creation
│   └── tables.php       # Manages table status
│
├── .gitignore           # Specifies files for Git to ignore
├── db_connect.php       # Database connection script (PDO)
├── index.html           # Main application file (all UI views)
├── README.md            # This file
└── script.js            # All frontend JavaScript logic
```

## ⚙️ Setup and Installation

To run this project locally, you will need to have XAMPP installed.

1.  **Clone or Download the Repository**
    Place the entire `dineease` project folder inside your XAMPP `htdocs` directory.
    *   Typically `C:\xampp\htdocs\dineease`

2.  **Database Setup**
    *   Open the XAMPP Control Panel and start the **Apache** and **MySQL** services.
    *   Navigate to `http://localhost/phpmyadmin` in your browser.
    *   Create a new database named `restaurant_oms_db`.
    *   Go to the "Import" tab, select your `restaurant_oms_db.sql` file (you will need to export this from your current setup), and click "Go".

3.  **Configure Database Connection**
    *   Open the `db_connect.php` file.
    *   Ensure the `$port`, `$db`, `$user`, and `$pass` variables match your MySQL configuration. By default, this project is configured to use port `3307`. If your MySQL is on the default port `3306`, change it here.

    ```php
    // db_connect.php
    $host = 'localhost';
    $port = '3307'; // Change this to 3306 if needed
    $db   = 'restaurant_oms_db';
    $user = 'root';
    $pass = '';
    ```

4.  **Run the Application**
    *   Open your web browser and navigate to: `http://localhost/dineease`

You should now see the DineEase homepage. You can sign up for new accounts or log in with existing ones.

---
*This project was developed as a demonstration of a full-stack web application.*
