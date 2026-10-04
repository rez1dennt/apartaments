<?php
declare(strict_types=1);
require_once __DIR__.'/inquiry-validation.php';
function input_text(array $data,string $key): ?string { return bergedorf_inquiry_text($data,$key); }
function validate_inquiry(array $data,?string $today=null): array { return bergedorf_validate_inquiry($data,$today); }
function real_email(mixed $value): bool {
    if (!is_string($value) || !filter_var($value, FILTER_VALIDATE_EMAIL)) return false;
    $domain = strtolower(substr(strrchr($value, '@'), 1));
    return !preg_match('/(?:^|\.)(?:example|invalid|test|localhost)$/', $domain) && !in_array($domain, ['example.com', 'example.org', 'example.net'], true);
}
function contact_is_configured(array $config): bool {
    $origin = $config['public_origin'] ?? '';
    return ($config['enabled'] ?? false) === true
        && real_email($config['recipient'] ?? null)
        && (real_email($config['sender'] ?? null) || (contact_loopback_origin($origin) && is_string($config['sender'] ?? null) && filter_var($config['sender'], FILTER_VALIDATE_EMAIL)))
        && is_string($origin) && filter_var($origin, FILTER_VALIDATE_URL) !== false
        && (str_starts_with($origin, 'https://') || contact_loopback_origin($origin))
        && (parse_url($origin, PHP_URL_PATH) ?? '') === ''
        && !parse_url($origin, PHP_URL_USER) && !parse_url($origin, PHP_URL_QUERY) && !parse_url($origin, PHP_URL_FRAGMENT)
        && strlen($config['rate_secret'] ?? '') >= 32;
}
function contact_loopback_origin(mixed $origin): bool {
    if(!is_string($origin))return false;
    return in_array(parse_url($origin,PHP_URL_SCHEME),['http','https'],true) && in_array(parse_url($origin,PHP_URL_HOST),['127.0.0.1','localhost','[::1]'],true);
}
function json_response(int $status, array $body): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}
function contact_session(bool $secure = true): void {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', '1800');
    session_name('BA_SESSION');
    session_set_cookie_params(['lifetime' => 1800, 'path' => '/api/', 'httponly' => true, 'secure' => $secure, 'samesite' => 'Strict']);
    session_start();
    if (($_SESSION['expires'] ?? 0) < time()) {
        session_regenerate_id(true);
        $_SESSION = ['expires' => time() + 1800, 'csrf' => bin2hex(random_bytes(32))];
    }
}
function rate_allows(array $config, string $ip): bool {
    $directory = $config['rate_directory'] ?? __DIR__ . '/.rate-limits';
    if (!is_dir($directory) && !@mkdir($directory, 0700, true)) return false;
    $key = hash_hmac('sha256', $ip, $config['rate_secret']);
    $file = @fopen($directory . '/' . $key . '.json', 'c+');
    if (!$file || !flock($file, LOCK_EX)) { if ($file) fclose($file); return false; }
    $state = json_decode(stream_get_contents($file) ?: '{}', true);
    $now = time();
    if (!is_array($state) || ($state['expires'] ?? 0) < $now) $state = ['expires' => $now + 600, 'count' => 0];
    $allowed = $state['count'] < 5;
    if ($allowed) $state['count']++;
    ftruncate($file, 0);
    rewind($file);
    fwrite($file, json_encode($state));
    fflush($file);
    flock($file, LOCK_UN);
    fclose($file);
    return $allowed;
}
function dispatch_inquiry(array $data, array $config): bool {
    if(contact_loopback_origin($config['public_origin'] ?? '') && isset($config['local_mailpit_port'])) {
        ini_set('SMTP','127.0.0.1');ini_set('smtp_port',(string)(int)$config['local_mailpit_port']);
    }
    $name = input_text($data, 'name');
    $email = input_text($data, 'email');
    $id = bin2hex(random_bytes(6));
    $body = "Bergedorf Apartments — inquiry $id\n\n";
    foreach (['name', 'email', 'phone', 'arrival', 'departure', 'apartment', 'message'] as $field) $body .= ucfirst($field) . ': ' . (input_text($data, $field) ?: '—') . "\n";
    $body .= "\nSeparate consent: affirmative\nConsent version: 2026-10-01\nTime: " . gmdate('c') . "\nRequest ID: $id\nLanguage: " . (($data['language'] ?? '') === 'ru' ? 'ru' : 'de') . "\n\nThis is an inquiry, not a confirmed reservation.\n";
    $headers = ['From' => $config['sender'], 'Reply-To' => $email, 'MIME-Version' => '1.0', 'Content-Type' => 'text/plain; charset=UTF-8', 'Content-Transfer-Encoding' => 'base64'];
    return @mail($config['recipient'], 'Bergedorf Apartments — inquiry ' . $id, chunk_split(base64_encode($body)), $headers);
}
function run_contact_api(): never {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, ['GET', 'POST'], true)) { header('Allow: GET, POST'); json_response(405, ['error' => 'method']); }
    $config = require __DIR__ . '/config.example.php';
    if (is_file(__DIR__ . '/config.local.php')) $config = array_replace($config, require __DIR__ . '/config.local.php');
    if (!contact_is_configured($config)) {
        if ($method === 'GET') json_response(200, ['enabled' => false, 'csrf' => null]);
        json_response(503, ['error' => 'not_configured']);
    }
    if (isset($_SERVER['HTTP_SEC_FETCH_SITE']) && !in_array($_SERVER['HTTP_SEC_FETCH_SITE'], ['same-origin', 'none'], true)) json_response(403, ['error' => 'origin']);
    if ($method === 'POST' && ($_SERVER['HTTP_ORIGIN'] ?? '') !== $config['public_origin']) json_response(403, ['error' => 'origin']);
    contact_session(str_starts_with($config['public_origin'],'https://'));
    if ($method === 'GET') json_response(200, ['enabled' => true, 'csrf' => $_SESSION['csrf']]);
    $csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($csrf) || !hash_equals($_SESSION['csrf'], $csrf)) json_response(403, ['error' => 'csrf']);
    if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) json_response(415, ['error' => 'content_type']);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 16384) json_response(413, ['error' => 'size']);
    $raw = file_get_contents('php://input', false, null, 0, 16385);
    if ($raw === false || strlen($raw) > 16384) json_response(413, ['error' => 'size']);
    try { $data = json_decode($raw, true, 16, JSON_THROW_ON_ERROR); } catch (JsonException) { json_response(400, ['error' => 'json']); }
    if (!is_array($data) || array_is_list($data)) json_response(400, ['error' => 'payload']);
    if (input_text($data, 'website') !== '') json_response(422, ['error' => 'spam']);
    $errors = validate_inquiry($data);
    if ($errors) json_response(422, ['errors' => $errors]);
    if (($data['consentVersion'] ?? '') !== '2026-10-01') json_response(422, ['errors' => ['consent' => 'consent']]);
    if (!rate_allows($config, $_SERVER['REMOTE_ADDR'] ?? 'unknown')) { header('Retry-After: 600'); json_response(429, ['error' => 'rate_limit']); }
    if (!dispatch_inquiry($data, $config)) json_response(502, ['error' => 'transport']);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    json_response(200, ['success' => true, 'csrf' => $_SESSION['csrf']]);
}
