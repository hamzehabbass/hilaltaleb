<?php
require_once dirname(__DIR__) . '/includes/config.php';
$_SESSION = [];
session_destroy();
header('Location: login.php');
exit;
