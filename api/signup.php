<?php
// api/signup.php
header('Content-Type: application/json');
require __DIR__ . '/../db_connect.php';

// In a real-world scenario, you'd want to protect this endpoint,
// perhaps allowing only admins to create new users.
// For now, we'll allow public sign-up for demonstration.

$data = json_decode(file_get_contents('php://input'), true);

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';
$role = $data['role'] ?? '';

// Basic Validation
if (empty($username) || empty($password) || empty($role)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Username, password, and role are required.']));
}

if (!in_array($role, ['waiter', 'kitchen', 'cashier', 'admin'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Invalid role selected.']));
}

try {
    // Check if username already exists
    $stmt = $pdo->prepare("SELECT staff_id FROM staff WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        http_response_code(409); // Conflict
        die(json_encode(['success' => false, 'message' => 'Username already taken. Please choose another.']));
    }

    // Hash the password for secure storage
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Insert the new user
    $insert_stmt = $pdo->prepare("INSERT INTO staff (username, password_hash, role) VALUES (?, ?, ?)");
    $insert_stmt->execute([$username, $password_hash, $role]);

    echo json_encode(['success' => true, 'message' => "User '$username' created successfully as a '$role'. You can now sign in."]);

} catch (\PDOException $e) {
    http_response_code(500);
    error_log("Signup API error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'A database error occurred during sign-up.']);
}
?>