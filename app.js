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
    "main > section:not(.hero) .section-topline",
    "main > section:not(.hero) .page-hero-content",
    "main > section:not(.hero) .page-intro",
    "main > section:not(.hero) .section-heading h2",
    "main > section:not(.hero) .section-intro",
    "main > section:not(.hero) .property-card",
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
  const revealTargets = [...new Set(document.querySelectorAll(revealSelector))];
  revealTargets.forEach((element, index) => {
    element.setAttribute("data-reveal", ["up", "right", "left"][index % 3]);
    element.style.setProperty("--reveal-delay", `${(index % 6) * 65}ms`);
  });
  const updateReveals = () => {
    const viewportTop = window.innerHeight * 0.04;
    const viewportBottom = window.innerHeight * 0.96;
    revealTargets.forEach((element) => {
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

function node(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function makeCard(item, index) {
  const card = document.createElement("article");
  card.className = "property-card";
  card.style.animationDelay = `${Math.min(index, 8) * 45}ms`;
  const photo = document.createElement("div");
  photo.className = "property-photo";
  const image = document.createElement("img");
  const candidate = Array.isArray(item.images) ? item.images[0] : item.image;
  image.src = typeof candidate === "string" && candidate.startsWith("https://") ? candidate : logo;
  image.alt = item[isArabic ? "titleAr" : "titleEn"] || text.title;
  image.loading = "lazy";
  image.width = 720;
  image.height = 500;
  photo.append(image, node("span", "property-badge", text.types[item.type] || text.types.other));
  const info = document.createElement("div");
  info.className = "property-info";
  info.append(node("p", "property-location", item[isArabic ? "locationAr" : "locationEn"] || (isArabic ? "الضنية، لبنان" : "Al-Danniyeh, Lebanon")));
  info.append(node("h3", "", item[isArabic ? "titleAr" : "titleEn"] || text.title));
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
  const price = item.price ? `${item.currency === "LBP" ? "LBP " : "$"}${Number(item.price).toLocaleString(isArabic ? "ar-LB" : "en-US")}` : text.request;
  const contact = document.createElement("a");
  contact.className = "property-contact";
  contact.href = `${whatsapp}?text=${encodeURIComponent(`${text.ask}: ${item[isArabic ? "titleAr" : "titleEn"] || text.title}`)}`;
  contact.target = "_blank";
  contact.rel = "noopener noreferrer";
  contact.textContent = text.ask;
  bottom.append(node("p", "property-price", price), contact);
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

async function submitInquiry(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;
  feedback.classList.remove("is-error", "is-success");
  if (!database) {
    feedback.textContent = isArabic ? "نموذج الرسائل غير مفعّل بعد. يرجى التواصل معنا عبر واتساب أو الهاتف." : "The inquiry form is not connected yet. Please contact us on WhatsApp or by phone.";
    feedback.classList.add("is-error");
    return;
  }
  const button = form.querySelector("button[type='submit']");
  const fields = new FormData(form);
  button.disabled = true;
  feedback.textContent = text.sending;
  try {
    await firebase.addDoc(firebase.collection(database, "inquiries"), {
      name: String(fields.get("name")).trim(), phone: String(fields.get("phone")).trim(),
      interest: String(fields.get("interest")), message: String(fields.get("message")).trim(),
      source: isArabic ? "website-ar" : "website-en", createdAt: firebase.serverTimestamp()
    });
    form.reset();
    feedback.textContent = text.sent;
    feedback.classList.add("is-success");
  } catch (error) {
    console.error("Unable to save inquiry", error);
    feedback.textContent = text.failed;
    feedback.classList.add("is-error");
  } finally {
    button.disabled = false;
  }
}

typeFilter?.addEventListener("change", render);
areaFilter?.addEventListener("change", render);
form?.addEventListener("submit", submitInquiry);
if (grid) loadListings();