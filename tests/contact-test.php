<?php
declare(strict_types=1);
$file = __DIR__ . '/../server/contact.php';
if (!file_exists($file)) { fwrite(STDERR, "FAIL: contact validation is not implemented\n"); exit(1); }
require $file;
function expect(bool $condition, string $message): void {
    if (!$condition) { fwrite(STDERR, "FAIL: $message\n"); exit(1); }
}
$valid = ['name' => 'Anna', 'email' => 'anna@example.com', 'consent' => true, 'arrival' => '2026-11-02', 'departure' => '2026-11-05', 'apartment' => '3', 'message' => 'Anfrage', 'website' => ''];
expect(validate_inquiry($valid, '2026-10-01') === [], 'valid inquiry');
expect(isset(validate_inquiry(array_replace($valid, ['consent' => false]), '2026-10-01')['consent']), 'separate consent');
expect(isset(validate_inquiry(array_replace($valid, ['departure' => '2026-11-01']), '2026-10-01')['departure']), 'date order');
expect(isset(validate_inquiry(array_replace($valid, ['arrival' => '2026-02-30']), '2026-10-01')['arrival']), 'impossible date');
expect(isset(validate_inquiry(array_replace($valid, ['email' => "a@example.com\r\nBcc: evil@example.com"]), '2026-10-01')['email']), 'header injection');
expect(isset(validate_inquiry(array_replace($valid, ['name' => ['array']]), '2026-10-01')['name']), 'hostile input types');
expect(!contact_is_configured(['enabled' => true, 'recipient' => 'anfragen@bergedorf-apartments.example', 'sender' => 'same@example.com', 'public_origin' => 'https://example.com', 'legal_approved' => true]), 'placeholder cannot enable sending');
expect(!contact_is_configured(['enabled' => true, 'recipient' => 'real@test.de', 'sender' => 'real@test.de', 'public_origin' => 'http://test.de', 'rate_secret'=>str_repeat('a',32)]), 'nonlocal plaintext origin rejected');
expect(!contact_is_configured(['enabled'=>true,'recipient'=>'real@test.de','sender'=>'real@test.de','public_origin'=>'ftp://localhost','rate_secret'=>str_repeat('a',32)]),'loopback must use HTTP or HTTPS');
echo "PASS: 9 PHP validation/configuration checks\n";
