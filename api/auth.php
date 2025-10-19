<?php
// api/auth.php
header('Content-Type: application/json');
require __DIR__ . '/../db_connect.php';
session_start();

// 1. Get POST data from the frontend
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

try {
    // 2. Use Prepared Statement to fetch user data
    $stmt = $pdo->prepare("SELECT staff_id, password_hash, role FROM staff WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    // 3. Verify password hash
    if ($user && password_verify($password, $user['password_hash'])) {
        // SUCCESS: Set session variables for security
        session_regenerate_id(true); // Prevent session fixation
        $_SESSION['staff_id'] = $user['staff_id'];
        $_SESSION['role'] = $user['role'];

        echo json_encode(['success' => true, 'role' => $user['role']]);
    } else {
        // FAILURE
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error during authentication.']);
}
?>