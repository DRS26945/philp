<?php
// api/kitchen.php
header('Content-Type: application/json');
require __DIR__ . '/../db_connect.php'; 

// --- TEMPORARY: BYPASS AUTH FOR PREVIEW ---
$is_preview_mode = true; // Set to false to re-enable security

// Start session and check role
session_start();
if (!$is_preview_mode && (!isset($_SESSION['role']) || ($_SESSION['role'] !== 'kitchen' && $_SESSION['role'] !== 'admin'))) {
    http_response_code(403);
    die(json_encode(['success' => false, 'message' => 'Access Denied. Kitchen privileges required.']));
}
if ($is_preview_mode) { // Always set the correct role for this preview
    // In preview mode, find the first available kitchen staff.
    $stmt = $pdo->query("SELECT staff_id, role FROM staff WHERE role = 'kitchen' LIMIT 1");
    $preview_user = $stmt->fetch();
    if ($preview_user) {
        $_SESSION['staff_id'] = $preview_user['staff_id'];
        $_SESSION['role'] = $preview_user['role'];
    }
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // READ: Get all orders that are not yet served or cancelled, joined with item details
        $stmt = $pdo->query("
            SELECT 
                o.order_id, o.table_id_fk, t.table_number, o.status, o.order_notes, o.order_time,
                GROUP_CONCAT(CONCAT(od.quantity, 'x ', mi.name) SEPARATOR '|') AS items_summary
            FROM orders o
            JOIN tables t ON t.table_id = o.table_id_fk
            JOIN order_details od ON od.order_id_fk = o.order_id
            JOIN menu_items mi ON mi.item_id = od.item_id_fk
            WHERE o.status IN ('pending', 'in_progress', 'ready')
            GROUP BY o.order_id
            ORDER BY o.order_time ASC
        ");
        $orders = $stmt->fetchAll();

        // Format the complex summary field into a readable array of items
        $formatted_orders = array_map(function($order) {
            $order['items'] = explode('|', $order['items_summary']);
            unset($order['items_summary']);
            return $order;
        }, $orders);
        
        echo json_encode(['success' => true, 'orders' => $formatted_orders]);

    } elseif ($method === 'PUT') {
        // UPDATE: Change order status (e.g., pending -> in_progress -> ready)
        $data = json_decode(file_get_contents('php://input'), true);
        $order_id = $data['order_id'];
        $new_status = $data['status']; // 'in_progress', 'ready', or 'served'

        // Validate the allowed statuses for this endpoint
        if (!in_array($new_status, ['in_progress', 'ready', 'served'])) {
            die(json_encode(['success' => false, 'message' => 'Invalid status update provided.']));
        }

        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE order_id = ?");
        $stmt->execute([$new_status, $order_id]);

        echo json_encode(['success' => true, 'message' => "Order $order_id status updated to $new_status."]);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not supported.']);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error.']);
}
?>