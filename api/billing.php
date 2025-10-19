<?php
// api/billing.php
header('Content-Type: application/json');
require __DIR__ . '/../db_connect.php'; 

// --- TEMPORARY: BYPASS AUTH FOR PREVIEW ---
$is_preview_mode = true; // Set to false to re-enable security

session_start();
if (!$is_preview_mode && (!isset($_SESSION['role']) || ($_SESSION['role'] !== 'cashier' && $_SESSION['role'] !== 'admin'))) {
    http_response_code(403);
    die(json_encode(['success' => false, 'message' => 'Access Denied. Cashier privileges required.']));
}
if ($is_preview_mode) { // Always set the correct role for this preview
    // In preview mode, find the first available cashier.
    $stmt = $pdo->query("SELECT staff_id, role FROM staff WHERE role = 'cashier' LIMIT 1");
    $preview_user = $stmt->fetch();
    if ($preview_user) $_SESSION['staff_id'] = $preview_user['staff_id'];
}

$method = $_SERVER['REQUEST_METHOD'];
$cashier_id = $_SESSION['staff_id']; 

try {
    if ($method === 'GET') {
        // READ: Get all orders that do not have a 'Done' bill associated with them.
        $stmt = $pdo->query("
            SELECT 
                o.order_id, t.table_number, o.order_time,
                b.total_amount, b.payment_status, b.bill_id
            FROM orders o
            JOIN tables t ON t.table_id = o.table_id_fk
            LEFT JOIN bills b ON b.order_id_fk = o.order_id
            WHERE o.status = 'served' AND NOT EXISTS (
                SELECT 1 FROM bills b2 WHERE b2.order_id_fk = o.order_id AND b2.payment_status = 'Done'
            ) 
            ORDER BY o.order_time DESC
        ");
        $records = $stmt->fetchAll();
        echo json_encode(['success' => true, 'records' => $records]);

    } elseif ($method === 'PUT') {
        // UPDATE: Update Bill Payment Status
        $data = json_decode(file_get_contents('php://input'), true);
        $order_id = $data['order_id'];
        $new_status = $data['status'];

        // Check if a bill exists for this order
        $bill_check = $pdo->prepare("SELECT bill_id FROM bills WHERE order_id_fk = ?");
        $bill_check->execute([$order_id]);
        $bill = $bill_check->fetch();

        if ($bill) {
            // Bill exists, update it
            $update_stmt = $pdo->prepare("UPDATE bills SET payment_status = ? WHERE bill_id = ?");
            $update_stmt->execute([$new_status, $bill['bill_id']]);

            // If payment is Done, mark the table as vacant
            if ($new_status === 'Done') {
                $table_stmt = $pdo->prepare("UPDATE tables t JOIN orders o ON t.table_id = o.table_id_fk SET t.status = 'vacant' WHERE o.order_id = ?");
                $table_stmt->execute([$order_id]);
                // Also mark the order as finalized so it disappears from active lists
                $pdo->prepare("UPDATE orders SET status = 'finalized' WHERE order_id = ?")->execute([$order_id]);
            }
            echo json_encode(['success' => true, 'message' => "Payment status updated to $new_status."]);
        } else {
            // Bill does not exist, cannot update
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Bill not found for this order. Generate a bill first.']);
        }

    } elseif ($method === 'POST') {
        // POST: Generate Bill
        $data = json_decode(file_get_contents('php://input'), true);
        $order_id = $data['order_id'];

        // Check if a bill already exists
        $stmt = $pdo->prepare("SELECT bill_id FROM bills WHERE order_id_fk = ?");
        $stmt->execute([$order_id]);
        if ($stmt->fetch()) {
            die(json_encode(['success' => false, 'message' => 'A bill for this order already exists.']));
        }

        // Calculate total amount from order_details
        $total_stmt = $pdo->prepare("SELECT SUM(quantity * price_at_order) AS total FROM order_details WHERE order_id_fk = ?");
        $total_stmt->execute([$order_id]);
        $total_amount = $total_stmt->fetchColumn();

        // Insert the new bill record
        $insert_stmt = $pdo->prepare("INSERT INTO bills (order_id_fk, staff_id_fk, total_amount, payment_status) VALUES (?, ?, ?, 'Pending')");
        $insert_stmt->execute([$order_id, $cashier_id, $total_amount]);
        $bill_id = $pdo->lastInsertId();

        echo json_encode(['success' => true, 'message' => "Bill #${bill_id} generated successfully.", 'bill' => ['bill_id' => $bill_id, 'total_amount' => $total_amount]]);
        
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not supported.']);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    error_log("Billing API error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error occurred.', 'error' => $e->getMessage()]);
}
?>