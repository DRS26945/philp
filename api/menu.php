<?php
// api/menu.php
header('Content-Type: application/json');
require '../db_connect.php'; 
session_start();

// --- TEMPORARY: BYPASS AUTH FOR PREVIEW ---
$is_preview_mode = true; // Set to false to re-enable security

if ($is_preview_mode) { // Always set the correct role for this preview
    // In preview mode, find the first available admin.
    $stmt = $pdo->query("SELECT staff_id, role FROM staff WHERE role = 'admin' LIMIT 1");
    $preview_user = $stmt->fetch();
    if ($preview_user) {
        $_SESSION['staff_id'] = $preview_user['staff_id'];
        $_SESSION['role'] = $preview_user['role'];
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$is_admin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';

try {
    switch ($method) {
        case 'GET':
            // READ: Get all menu items (available to any logged-in user)
            if (!$is_preview_mode && !isset($_SESSION['role'])) {
                http_response_code(403);
                die(json_encode(['success' => false, 'message' => 'Access Denied.']));
            }
            $stmt = $pdo->query("SELECT item_id, name, price, category FROM menu_items ORDER BY category, name");
            $menu = $stmt->fetchAll();
            echo json_encode(['success' => true, 'menu' => $menu]);
            break;

        case 'POST':
            // CREATE: Add a new dish
            if (!$is_admin) {
                http_response_code(403);
                die(json_encode(['success' => false, 'message' => 'Access Denied. Admin privileges required.']));
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $name = $data['name'];
            $price = $data['price'];
            $category = $data['category'] ?? 'Main'; // Add a category input to the frontend form

            $stmt = $pdo->prepare("INSERT INTO menu_items (name, price, category) VALUES (?, ?, ?)");
            $stmt->execute([$name, $price, $category]);
            echo json_encode(['success' => true, 'message' => 'Dish added successfully.']);
            break;

        case 'PUT':
            // UPDATE: Modify an existing menu item
            if (!$is_admin) {
                http_response_code(403);
                die(json_encode(['success' => false, 'message' => 'Access Denied. Admin privileges required.']));
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $item_id = $data['item_id'];
            $name = $data['name'];
            $price = $data['price'];
            $category = $data['category'];

            if (empty($item_id) || empty($name) || empty($price) || empty($category)) {
                die(json_encode(['success' => false, 'message' => 'All fields are required.']));
            }

            $stmt = $pdo->prepare("UPDATE menu_items SET name = ?, price = ?, category = ? WHERE item_id = ?");
            $stmt->execute([$name, $price, $category, $item_id]);
            echo json_encode(['success' => true, 'message' => 'Menu item updated successfully.']);
            break;

        case 'DELETE':
            // DELETE: Remove a menu item
            if (!$is_admin) {
                http_response_code(403);
                die(json_encode(['success' => false, 'message' => 'Access Denied. Admin privileges required.']));
            }

            $item_id = $_GET['item_id'] ?? null;
            if (!$item_id) {
                http_response_code(400);
                die(json_encode(['success' => false, 'message' => 'Item ID is required.']));
            }

            try {
                $stmt = $pdo->prepare("DELETE FROM menu_items WHERE item_id = ?");
                $stmt->execute([$item_id]);
                echo json_encode(['success' => true, 'message' => 'Menu item deleted successfully.']);
            } catch (\PDOException $e) {
                // Check for foreign key constraint violation (error code 1451)
                if ($e->getCode() == '23000') {
                    die(json_encode(['success' => false, 'message' => 'Cannot delete item. It is part of an existing order.']));
                }
                throw $e; // Re-throw other errors
            }
            break;

        default:
            http_response_code(405); // Method Not Allowed
            echo json_encode(['success' => false, 'message' => 'Method not supported.']);
            break;
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>