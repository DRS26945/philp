<?php
// db_connect.php
$host = 'localhost';
$port = '3307'; // If you are using a non-standard port, specify it here.
$db   = 'restaurant_oms_db'; 
$user = 'root'; 
$pass = ''; 
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     // Log the error and kill execution
     error_log("DB Connection Failed: " . $e->getMessage());
     http_response_code(500);
     die(json_encode(['success' => false, 'message' => 'Server connection failed.']));
}
?>