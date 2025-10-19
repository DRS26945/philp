<?php
// api/tables.php
header('Content-Type: application/json');
require __DIR__ . '/../db_connect.php'; 

// --- TEMPORARY: BYPASS AUTH FOR PREVIEW ---
$is_preview_mode = true; // Set to false to re-enable security

session_start();
if (!$is_preview_mode && (!isset($_SESSION['role']) || ($_SESSION['role'] !== 'waiter' && $_SESSION['role'] !== 'admin'))) {
    http_response_code(403);
    die(json_encode(['success' => false, 'message' => 'Access Denied. Waiter privileges required.']));
}
if ($is_preview_mode) { // Always set the correct role for this preview
    // In preview mode, find the first available waiter.
    $stmt = $pdo->query("SELECT staff_id, role FROM staff WHERE role = 'waiter' LIMIT 1");
    $preview_user = $stmt->fetch();
    if ($preview_user) {
        $_SESSION['staff_id'] = $preview_user['staff_id'];
        $_SESSION['role'] = $preview_user['role'];
    }
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // READ: Get status for all tables (for Waiter Dashboard view)
        $stmt = $pdo->query("SELECT table_id, table_number, capacity, status FROM tables ORDER BY table_id");
        echo json_encode(['success' => true, 'tables' => $stmt->fetchAll()]);

    } elseif ($method === 'PUT') {
        // UPDATE: Change table status (e.g., vacant -> occupied)
        $data = json_decode(file_get_contents('php://input'), true);
        $table_id = $data['table_id'];
        $status = $data['status']; // Should be 'vacant', 'occupied', or 'reserved'

        $stmt = $pdo->prepare("UPDATE tables SET status = ? WHERE table_id = ?");
        $stmt->execute([$status, $table_id]);

        echo json_encode(['success' => true, 'message' => "Table $table_id updated to $status."]);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not supported.']);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error.']);
}
?>