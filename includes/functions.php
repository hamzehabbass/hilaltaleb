<?php
function phoneLink(string $intl, string $display): string {
    return '<a class="phone" dir="ltr" href="tel:' . e($intl) . '">' . e($display) . '</a>';
}
function e(?string $s): string {
    return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
function url(string $path = '', array $params = []): string {
    $base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
    if (str_ends_with($base, '/admin')) $base = dirname($base);
    if ($base === '/' || $base === '\\' || $base === '.') $base = '';
    $qs = $params ? ('?' . http_build_query($params)) : '';
    return $base . '/' . ltrim($path, '/') . $qs;
}
function langUrl(string $lang): string {
    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    $parts = parse_url($uri);
    parse_str($parts['query'] ?? '', $q);
    $q['lang'] = $lang;
    return ($parts['path'] ?? '/') . '?' . http_build_query($q);
}
function formatPrice($row): string {
    if (!empty($row['price_on_request']) || empty($row['price'])) return t('on_request');
    return '$' . number_format((float)$row['price'], 0, '.', ',');
}
function formatArea($n): string {
    if ($n === null || $n === '') return '—';
    return number_format((float)$n, 0, '.', ',') . ' ' . t('sqm');
}
function isAdmin(): bool { return !empty($_SESSION['admin_id']); }
function requireAdmin(): void {
    if (!isAdmin()) { header('Location: login.php'); exit; }
}
function waLink(string $phoneIntl, string $text = ''): string {
    $num = preg_replace('/\D/', '', $phoneIntl);
    $q = $text ? ('?text=' . rawurlencode($text)) : '';
    return 'https://wa.me/' . $num . $q;
}
function featuresList(?string $raw): array {
    if (!$raw) return [];
    return array_values(array_filter(array_map('trim', explode('|', $raw))));
}
