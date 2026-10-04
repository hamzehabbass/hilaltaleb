const isArabic = document.documentElement.lang === "ar";
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
const text = isArabic ? {
  types: { land: "أرض", house: "منزل", apartment: "شقة", commercial: "تجاري", other: "عقار" },
  count: (n) => `${n} عقار`, title: "عقار في الضنية", request: "السعر عند الطلب", sqm: "م²", bedrooms: "غرف نوم", baths: "حمامات", ask: "استفسر عن العقار", noListings: "لا توجد عقارات منشورة حالياً. أخبرنا بما تبحث عنه وسنتواصل معك عند توفر خيارات مناسبة.", noMatch: "لا توجد عقارات تطابق هذه التصفية. جرّب اختياراً آخر أو أخبرنا بما تبحث عنه.", contact: "تواصل معنا لمعرفة العقارات المتاحة", unavailable: "تعذر تحميل العقارات الآن. يمكنك الاستفسار مباشرة عبر واتساب.", loaded: "العقارات المتاحة الآن", invalid: "يرجى ملء جميع الحقول بشكل صحيح.", sent: "شكراً لك. وصلنا استفسارك وسنتواصل معك قريباً.", failed: "تعذر إرسال الرسالة الآن. تواصل معنا عبر واتساب أو الهاتف.", sending: "جارٍ إرسال استفسارك..."
} : {
  types: { land: "Land", house: "House", apartment: "Apartment", commercial: "Commercial", other: "Property" },
  count: (n) => `${n} ${n === 1 ? "property" : "properties"}`, title: "Property in Al-Danniyeh", request: "Price on request", sqm: "sqm", bedrooms: "bedrooms", baths: "bathrooms", ask: "Ask about this property", noListings: "There are no published listings just yet. Tell us what you are looking for and we’ll be in touch when a match becomes available.", noMatch: "No properties match those filters. Try another selection or tell us what you are looking for.", contact: "Ask us about available properties", unavailable: "Properties could not be loaded right now. You can ask us directly on WhatsApp.", loaded: "Available properties", invalid: "Please complete every field with valid information.", sent: "Thank you. Your inquiry has been received and we’ll be in touch soon.", failed: "Your message could not be sent. Please contact us on WhatsApp or by phone.", sending: "Sending your inquiry..."
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

const siteHeader = document.querySelector(".site-header");
const backToTop = document.createElement("button");
backToTop.type = "button";
backToTop.className = "back-to-top";
backToTop.textContent = "↑";
backToTop.setAttribute("aria-label", isArabic ? "العودة إلى أعلى الصفحة" : "Back to top");
backToTop.title = isArabic ? "العودة إلى أعلى الصفحة" : "Back to top";
document.body.append(backToTop);

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
  const siteCredit = document.createElement("span");
  siteCredit.className = "site-credit";
  siteCredit.textContent = isArabic ? "تصميم وتطوير الموقع: VerixDev" : "Website by VerixDev";
  footerBottom.append(siteCredit);
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
  if (!imageUrls.length) imageUrls.push(logo);
  gallery.dataset.slideCount = String(imageUrls.length);

  const track = document.createElement("div");
  track.className = "property-gallery-track";
  track.setAttribute("aria-label", isArabic ? "اسحب لتصفح الصور" : "Swipe to browse photos");
  if (imageUrls.length > 1) track.tabIndex = 0;

  imageUrls.forEach((url, index) => {
    const slide = document.createElement("div");
    slide.className = "property-gallery-slide";
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
    track.addEventListener("scroll", () => {
      const index = Math.min(imageUrls.length - 1, Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)));
      counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(imageUrls.length).padStart(2, "0")}`;
    }, { passive: true });

    let pointerStart = 0;
    let scrollStart = 0;
    let dragging = false;
    track.addEventListener("pointerdown", (event) => {
      gallery.dataset.pauseUntil = String(Date.now() + 8000);
      if (event.pointerType === "touch" || event.button !== 0) return;
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
      dragging = false;
      track.classList.remove("is-dragging");
    };
    track.addEventListener("pointerup", finishDrag);
    track.addEventListener("pointercancel", finishDrag);
    track.addEventListener("focusin", () => { gallery.dataset.pauseUntil = String(Date.now() + 8000); });
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
  if (Number(item.areaSqm) > 0) facts.append(node("span", "", `${Number(item.areaSqm).toLocaleString(isArabic ? "ar-LB" : "en-US")} ${text.sqm}`));
  if (Number(item.bedrooms) > 0) facts.append(node("span", "", `${item.bedrooms} ${text.bedrooms}`));
  if (Number(item.bathrooms) > 0) facts.append(node("span", "", `${item.bathrooms} ${text.baths}`));
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
    const message = listings.length ? text.noMatch : text.noListings;
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

async function loadListings() {
  const config = window.FIREBASE_CONFIG;
  if (!config || !["apiKey", "authDomain", "projectId", "appId"].every((key) => config[key]?.trim())) {
    setStatus(isArabic ? "بانتظار إعداد قاعدة البيانات" : "Firebase setup required");
    listings = [];
    render();
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
    listings = result.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
    listings.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
    const locations = new Map();
    listings.forEach((item) => item.locationKey && locations.set(item.locationKey, item[isArabic ? "locationAr" : "locationEn"] || item.locationKey));
    locations.forEach((label, key) => areaFilter.add(new Option(label, key)));
    setStatus(text.loaded, "live");
    render();
  } catch (error) {
    console.error("Unable to load properties", error);
    setStatus(isArabic ? "تعذر الاتصال بقاعدة البيانات" : "Could not connect to Firebase", "error");
    grid.replaceChildren(node("div", "error-state", text.unavailable));
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