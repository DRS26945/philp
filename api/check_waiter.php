<?php
// api/check_waiter.php
session_start();

if (!isset($_SESSION['role']) || ($_SESSION['role'] !== 'waiter' && $_SESSION['role'] !== 'admin')) {
    http_response_code(403); // Forbidden
    echo json_encode(['success' => false, 'message' => 'Access Denied. Waiter privileges required.']);
    exit;
}
?>