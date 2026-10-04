<?php
declare(strict_types=1);
// Development only. Production document root must be public/.
$root = realpath(__DIR__ . '/../public');
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = realpath($root . rawurldecode($uri));
if (!$path || ($path !== $root && !str_starts_with($path, $root . DIRECTORY_SEPARATOR))) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>404 · Bergedorf Apartments</title><body style="font-family:Georgia,serif;background:#faf9f6;padding:10vw;color:#35372d"><h1>Hier geht es nicht weiter.</h1><p>Diese Seite wurde nicht gefunden.</p><a href="/">Zurück zu Bergedorf Apartments →</a></body></html>';
    return true;
}
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
if (is_dir($path)) {
    if (!str_ends_with($uri, '/')) { header('Location: ' . $uri . '/', true, 301); return true; }
    $path .= DIRECTORY_SEPARATOR . 'index.html';
    if (!is_file($path)) { http_response_code(404); return true; }
    header('Content-Type: text/html; charset=utf-8');
    readfile($path);
    return true;
}
return false;
