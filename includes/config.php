<?php
define('SITE_NAME_AR', 'عقارات سمير طالب');
define('SITE_NAME_EN', 'Samir Taleb Real Estate');
define('SITE_TAGLINE_AR', 'نبيع ونشتري العقارات في الضنية');
define('SITE_TAGLINE_EN', 'We buy and sell properties in Al-Danniyeh');
define('SITE_SUB_AR', 'هلال سمير طالب');
define('SITE_SUB_EN', 'Hilal Samir Taleb');
define('DB_PATH', __DIR__ . '/../data/database.sqlite');
define('UPLOAD_DIR', __DIR__ . '/../uploads/properties/');
define('UPLOAD_URL', 'uploads/properties/');
define('PHONE_HILAL', '81340203');
define('PHONE_HILAL_INTL', '+96181340203');
define('PHONE_HILAL_SHOW', '81 340 203');
define('PHONE_SAMIR', '70338493');
define('PHONE_SAMIR_INTL', '+96170338493');
define('PHONE_SAMIR_SHOW', '70 338 493');
define('EMAIL', 'hilalreal36@gmail.com');
define('WHATSAPP_GROUP', 'https://chat.whatsapp.com/EYhhXfTlOvIL4JtGbSiTrB');
define('OFFICE_AR', 'مراح السريج، الضنية، شمال لبنان');
define('OFFICE_EN', 'Mrah El Sreij, Al-Danniyeh, North Lebanon');
define('OFFICE_MAP', 'https://maps.google.com/?q=Mrah+El+Sreij+Danniyeh+Lebanon');
session_start();
if (!isset($_SESSION['lang'])) { $_SESSION['lang'] = 'ar'; }
if (isset($_GET['lang']) && in_array($_GET['lang'], ['ar', 'en'])) { $_SESSION['lang'] = $_GET['lang']; }
define('LANG', $_SESSION['lang']);
define('IS_AR', LANG === 'ar');
define('DIR', IS_AR ? 'rtl' : 'ltr');
require_once __DIR__ . '/store.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/i18n.php';
require_once __DIR__ . '/functions.php';
