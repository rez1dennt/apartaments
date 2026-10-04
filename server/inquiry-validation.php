<?php
declare(strict_types=1);

function bergedorf_inquiry_text(array $data, string $key): ?string {
    return !isset($data[$key]) ? '' : (is_string($data[$key]) ? trim($data[$key]) : null);
}
function bergedorf_inquiry_length(string $text): int {
    return preg_match_all('/./us', $text, $matches) === false ? PHP_INT_MAX : count($matches[0]);
}
function bergedorf_inquiry_date(string $value): bool {
    if (!preg_match('/\A\d{4}-\d{2}-\d{2}\z/', $value)) return false;
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date !== false && $date->format('Y-m-d') === $value;
}
function bergedorf_validate_inquiry(array $data, ?string $today = null, ?array $apartmentIds = null): array {
    $today ??= (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d');
    $errors = [];
    $name = bergedorf_inquiry_text($data, 'name');
    $email = bergedorf_inquiry_text($data, 'email');
    $phone = bergedorf_inquiry_text($data, 'phone');
    $message = bergedorf_inquiry_text($data, 'message');
    $apartment = bergedorf_inquiry_text($data, 'apartment');
    $arrival = bergedorf_inquiry_text($data, 'arrival');
    $departure = bergedorf_inquiry_text($data, 'departure');
    if ($name === null || bergedorf_inquiry_length($name) < 2 || bergedorf_inquiry_length($name) > 100 || preg_match('/[\r\n\x00]/', $name)) $errors['name'] = 'name';
    if ($email === null || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $email)) $errors['email'] = 'email';
    if ($phone === null || ($phone !== '' && !preg_match('/\A[+\d ().-]{5,40}\z/', $phone))) $errors['phone'] = 'phone';
    if ($message === null || bergedorf_inquiry_length($message) > 2000) $errors['message'] = 'message';
    if ($apartment === null || ($apartment !== '' && ($apartmentIds === null ? !preg_match('/\A(?:[1-9]|1[0-5])\z/', $apartment) : !in_array($apartment, array_map('strval', $apartmentIds), true)))) $errors['apartment'] = 'apartment';
    if ($arrival === null || ($arrival !== '' && (!bergedorf_inquiry_date($arrival) || $arrival < $today))) $errors['arrival'] = 'date';
    if ($departure === null || ($departure !== '' && (!bergedorf_inquiry_date($departure) || $departure < $today))) $errors['departure'] = 'date';
    if ($arrival !== null && $arrival !== '' && $departure === '') $errors['departure'] = 'datePair';
    if ($departure !== null && $departure !== '' && $arrival === '') $errors['arrival'] = 'datePair';
    if ($arrival && $departure && !isset($errors['arrival']) && !isset($errors['departure']) && $departure <= $arrival) $errors['departure'] = 'dateOrder';
    if (($data['consent'] ?? false) !== true) $errors['consent'] = 'consent';
    return $errors;
}
