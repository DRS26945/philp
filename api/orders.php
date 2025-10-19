<?php
// api/orders.php
header('Content-Type: application/json');
require '../db_connect.php'; 

// --- TEMPORARY: BYPASS AUTH FOR PREVIEW ---
$is_preview_mode = true; // Set to false to re-enable security

session_start();
if (!$is_preview_mode && (!isset($_SESSION['role']) || ($_SESSION['role'] !== 'waiter' && $_SESSION['role'] !== 'admin'))) {
    http_response_code(403);
    die(json_encode(['success' => false, 'message' => 'Access Denied. Waiter privileges required.']));
}
if ($is_preview_mode) { // Always set the correct role for this preview
    // In preview mode, find the first available waiter to assign the order to.
    // This is more robust than a hardcoded ID.
    $stmt = $pdo->query("SELECT staff_id, role FROM staff WHERE role = 'waiter' LIMIT 1");
    $preview_user = $stmt->fetch();
    if ($preview_user) {
        $_SESSION['staff_id'] = $preview_user['staff_id'];
        $_SESSION['role'] = $preview_user['role'];
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$waiter_id = $_SESSION['staff_id'];

try {
    if ($method === 'GET') {
        // READ: Get detailed information for a specific order ID
        $order_id = $_GET['order_id'] ?? null;
        if (!$order_id) {
            http_response_code(400);
            die(json_encode(['success' => false, 'message' => 'Missing Order ID.']));
        }

        // Fetch header info
        $order_stmt = $pdo->prepare("
            SELECT o.order_id, t.table_number, o.order_time, o.status 
            FROM orders o JOIN tables t ON t.table_id = o.table_id_fk
            WHERE o.order_id = ?
        ");
        $order_stmt->execute([$order_id]);
        $order_header = $order_stmt->fetch();

        if (!$order_header) {
            die(json_encode(['success' => false, 'message' => 'Order not found.']));
        }

        // Fetch item details
        $items_stmt = $pdo->prepare("
            SELECT od.quantity as qty, od.price_at_order as price, mi.name 
            FROM order_details od JOIN menu_items mi ON mi.item_id = od.item_id_fk
            WHERE od.order_id_fk = ?
        ");
        $items_stmt->execute([$order_id]);
        $items = $items_stmt->fetchAll();
        
        $order_header['items'] = $items;

        echo json_encode(['success' => true, 'order' => $order_header]);

    } elseif ($method === 'POST') {
        // CREATE: Submit new order
        $data = json_decode(file_get_contents('php://input'), true);
        $table_id = $data['table_id'];
        $items = $data['items'];
        $order_notes = $data['notes'] ?? '';

        if (empty($table_id) || empty($items)) {
            die(json_encode(['success' => false, 'message' => 'Missing table or order items.']));
        }

        $pdo->beginTransaction();
        
        // 1. Insert into orders
        $stmt = $pdo->prepare("INSERT INTO orders (table_id_fk, staff_id_fk, order_notes, status) VALUES (?, ?, ?, 'pending')");
        $stmt->execute([$table_id, $waiter_id, $order_notes]);
        $order_id = $pdo->lastInsertId();

        // 2. Insert into order_details
        $detail_stmt = $pdo->prepare("INSERT INTO order_details (order_id_fk, item_id_fk, quantity, price_at_order) VALUES (?, ?, ?, ?)");
        foreach ($items as $item) {
            $detail_stmt->execute([$order_id, $item['item_id'], $item['qty'], $item['price']]);
        }
        
        // 3. Update table status to occupied
        $table_stmt = $pdo->prepare("UPDATE tables SET status = 'occupied' WHERE table_id = ?");
        $table_stmt->execute([$table_id]);

        $pdo->commit();
        echo json_encode(['success' => true, 'order_id' => $order_id, 'message' => 'Order submitted to kitchen.']);

    } elseif ($method === 'PUT') {
        // UPDATE: Change order status (e.g., to 'served')
        $data = json_decode(file_get_contents('php://input'), true);
        $order_id = $data['order_id'];
        $new_status = $data['status']; 

        // Basic validation
        if (empty($order_id) || empty($new_status)) {
             die(json_encode(['success' => false, 'message' => 'Missing order ID or new status.']));
        }

        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE order_id = ?");
        $stmt->execute([$new_status, $order_id]);

        echo json_encode(['success' => true, 'message' => "Order $order_id status updated to $new_status."]);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not supported.']);
    }
} catch (\PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    error_log("Order API error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Order processing failed: ' . $e->getMessage()]);
}
?>