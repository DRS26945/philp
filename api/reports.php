<?php
// api/reports.php
header('Content-Type: application/json');
require '../db_connect.php'; 
require 'check_admin.php'; 

$startDate = $_GET['from'] ?? date('Y-m-d', strtotime('-7 days'));
$endDate = $_GET['to'] ?? date('Y-m-d');

try {
    // Query to aggregate daily sales and order count within the date range
    $stmt = $pdo->prepare("
        SELECT 
            DATE(bill_date) AS date,
            SUM(total_amount) AS total_sales,
            COUNT(bill_id) AS order_count
        FROM bills
        WHERE bill_date BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY DATE(bill_date)
        ORDER BY date DESC
    ");
    // Use date for start, and start date + 1 day for the end of the range
    $stmt->execute([$startDate, $endDate]); 
    $reports = $stmt->fetchAll();

    echo json_encode(['success' => true, 'reports' => $reports]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Report database error.']);
}
?>