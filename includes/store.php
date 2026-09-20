<?php
function storePath(string $name): string {
    $dir = dirname(DB_PATH);
    if (!is_dir($dir)) mkdir($dir, 0775, true);
    return $dir . '/' . $name . '.json';
}
function storeLoad(string $name): array {
    $f = storePath($name);
    if (!is_file($f)) return [];
    $data = json_decode((string)file_get_contents($f), true);
    return is_array($data) ? $data : [];
}
function storeSave(string $name, array $data): void {
    $f = storePath($name);
    $fp = fopen($f, 'c+');
    if (!$fp) throw new RuntimeException('Cannot write store '.$name);
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}
function storeNextId(array $rows): int {
    $max = 0;
    foreach ($rows as $r) { if ((int)$r['id'] > $max) $max = (int)$r['id']; }
    return $max + 1;
}
function storeFind(array $rows, int $id): ?array {
    foreach ($rows as $r) { if ((int)$r['id'] === $id) return $r; }
    return null;
}
