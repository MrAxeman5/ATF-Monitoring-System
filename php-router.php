<?php
// Get the requested PHP file from the URL
$request = $_SERVER['REQUEST_URI'];

// Define the directory where your PHP files are located
$phpFilesDir = __DIR__ . '/php';

// Ensure the requested PHP file is within the allowed directory
if (strpos($request, $phpFilesDir) === 0 && is_file($request)) {
    // Execute the requested PHP file
    include $request;
} else {
    // Handle 404 errors
    http_response_code(404);
    echo 'Not Found';
}
?>
