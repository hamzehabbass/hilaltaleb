<?php
require_once __DIR__ . '/includes/config.php';
$page = 'home';
$title = (IS_AR ? SITE_NAME_AR : SITE_NAME_EN) . ' — ' . (IS_AR ? SITE_TAGLINE_AR : SITE_TAGLINE_EN);
$featured = allProperties(['status'=>'available','limit'=>6]);
$heroClass = is_file(__DIR__ . '/assets/img/hero.jpg') ? 'hero has-img' : 'hero hero-fallback';
require __DIR__ . '/includes/header.php';
?>
<section class="<?= $heroClass ?>">
  <div class="container hero-inner">
    <div class="eyebrow">Al-Danniyeh · الضنية</div>
    <h1><?= t('hero_title') ?></h1>
    <p><?= t('hero_sub') ?></p>
    <div class="hero-actions">
      <a class="btn btn-gold" href="<?= e(url('buy.php')) ?>"><?= t('buy') ?></a>
      <a class="btn btn-ghost" href="<?= e(url('sell.php')) ?>"><?= t('sell') ?></a>
      <a class="btn btn-ghost" href="<?= e(waLink(PHONE_HILAL_INTL, IS_AR ? 'مرحبا، مهتم بعقاراتكم' : 'Hello, I am interested in your listings')) ?>"><?= t('whatsapp') ?></a>
    </div>
  </div>
</section>
<section>
  <div class="container">
    <div class="section-head">
      <div>
        <div class="eyebrow"><?= t('featured') ?></div>
        <h2><?= t('featured_properties') ?></h2>
      </div>
      <a class="btn btn-outline" href="<?= e(url('properties.php')) ?>"><?= t('all_properties') ?></a>
    </div>
    <div class="grid grid-3">
      <?php foreach ($featured as $p) include __DIR__ . '/includes/card.php'; ?>
    </div>
  </div>
</section>
<?php require __DIR__ . '/includes/footer.php'; ?>
