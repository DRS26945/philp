<?php
// api/check_admin.php
session_start();

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403); // Forbidden
    echo json_encode(['success' => false, 'message' => 'Access Denied. Admin privileges required.']);
    exit;
}
// If execution reaches here, the user is a logged-in admin.
?>