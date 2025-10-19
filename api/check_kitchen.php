<?php
// api/check_kitchen.php
session_start();

if (!isset($_SESSION['role']) || ($_SESSION['role'] !== 'kitchen' && $_SESSION['role'] !== 'admin')) {
    http_response_code(403); // Forbidden
    echo json_encode(['success' => false, 'message' => 'Access Denied. Kitchen privileges required.']);
    exit;
}
?>