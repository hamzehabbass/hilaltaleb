const isArabic = document.documentElement.lang === "ar";
const sitePreloader = document.createElement("div");
sitePreloader.className = "site-preloader";
sitePreloader.setAttribute("role", "status");
sitePreloader.setAttribute("aria-live", "polite");
const preloaderLogo = document.createElement("img");
preloaderLogo.src = "/395185985_347165891026494_3547980265205536502_n.jpg";
preloaderLogo.alt = "";
preloaderLogo.width = 62;
preloaderLogo.height = 62;
const preloaderLabel = document.createElement("p");
preloaderLabel.textContent = isArabic ? "جارٍ تجهيز الموقع" : "Preparing your visit";
const preloaderSpinner = document.createElement("span");
preloaderSpinner.className = "site-preloader-spinner";
preloaderSpinner.setAttribute("aria-hidden", "true");
sitePreloader.append(preloaderLogo, preloaderSpinner, preloaderLabel);
document.body.append(sitePreloader);
const preloaderStartedAt = performance.now();
let preloaderReleased = false;
const releasePreloader = () => {
  if (preloaderReleased) return;
  preloaderReleased = true;
  const minimumDuration = 320;
  window.setTimeout(() => {
    document.documentElement.classList.add("site-ready");
    sitePreloader.setAttribute("aria-hidden", "true");
    window.setTimeout(() => sitePreloader.remove(), reduceMotion ? 0 : 650);
  }, Math.max(0, minimumDuration - (performance.now() - preloaderStartedAt)));
};
window.addEventListener("load", () => {
  if (!document.querySelector("#property-grid")) releasePreloader();
}, { once: true });
window.setTimeout(releasePreloader, 8000);
let firebaseAppPromise;

function getFirebaseApp(config) {
  if (!firebaseAppPromise) {
    firebaseAppPromise = import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js").then((appSdk) => {
      const defaultApp = appSdk.getApps().find((app) => app.name === "[DEFAULT]");
      return { appSdk, app: defaultApp || appSdk.initializeApp(config) };
    });
  }
  return firebaseAppPromise;
}

const firebaseConfig = window.FIREBASE_CONFIG;
if (firebaseConfig?.measurementId) {
  Promise.all([
    getFirebaseApp(firebaseConfig),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js")
  ]).then(([{ app }, analyticsSdk]) => analyticsSdk.getAnalytics(app))
    .catch((error) => console.warn("Firebase Analytics is unavailable in this browser", error));
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduceMotion) {
  document.documentElement.classList.add("motion-ready");
  const revealSelector = [
    "main > section:not(.hero) > *",
    "main > section:not(.hero) .section-topline",
    "main > section:not(.hero) .page-hero-content",
    "main > section:not(.hero) .page-intro",
    "main > section:not(.hero) .section-heading h2",
    "main > section:not(.hero) .section-intro",
    "main > section:not(.hero) .property-card",
    "main > section:not(.hero) .campaign-card",
    "main > section:not(.hero) .property-card .property-photo",
    "main > section:not(.hero) .property-card .property-info > *",
    "main > section:not(.hero) .listing-controls > *",
    "main > section:not(.hero) .contact-links > *",
    "main > section:not(.hero) .journey-item",
    "main > section:not(.hero) .manifesto-content",
    "main > section:not(.hero) .manifesto-number",
    "main > section:not(.hero) .manifesto-stamp",
    "main > section:not(.hero) .contact-copy",
    "main > section:not(.hero) .contact-layout > *",
    "main > section:not(.hero) .process-step",
    "main > section:not(.hero) .detail-copy",
    "main > section:not(.hero) .faq-list details",
    "main > section:not(.hero) .page-cta",
    "main > section:not(.hero) .page-photo-break p",
    "main > section:not(.hero) .office-panel",
    ".site-footer > *"
  ].join(",");
  const revealTargets = new Set();
  const registerRevealTargets = (root = document) => {
    const targets = [];
    if (root.matches?.(revealSelector)) targets.push(root);
    targets.push(...root.querySelectorAll(revealSelector));
    targets.forEach((element) => {
      if (revealTargets.has(element)) return;
      const index = revealTargets.size;
      revealTargets.add(element);
      element.setAttribute("data-reveal", ["up", "right", "left"][index % 3]);
      element.style.setProperty("--reveal-delay", `${(index % 6) * 65}ms`);
    });
  };
  registerRevealTargets();
  const updateReveals = () => {
    const viewportTop = window.innerHeight * 0.04;
    const viewportBottom = window.innerHeight * 0.96;
    revealTargets.forEach((element) => {
      if (!element.isConnected) {
        revealTargets.delete(element);
        return;
      }
      const bounds = element.getBoundingClientRect();
      const isVisible = bounds.top < viewportBottom && bounds.bottom > viewportTop;
      element.classList.toggle("is-visible", isVisible);
    });
  };
  window.addEventListener("scroll", updateReveals, { passive: true });
  window.addEventListener("resize", updateReveals);
  window.addEventListener("visibilitychange", updateReveals);
  window.addEventListener("load", updateReveals, { once: true });
  document.fonts?.ready.then(updateReveals);
  document.querySelectorAll(".hero-slide img").forEach((image) => image.addEventListener("load", updateReveals, { once: true }));
  const revealObserver = new MutationObserver((mutations) => {
    let addedTargets = false;
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const previousSize = revealTargets.size;
        registerRevealTargets(node);
        addedTargets ||= revealTargets.size > previousSize;
      }
    }));
    if (addedTargets) requestAnimationFrame(updateReveals);
  });
  revealObserver.observe(document.body, { childList: true, subtree: true });
  requestAnimationFrame(() => requestAnimationFrame(updateReveals));
  updateReveals();
}

const heroSlider = document.querySelector("[data-hero-slider]");
if (heroSlider) {
  const heroSlides = [...heroSlider.querySelectorAll("[data-hero-slide]")];
  const heroDots = [...heroSlider.querySelectorAll("[data-hero-dot]")];
  const previousButton = heroSlider.querySelector("[data-hero-prev]");
  const nextButton = heroSlider.querySelector("[data-hero-next]");
  const toggleButton = heroSlider.querySelector("[data-hero-toggle]");
  const counter = heroSlider.querySelector("[data-hero-count]");
  let currentSlide = 0;
  let paused = reduceMotion;
  let slideTimer;

  const showSlide = (index) => {
    currentSlide = (index + heroSlides.length) % heroSlides.length;
    heroSlides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === currentSlide));
    heroDots.forEach((dot, dotIndex) => dot.setAttribute("aria-current", String(dotIndex === currentSlide)));
    if (counter) counter.textContent = String(currentSlide + 1).padStart(2, "0");
  };

  const updateSlideTimer = () => {
    window.clearInterval(slideTimer);
    if (!paused && !document.hidden) slideTimer = window.setInterval(() => showSlide(currentSlide + 1), 7800);
    if (toggleButton) {
      const label = paused ? (isArabic ? "استئناف التبديل التلقائي" : "Resume slideshow") : (isArabic ? "إيقاف التبديل التلقائي" : "Pause slideshow");
      toggleButton.setAttribute("aria-label", label);
      toggleButton.setAttribute("title", label);
      toggleButton.setAttribute("aria-pressed", String(paused));
      toggleButton.querySelector("span").textContent = paused ? "▶" : "Ⅱ";
    }
  };

  previousButton?.addEventListener("click", () => { showSlide(currentSlide - 1); updateSlideTimer(); });
  nextButton?.addEventListener("click", () => { showSlide(currentSlide + 1); updateSlideTimer(); });
  heroDots.forEach((dot) => dot.addEventListener("click", () => { showSlide(Number(dot.dataset.heroDot)); updateSlideTimer(); }));
  toggleButton?.addEventListener("click", () => { paused = !paused; updateSlideTimer(); });
  document.addEventListener("visibilitychange", updateSlideTimer);
  showSlide(0);
  updateSlideTimer();
}
const isHomepage = Boolean(heroSlider);
const text = isArabic ? {
  types: { land: "أرض", house: "منزل", apartment: "شقة", commercial: "تجاري", other: "عقار" },
  count: (n) => `${n} عقار`, title: "عقار في الضنية", request: "السعر عند الطلب", sqm: "م²", bedrooms: "غرف نوم", baths: "حمامات", ask: "استفسر عن العقار", noListings: "لا توجد عقارات منشورة حالياً. أخبرنا بما تبحث عنه وسنتواصل معك عند توفر خيارات مناسبة.", noFeatured: "لا توجد عقارات مثبتة على الصفحة الرئيسية حالياً. تصفح جميع العقارات المتاحة.", noMatch: "لا توجد عقارات تطابق هذه التصفية. جرّب اختياراً آخر أو أخبرنا بما تبحث عنه.", contact: "تواصل معنا لمعرفة العقارات المتاحة", unavailable: "تعذر تحميل العقارات الآن. يمكنك الاستفسار مباشرة عبر واتساب.", loaded: "العقارات المتاحة الآن", invalid: "يرجى ملء جميع الحقول بشكل صحيح.", sent: "شكراً لك. وصلنا استفسارك وسنتواصل معك قريباً.", failed: "تعذر إرسال الرسالة الآن. تواصل معنا عبر واتساب أو الهاتف.", sending: "جارٍ إرسال استفسارك..."
} : {
  types: { land: "Land", house: "House", apartment: "Apartment", commercial: "Commercial", other: "Property" },
  count: (n) => `${n} ${n === 1 ? "property" : "properties"}`, title: "Property in Al-Danniyeh", request: "Price on request", sqm: "sqm", bedrooms: "bedrooms", baths: "bathrooms", ask: "Ask about this property", noListings: "There are no published listings just yet. Tell us what you are looking for and we’ll be in touch when a match becomes available.", noFeatured: "No properties are pinned to the homepage yet. Browse all available properties.", noMatch: "No properties match those filters. Try another selection or tell us what you are looking for.", contact: "Ask us about available properties", unavailable: "Properties could not be loaded right now. You can ask us directly on WhatsApp.", loaded: "Available properties", invalid: "Please complete every field with valid information.", sent: "Thank you. Your inquiry has been received and we’ll be in touch soon.", failed: "Your message could not be sent. Please contact us on WhatsApp or by phone.", sending: "Sending your inquiry..."
};
const grid = document.querySelector("#property-grid");
const typeFilter = document.querySelector("#filter-type");
const areaFilter = document.querySelector("#filter-location");
const status = document.querySelector("#data-status");
const form = document.querySelector("#inquiry-form");
const feedback = document.querySelector("#form-feedback");
const inquiryInterest = document.querySelector("#inquiry-interest");
const requestedInterest = new URLSearchParams(window.location.search).get("interest");
if (["buy", "sell", "other"].includes(requestedInterest) && inquiryInterest) {
  inquiryInterest.value = requestedInterest;
}
const whatsapp = "https://wa.me/96181340203";
const logo = "/395185985_347165891026494_3547980265205536502_n.jpg";
let listings = [];
let allAvailableListings = [];
let database;
let firebase;
let galleryAutoplayTimer;

document.querySelectorAll("[data-year]").forEach((element) => { element.textContent = new Date().getFullYear(); });
const menuButton = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  mobileNav.hidden = open;
});
mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  mobileNav.hidden = true;
  menuButton?.setAttribute("aria-expanded", "false");
}));

if (isHomepage) {
  document.querySelectorAll(".listing-controls label").forEach((label) => { label.hidden = true; });
  const listingFoot = document.querySelector(".listing-foot");
  if (listingFoot) {
    const allPropertiesLink = document.createElement("a");
    allPropertiesLink.className = "text-link listing-all-link";
    allPropertiesLink.href = isArabic ? "/properties.html" : "/en-properties.html";
    allPropertiesLink.textContent = isArabic ? "تصفح جميع العقارات ↗" : "See all properties ↗";
    listingFoot.append(allPropertiesLink);
  }
}

const siteHeader = document.querySelector(".site-header");
const whatsappContact = document.createElement("a");
whatsappContact.className = "floating-whatsapp";
whatsappContact.href = `${whatsapp}?text=${encodeURIComponent(isArabic ? "مرحباً هلال، أود الاستفسار عن أحد العقارات المنشورة على الموقع." : "Hello Hilal, I'd like to ask about a property on your website.")}`;
whatsappContact.target = "_blank";
whatsappContact.rel = "noopener noreferrer";
whatsappContact.setAttribute("aria-label", isArabic ? "راسل هلال على واتساب" : "Message Hilal on WhatsApp");
whatsappContact.title = isArabic ? "راسل هلال على واتساب" : "Message Hilal on WhatsApp";
const whatsappIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
whatsappIcon.setAttribute("viewBox", "0 0 24 24");
whatsappIcon.setAttribute("fill", "none");
whatsappIcon.setAttribute("stroke", "currentColor");
whatsappIcon.setAttribute("stroke-width", "1.8");
whatsappIcon.setAttribute("stroke-linecap", "round");
whatsappIcon.setAttribute("stroke-linejoin", "round");
whatsappIcon.setAttribute("aria-hidden", "true");
const whatsappBubble = document.createElementNS("http://www.w3.org/2000/svg", "path");
whatsappBubble.setAttribute("d", "M20 11.5a8.5 8.5 0 0 1-12.1 7.7L4 20l.8-4A8.5 8.5 0 1 1 20 11.5Z");
const whatsappPhone = document.createElementNS("http://www.w3.org/2000/svg", "path");
whatsappPhone.setAttribute("d", "M9 8.5c.2-.6.4-.6.7-.6h.7c.2 0 .4.3.5.6l.5 1.2c.1.3.1.5-.1.7l-.5.6c-.2.2-.1.4 0 .7.8 1.4 1.9 2.5 3.4 3.3.3.1.5.1.7-.1l.7-.8c.2-.2.4-.3.7-.2l1.2.6c.3.1.5.3.5.5 0 .8-.4 1.6-1 2-.7.5-1.6.5-2.5.2-2.8-.8-5.7-3.6-6.5-6.3-.3-.9-.2-1.8.3-2.4z");
whatsappIcon.append(whatsappBubble, whatsappPhone);
whatsappContact.append(whatsappIcon);
const backToTop = document.createElement("button");
backToTop.type = "button";
backToTop.className = "back-to-top";
backToTop.textContent = "↑";
backToTop.setAttribute("aria-label", isArabic ? "العودة إلى أعلى الصفحة" : "Back to top");
backToTop.title = isArabic ? "العودة إلى أعلى الصفحة" : "Back to top";
document.body.append(whatsappContact, backToTop);

const updateScrollChrome = () => {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 20);
  backToTop.classList.toggle("is-visible", window.scrollY > Math.max(300, window.innerHeight * 0.8));
};

window.addEventListener("scroll", updateScrollChrome, { passive: true });
window.addEventListener("resize", updateScrollChrome);
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
updateScrollChrome();

const footerBottom = document.querySelector(".site-footer .footer-bottom");
if (footerBottom) {
  const instagramLink = document.createElement("a");
  instagramLink.href = "https://www.instagram.com/hilalsamirtaleb?stkn=bmphdXczZDBpaG8y";
  instagramLink.target = "_blank";
  instagramLink.rel = "noopener noreferrer";
  instagramLink.textContent = isArabic ? "إنستغرام ↗" : "Instagram ↗";
  const siteCredit = document.createElement("a");
  siteCredit.className = "site-credit";
  siteCredit.href = "https://verixdev.com";
  siteCredit.target = "_blank";
  siteCredit.rel = "noopener noreferrer";
  siteCredit.textContent = isArabic ? "تصميم وتطوير الموقع: VerixDev" : "Website by VerixDev";
  footerBottom.append(instagramLink, siteCredit);
}

function node(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function createPropertyGallery(property) {
  const gallery = document.createElement("div");
  gallery.className = "property-photo property-gallery";
  const title = property[isArabic ? "titleAr" : "titleEn"] || text.title;
  gallery.setAttribute("role", "group");
  gallery.setAttribute("aria-label", isArabic ? `صور ${title}` : `Photos of ${title}`);

  const imageUrls = Array.isArray(property.images)
    ? property.images.filter((url) => typeof url === "string" && url.startsWith("https://"))
    : [];
  if (!imageUrls.length && typeof property.image === "string" && property.image.startsWith("https://")) imageUrls.push(property.image);
  if (!imageUrls.length && typeof property.videoUrl === "string") {
    try {
      const videoUrl = new URL(property.videoUrl);
      const isFacebookHost = videoUrl.hostname === "facebook.com" || videoUrl.hostname.endsWith(".facebook.com");
      if (isFacebookHost && /^\/reel\/\d+\/?$/.test(videoUrl.pathname)) {
        const embedUrl = new URL("https://www.facebook.com/plugins/video.php");
        embedUrl.searchParams.set("height", "315");
        embedUrl.searchParams.set("href", new URL(videoUrl.pathname, "https://www.facebook.com").href);
        embedUrl.searchParams.set("show_text", "false");
        embedUrl.searchParams.set("width", "560");
        embedUrl.searchParams.set("t", "0");
        const frame = document.createElement("div");
        frame.className = "property-video-frame";
        const iframe = document.createElement("iframe");
        iframe.src = embedUrl.href;
        iframe.title = isArabic ? `فيديو العقار ${title}` : `Property video for ${title}`;
        iframe.loading = "lazy";
        iframe.allow = "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        frame.append(iframe);
        gallery.append(frame, node("span", "property-badge", text.types[property.type] || text.types.other));
        gallery.dataset.slideCount = "1";
        return gallery;
      }
    } catch {}
  }
  if (!imageUrls.length) imageUrls.push(logo, logo);
  gallery.dataset.slideCount = String(imageUrls.length);

  const track = document.createElement("div");
  track.className = "property-gallery-track";
  track.setAttribute("aria-label", isArabic ? "اسحب لتصفح الصور" : "Swipe to browse photos");
  if (imageUrls.length > 1) track.tabIndex = 0;

  imageUrls.forEach((url, index) => {
    const slide = document.createElement("div");
    slide.className = "property-gallery-slide";
    if (index === 0) slide.classList.add("is-active");
    const image = document.createElement("img");
    image.src = url;
    image.alt = `${title} ${isArabic ? "صورة" : "photo"} ${index + 1}`;
    image.loading = "lazy";
    image.width = 720;
    image.height = 500;
    image.draggable = false;
    slide.append(image);
    track.append(slide);
  });
  gallery.append(track, node("span", "property-badge", text.types[property.type] || text.types.other));

  if (imageUrls.length > 1) {
    const counter = node("span", "gallery-counter", `01 / ${String(imageUrls.length).padStart(2, "0")}`);
    counter.setAttribute("aria-live", "polite");
    gallery.append(counter);
    let scrollUpdateFrame = 0;
    track.addEventListener("scroll", () => {
      window.cancelAnimationFrame(scrollUpdateFrame);
      scrollUpdateFrame = window.requestAnimationFrame(() => {
        const activeIndex = Math.min(imageUrls.length - 1, Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)));
        counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(imageUrls.length).padStart(2, "0")}`;
        track.querySelectorAll(".property-gallery-slide").forEach((slide, slideIndex) => {
          slide.classList.toggle("is-active", slideIndex === activeIndex);
        });
      });
    }, { passive: true });

    let pointerStart = 0;
    let scrollStart = 0;
    let dragging = false;
    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      gallery.dataset.pauseUntil = String(Date.now() + 8000);
      dragging = true;
      pointerStart = event.clientX;
      scrollStart = track.scrollLeft;
      track.classList.add("is-dragging");
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener("pointermove", (event) => {
      if (dragging) track.scrollLeft = scrollStart - (event.clientX - pointerStart);
    });
    const finishDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("is-dragging");
      const index = Math.min(imageUrls.length - 1, Math.max(0, Math.round(track.scrollLeft / Math.max(track.clientWidth, 1))));
      track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    };
    track.addEventListener("pointerup", finishDrag);
    track.addEventListener("pointercancel", finishDrag);
    track.addEventListener("focusin", () => { gallery.dataset.pauseUntil = String(Date.now() + 8000); });
    track.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const current = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = (current + direction + imageUrls.length) % imageUrls.length;
      gallery.dataset.pauseUntil = String(Date.now() + 8000);
      track.scrollTo({ left: next * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  return gallery;
}

function startPropertyGalleryAutoplay() {
  window.clearInterval(galleryAutoplayTimer);
  if (reduceMotion) return;
  galleryAutoplayTimer = window.setInterval(() => {
    if (document.hidden) return;
    document.querySelectorAll(".property-gallery[data-slide-count]").forEach((gallery) => {
      const slideCount = Number(gallery.dataset.slideCount);
      if (slideCount < 2 || gallery.matches(":hover, :focus-within") || Number(gallery.dataset.pauseUntil) > Date.now()) return;
      const track = gallery.querySelector(".property-gallery-track");
      const current = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      const next = (current + 1) % slideCount;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    });
  }, 5600);
}

function makeCard(item, index) {
  const card = document.createElement("article");
  card.className = "property-card";
  card.style.animationDelay = `${Math.min(index, 8) * 45}ms`;
  const photo = createPropertyGallery(item);
  const info = document.createElement("div");
  info.className = "property-info";
  const title = item[isArabic ? "titleAr" : "titleEn"] || text.title;
  const location = item[isArabic ? "locationAr" : "locationEn"] || (isArabic ? "الضنية، لبنان" : "Al-Danniyeh, Lebanon");
  const type = text.types[item.type] || text.types.other;
  info.append(node("p", "property-location", item[isArabic ? "locationAr" : "locationEn"] || (isArabic ? "الضنية، لبنان" : "Al-Danniyeh, Lebanon")));
  info.append(node("h3", "", title));
  const description = item[isArabic ? "descriptionAr" : "descriptionEn"];
  if (description) info.append(node("p", "property-description", description));
  const facts = document.createElement("div");
  facts.className = "property-facts";
  const appendFact = (name, amount, label, iconPath) => {
    if (Number(amount) <= 0) return;
    const fact = document.createElement("span");
    fact.className = `property-fact property-fact-${name}`;
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.7");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", iconPath);
    icon.append(path);
    fact.append(icon, node("span", "", `${Number(amount).toLocaleString(isArabic ? "ar-LB" : "en-US")} ${label}`));
    facts.append(fact);
  };
  appendFact("area", item.areaSqm, text.sqm, "M4 4h16v16H4z M8 8v3m4-3v2m4-2v3");
  appendFact("bedrooms", item.bedrooms, text.bedrooms, "M3 18v-6h18v6M3 13h18M7 12V8h4v4M2 21v-3m20 3v-3");
  appendFact("bathrooms", item.bathrooms, text.baths, "M3 12h18v2a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6zM5 12V6a2 2 0 0 1 4 0");
  appendFact("kitchens", item.kitchens, isArabic ? "مطابخ" : "kitchens", "M6 3v7m-3-3h6m-3 3v11m8-18v18m0-18c3 3 3 7 0 7");
  appendFact("balconies", item.balconies, isArabic ? "شرفات" : "balconies", "M4 21h16M6 21V4h12v17M6 10h12M10 4v6m4-6v6");
  if (facts.childElementCount) info.append(facts);
  const bottom = document.createElement("div");
  bottom.className = "property-bottom";
  const showPrice = item.showPrice !== false;
  const price = showPrice && item.price ? `${item.currency === "LBP" ? "LBP " : "$"}${Number(item.price).toLocaleString(isArabic ? "ar-LB" : "en-US")}` : text.request;
  const priceElement = node("p", "property-price", price);
  priceElement.hidden = !showPrice;
  const contact = document.createElement("a");
  contact.className = "property-contact";
  const whatsappMessage = isArabic
    ? `مرحباً، أرغب بالاستفسار عن ${type} «${title}» في ${location}. هل العقار متاح؟ ${showPrice && item.price ? "أود معرفة المزيد من التفاصيل." : "يرجى تزويدي بالسعر والتفاصيل."}`
    : `Hello, I’m interested in the ${type.toLowerCase()} “${title}” in ${location}. Is it available? ${showPrice && item.price ? "Please share more details." : "Please share the asking price and details."}`;
  contact.href = `${whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;
  contact.target = "_blank";
  contact.rel = "noopener noreferrer";
  contact.textContent = text.ask;
  bottom.append(priceElement, contact);
  info.append(bottom);
  card.append(photo, info);
  return card;
}

function render() {
  const type = typeFilter?.value || "all";
  const area = areaFilter?.value || "all";
  const matching = listings.filter((item) => (type === "all" || item.type === type) && (area === "all" || item.locationKey === area));
  grid.replaceChildren();
  document.querySelector("#result-count").textContent = text.count(matching.length);
  if (!matching.length) {
    const message = isHomepage && allAvailableListings.length && !listings.length
      ? text.noFeatured
      : listings.length ? text.noMatch : text.noListings;
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.append(node("p", "", message));
    const link = document.createElement("a");
    link.className = "text-link";
    link.href = whatsapp;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = text.contact;
    empty.append(link);
    grid.append(empty);
    return;
  }
  matching.forEach((item, index) => grid.append(makeCard(item, index)));
  startPropertyGalleryAutoplay();
}

function setStatus(message, state) {
  status.classList.toggle("is-live", state === "live");
  status.classList.toggle("is-error", state === "error");
  status.replaceChildren(document.createElement("i"), document.createTextNode(message));
}

function renderCampaignSections(campaignItems) {
  const main = document.querySelector("main");
  const propertiesSection = document.querySelector("#properties");
  if (!main || !propertiesSection) return;
  main.querySelectorAll("[data-campaign-section]").forEach((section) => section.remove());
  const labels = isArabic
    ? { ad: "إعلانات", sale: "مبيعات", offer: "عروض" }
    : { ad: "Ads", sale: "Sales", offer: "Offers" };
  const titles = isArabic
    ? { ad: "إعلانات مختارة", sale: "عقارات للبيع", offer: "عروض خاصة" }
    : { ad: "Featured ads", sale: "For sale", offer: "Special offers" };

  ["ad", "sale", "offer"].forEach((kind) => {
    const matching = campaignItems.filter((item) => item.kind === kind);
    if (!matching.length) return;
    const section = document.createElement("section");
    section.className = `campaign-section section-pad campaign-section-${kind}`;
    section.dataset.campaignSection = kind;
    section.setAttribute("aria-label", titles[kind]);
    const topline = document.createElement("div");
    topline.className = "section-topline";
    topline.append(node("span", "", labels[kind]));
    const heading = document.createElement("div");
    heading.className = "section-heading campaign-heading";
    const headingCopy = document.createElement("div");
    headingCopy.append(node("p", "eyebrow eyebrow-dark", isArabic ? "من المكتب" : "FROM THE OFFICE"));
    headingCopy.append(node("h2", "", titles[kind]));
    heading.append(headingCopy);
    const cards = document.createElement("div");
    cards.className = "campaign-grid";

    matching.forEach((campaign) => {
      const card = document.createElement("article");
      card.className = "campaign-card";
      const visual = document.createElement("div");
      visual.className = "campaign-visual";
      const imageUrl = safeCampaignUrl(campaign.imageUrl);
      if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = campaign[isArabic ? "titleAr" : "titleEn"] || titles[kind];
        image.loading = "lazy";
        visual.append(image);
      } else {
        visual.classList.add("campaign-visual-empty");
        visual.append(node("span", "campaign-visual-mark", labels[kind]));
      }
      const copy = document.createElement("div");
      copy.className = "campaign-copy";
      copy.append(node("p", "eyebrow eyebrow-dark", labels[kind]));
      copy.append(node("h3", "", campaign[isArabic ? "titleAr" : "titleEn"] || titles[kind]));
      const description = campaign[isArabic ? "descriptionAr" : "descriptionEn"];
      if (description) copy.append(node("p", "", description));
      const ctaUrl = safeCampaignUrl(campaign.ctaUrl);
      if (ctaUrl) {
        const link = document.createElement("a");
        link.className = "text-link-arrow";
        link.href = ctaUrl;
        if (new URL(ctaUrl).origin !== window.location.origin) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        link.textContent = campaign[isArabic ? "ctaLabelAr" : "ctaLabelEn"] || (isArabic ? "التفاصيل" : "View details");
        copy.append(link);
      }
      card.append(visual, copy);
      cards.append(card);
    });

    section.append(topline, heading, cards);
    const journeySection = main.querySelector(".journey-section");
    main.insertBefore(section, kind === "ad" ? propertiesSection : journeySection || propertiesSection.nextSibling);
  });
}

function safeCampaignUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "https:" || url.origin === window.location.origin ? url.href : "";
  } catch {
    return "";
  }
}

async function loadCampaignSections() {
  if (!isHomepage) return;
  try {
    const result = await firebase.getDocs(firebase.query(
      firebase.collection(database, "campaigns"),
      firebase.where("status", "==", "active")
    ));
    const campaignItems = result.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
    campaignItems.sort((first, second) => (second.updatedAt?.seconds || 0) - (first.updatedAt?.seconds || 0));
    renderCampaignSections(campaignItems);
  } catch (error) {
    console.warn("Unable to load homepage campaigns", error);
  }
}

async function loadListings() {
  const config = window.FIREBASE_CONFIG;
  if (!config || !["apiKey", "authDomain", "projectId", "appId"].every((key) => config[key]?.trim())) {
    setStatus(isArabic ? "بانتظار إعداد قاعدة البيانات" : "Firebase setup required");
    listings = [];
    allAvailableListings = [];
    render();
    releasePreloader();
    return;
  }
  try {
    const [{ app }, firestoreSdk] = await Promise.all([
      getFirebaseApp(config),
      import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js")
    ]);
    firebase = firestoreSdk;
    database = firebase.getFirestore(app);
    const result = await firebase.getDocs(firebase.query(firebase.collection(database, "properties"), firebase.where("status", "==", "available")));
    await loadCampaignSections();
    allAvailableListings = result.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
    listings = isHomepage ? allAvailableListings.filter((item) => item.homeFeatured !== false) : [...allAvailableListings];
    listings.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
    const locations = new Map();
    listings.forEach((item) => item.locationKey && locations.set(item.locationKey, item[isArabic ? "locationAr" : "locationEn"] || item.locationKey));
    locations.forEach((label, key) => areaFilter.add(new Option(label, key)));
    setStatus(text.loaded, "live");
    render();
    releasePreloader();
  } catch (error) {
    console.error("Unable to load properties", error);
    setStatus(isArabic ? "تعذر الاتصال بقاعدة البيانات" : "Could not connect to Firebase", "error");
    grid.replaceChildren(node("div", "error-state", text.unavailable));
    releasePreloader();
  }
}

function submitInquiry(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;
  feedback.classList.remove("is-error", "is-success");
  const fields = new FormData(form);
  const name = String(fields.get("name")).trim();
  const phone = String(fields.get("phone")).trim();
  const interest = String(fields.get("interest"));
  const interestLabel = form.elements.interest.selectedOptions[0]?.textContent || interest;
  const message = String(fields.get("message")).trim();
  const whatsappMessage = isArabic
    ? `مرحباً، أرغب بالتواصل بخصوص العقارات.\nالاسم: ${name}\nرقم الهاتف: ${phone}\nنوع الاستفسار: ${interestLabel}\nالتفاصيل: ${message}`
    : `Hello, I’m contacting you about real estate.\nName: ${name}\nPhone: ${phone}\nInquiry: ${interestLabel}\nDetails: ${message}`;
  const whatsappUrl = `${whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;
  const whatsappLink = document.createElement("a");
  whatsappLink.href = whatsappUrl;
  whatsappLink.target = "_blank";
  whatsappLink.rel = "noopener noreferrer";
  whatsappLink.textContent = isArabic ? "افتح واتساب وأرسل الرسالة" : "Open WhatsApp and send your message";
  feedback.replaceChildren(document.createTextNode(isArabic ? "تم تجهيز رسالتك. " : "Your message is ready. "), whatsappLink);
  feedback.classList.add("is-success");
  whatsappLink.click();

  if (database && firebase) {
    firebase.addDoc(firebase.collection(database, "inquiries"), {
      name, phone, interest, message,
      source: isArabic ? "website-ar" : "website-en", createdAt: firebase.serverTimestamp()
    }).catch((error) => console.warn("Unable to save inquiry backup", error));
  }
  form.reset();
}

typeFilter?.addEventListener("change", render);
areaFilter?.addEventListener("change", render);
form?.addEventListener("submit", submitInquiry);
if (grid) loadListings();