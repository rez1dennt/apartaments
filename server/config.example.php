<?php
declare(strict_types=1);
// Copy to config.local.php outside the public document root. Never commit secrets.
return [
    'enabled' => true,
    'recipient' => 'Vp@simplyfood.de',
    'sender' => '', // Server-authorized address on your website domain, not the visitor's email.
    'public_origin' => '',
    'rate_secret' => '', // Generate: php -r "echo bin2hex(random_bytes(32));"
    'rate_directory' => __DIR__ . '/.rate-limits',
    // PHP mail() must be configured by the hosting provider. SMTP is not fabricated.
];
