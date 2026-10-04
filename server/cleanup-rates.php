<?php
declare(strict_types=1);
// Schedule every 10 minutes on the production host. Contains no inquiry data.
$config = require __DIR__ . '/config.example.php';
if (is_file(__DIR__ . '/config.local.php')) $config = array_replace($config, require __DIR__ . '/config.local.php');
$directory = realpath($config['rate_directory']);
if ($directory === false) exit(0);
foreach (glob($directory . '/*.json') ?: [] as $path) {
    if (!preg_match('/^[a-f0-9]{64}\.json$/', basename($path))) continue;
    $file = @fopen($path, 'r+');
    if (!$file) continue;
    if (flock($file, LOCK_EX | LOCK_NB)) {
        $state = json_decode(stream_get_contents($file), true);
        if (is_array($state) && ($state['expires'] ?? 0) < time()) {
            // Close before unlink for Windows; no live request can reuse an expired state.
            flock($file, LOCK_UN);
            fclose($file);
            @unlink($path);
            continue;
        }
        flock($file, LOCK_UN);
    }
    fclose($file);
}
