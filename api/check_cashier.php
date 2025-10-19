<?php
// api/check_cashier.php
session_start();

if (!isset($_SESSION['role']) || ($_SESSION['role'] !== 'cashier' && $_SESSION['role'] !== 'admin')) {
    http_response_code(403); 
    echo json_encode(['success' => false, 'message' => 'Access Denied. Cashier privileges required.']);
    exit;
}
?>