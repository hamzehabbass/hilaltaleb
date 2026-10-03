const configNotice = document.querySelector("#config-notice");
const loginForm = document.querySelector("#login-form");
const dashboard = document.querySelector("#admin-dashboard");
const loginFeedback = document.querySelector("#login-feedback");
const propertyForm = document.querySelector("#property-form");
const propertyFeedback = document.querySelector("#property-feedback");
const inventoryRows = document.querySelector("#inventory-rows");
const inventoryMessage = document.querySelector("#inventory-message");
const photoInput = document.querySelector("#property-photos");
const photoPreview = document.querySelector("#photo-preview");
const signoutButton = document.querySelector("#signout-button");
const maxPhotoBytes = 8 * 1024 * 1024;
let authApi;
let databaseApi;
let storageApi;
let auth;
let database;
let storage;
let listings = [];
let editingId = null;
let retainedImages = [];
let retainedPaths = [];
let originalPaths = [];
let selectedFiles = [];
let previewUrls = [];

function setFeedback(element, message, state = "") {
  element.textContent = message;
  element.classList.toggle("is-error", state === "error");
  element.classList.toggle("is-success", state === "success");
}

function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.append(cell);
  return cell;
}

function formatPrice(property) {
  if (!property.price) return "Price on request";
  const amount = Number(property.price).toLocaleString("en-US");
  return `${property.currency === "LBP" ? "LBP " : "$"}${amount}`;
}

function renderInventory() {
  inventoryRows.replaceChildren();
  document.querySelector("#inventory-count").textContent = String(listings.length);
  if (!listings.length) {
    inventoryMessage.textContent = "No properties yet. Use the form to add your first listing.";
    return;
  }
  inventoryMessage.textContent = `${listings.length} saved ${listings.length === 1 ? "property" : "properties"}.`;
  listings.forEach((property) => {
    const row = document.createElement("tr");
    const titleCell = document.createElement("td");
    const title = document.createElement("span");
    title.className = "inventory-title";
    title.textContent = property.titleEn || property.titleAr || "Untitled property";
    const location = document.createElement("span");
    location.className = "inventory-location";
    location.textContent = property.locationEn || property.locationAr || "";
    titleCell.append(title, location);
    row.append(titleCell);
    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `status-chip ${property.status || "draft"}`;
    badge.textContent = property.status || "draft";
    statusCell.append(badge);
    row.append(statusCell);
    addCell(row, formatPrice(property));
    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.dataset.action = "edit";
    edit.dataset.id = property.id;
    edit.textContent = "Edit";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-property";
    remove.dataset.action = "delete";
    remove.dataset.id = property.id;
    remove.textContent = "Delete";
    actions.append(edit, remove);
    actionsCell.append(actions);
    row.append(actionsCell);
    inventoryRows.append(row);
  });
}

async function refreshInventory() {
  inventoryMessage.textContent = "Loading properties...";
  try {
    const result = await databaseApi.getDocs(databaseApi.collection(database, "properties"));
    listings = result.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
    listings.sort((first, second) => (second.updatedAt?.seconds || 0) - (first.updatedAt?.seconds || 0));
    renderInventory();
  } catch (error) {
    console.error("Unable to load inventory", error);
    inventoryMessage.textContent = "Could not load inventory. Confirm this account UID is authorized in firestore.rules.";
  }
}

function renderPhotoPreview() {
  previewUrls.forEach((url) => URL.revokeObjectURL(url));
  previewUrls = [];
  photoPreview.replaceChildren();
  const previews = [
    ...retainedImages.map((url, index) => ({ url, kind: "existing", index })),
    ...selectedFiles.map((file, index) => {
      const url = URL.createObjectURL(file);
      previewUrls.push(url);
      return { url, kind: "new", index };
    })
  ];
  previews.forEach((preview) => {
    const item = document.createElement("div");
    item.className = "preview-item";
    const image = document.createElement("img");
    image.src = preview.url;
    image.alt = "Property photo preview";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", "Remove photo");
    remove.dataset.kind = preview.kind;
    remove.dataset.index = String(preview.index);
    remove.textContent = "×";
    item.append(image, remove);
    photoPreview.append(item);
  });
}

function resetEditor() {
  propertyForm.reset();
  editingId = null;
  retainedImages = [];
  retainedPaths = [];
  originalPaths = [];
  selectedFiles = [];
  photoInput.value = "";
  document.querySelector("#editor-title").textContent = "Add a property";
  document.querySelector("#save-property").textContent = "Publish property";
  renderPhotoPreview();
  setFeedback(propertyFeedback, "Only available listings appear on the public site.");
}

function editProperty(property) {
  editingId = property.id;
  const fields = propertyForm.elements;
  ["titleEn", "titleAr", "type", "status", "locationKey", "areaSqm", "locationEn", "locationAr", "price", "currency", "bedrooms", "bathrooms", "descriptionEn", "descriptionAr"].forEach((name) => {
    fields[name].value = property[name] ?? (name === "price" || name === "bedrooms" || name === "bathrooms" ? "0" : "");
  });
  fields.showPrice.checked = property.showPrice !== false;
  retainedImages = [...(property.images || [])];
  retainedPaths = [...(property.imagePaths || [])];
  originalPaths = [...retainedPaths];
  selectedFiles = [];
  document.querySelector("#editor-title").textContent = "Edit property";
  document.querySelector("#save-property").textContent = "Save changes";
  setFeedback(propertyFeedback, "Update the details, then save your changes.");
  renderPhotoPreview();
  propertyForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function uploadSelectedPhotos(propertyId) {
  const images = [...retainedImages];
  const paths = [...retainedPaths];
  for (const [index, file] of selectedFiles.entries()) {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > maxPhotoBytes) {
      throw new Error("Choose JPG, PNG, or WebP photos under 8 MB each.");
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `properties/${propertyId}/${Date.now()}-${index}-${safeName}`;
    const photoRef = storageApi.ref(storage, path);
    const uploaded = await storageApi.uploadBytes(photoRef, file, { contentType: file.type });
    images.push(await storageApi.getDownloadURL(uploaded.ref));
    paths.push(path);
  }
  return { images, imagePaths: paths };
}

async function saveProperty(event) {
  event.preventDefault();
  if (!propertyForm.reportValidity()) return;
  const button = document.querySelector("#save-property");
  const fields = new FormData(propertyForm);
  const propertyId = editingId || databaseApi.doc(databaseApi.collection(database, "properties")).id;
  const previous = listings.find((property) => property.id === editingId);
  button.disabled = true;
  setFeedback(propertyFeedback, "Saving property and uploading photos...");
  try {
    const photos = await uploadSelectedPhotos(propertyId);
    const property = {
      titleEn: String(fields.get("titleEn")).trim(),
      titleAr: String(fields.get("titleAr")).trim(),
      type: String(fields.get("type")),
      status: String(fields.get("status")),
      locationKey: String(fields.get("locationKey")).trim().toLowerCase(),
      locationEn: String(fields.get("locationEn")).trim(),
      locationAr: String(fields.get("locationAr")).trim(),
      areaSqm: Number(fields.get("areaSqm")) || 0,
      price: Number(fields.get("price")) || 0,
      showPrice: fields.get("showPrice") === "on",
      currency: String(fields.get("currency")),
      bedrooms: Number(fields.get("bedrooms")) || 0,
      bathrooms: Number(fields.get("bathrooms")) || 0,
      descriptionEn: String(fields.get("descriptionEn")).trim(),
      descriptionAr: String(fields.get("descriptionAr")).trim(),
      ...photos,
      updatedAt: databaseApi.serverTimestamp()
    };
    if (editingId) {
      await databaseApi.updateDoc(databaseApi.doc(database, "properties", propertyId), property);
    } else {
      property.createdAt = databaseApi.serverTimestamp();
      await databaseApi.setDoc(databaseApi.doc(database, "properties", propertyId), property);
    }
    const removedPaths = originalPaths.filter((path) => !photos.imagePaths.includes(path));
    await Promise.all(removedPaths.map((path) => storageApi.deleteObject(storageApi.ref(storage, path)).catch(() => {})));
    resetEditor();
    setFeedback(propertyFeedback, "Property saved successfully.", "success");
    await refreshInventory();
  } catch (error) {
    console.error("Unable to save property", error);
    setFeedback(propertyFeedback, error.message || "Could not save the property. Check Firebase rules and try again.", "error");
  } finally {
    button.disabled = false;
  }
}

async function removeProperty(property) {
  if (!window.confirm(`Delete “${property.titleEn || property.titleAr}” and its uploaded photos?`)) return;
  inventoryMessage.textContent = "Deleting property...";
  try {
    await databaseApi.deleteDoc(databaseApi.doc(database, "properties", property.id));
    await Promise.all((property.imagePaths || []).map((path) => storageApi.deleteObject(storageApi.ref(storage, path)).catch(() => {})));
    await refreshInventory();
  } catch (error) {
    console.error("Unable to delete property", error);
    inventoryMessage.textContent = "Could not delete the property. Check the Firebase admin UID in your rules.";
  }
}

async function startAdmin() {
  const [appApi, authModule, firestoreModule, storageModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js")
  ]);
  authApi = authModule;
  databaseApi = firestoreModule;
  storageApi = storageModule;
  const app = appApi.initializeApp(window.FIREBASE_CONFIG);
  auth = authApi.getAuth(app);
  database = databaseApi.getFirestore(app);
  storage = storageApi.getStorage(app);

  loginForm.hidden = false;
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector("button[type='submit']");
    button.disabled = true;
    setFeedback(loginFeedback, "Signing in...");
    try {
      const data = new FormData(loginForm);
      await authApi.signInWithEmailAndPassword(auth, String(data.get("email")).trim(), String(data.get("password")));
    } catch (error) {
      console.error("Admin sign-in failed", error);
      setFeedback(loginFeedback, "Sign-in failed. Check the email, password, and Firebase Authentication settings.", "error");
    } finally {
      button.disabled = false;
    }
  });
  document.querySelector("#password-reset").addEventListener("click", async () => {
    const email = document.querySelector("#admin-email");
    if (!email.reportValidity()) return;
    setFeedback(loginFeedback, "If an account exists for that email, Firebase will send a password-reset link.");
    try {
      await authApi.sendPasswordResetEmail(auth, email.value.trim());
    } catch (error) {
      console.error("Unable to request password reset", error);
      setFeedback(loginFeedback, "Could not send a reset email. Check the email address and Firebase Authentication settings.", "error");
    }
  });
  propertyForm.addEventListener("submit", saveProperty);
  document.querySelector("#reset-form").addEventListener("click", resetEditor);
  document.querySelector("#refresh-list").addEventListener("click", refreshInventory);
  photoInput.addEventListener("change", () => {
    const added = [...photoInput.files];
    const invalid = added.find((file) => !file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > maxPhotoBytes);
    if (invalid) {
      photoInput.value = "";
      setFeedback(propertyFeedback, "Choose JPG, PNG, or WebP photos under 8 MB each.", "error");
      return;
    }
    selectedFiles.push(...added);
    photoInput.value = "";
    renderPhotoPreview();
  });
  photoPreview.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-kind]");
    if (!button) return;
    const index = Number(button.dataset.index);
    if (button.dataset.kind === "existing") {
      retainedImages.splice(index, 1);
      retainedPaths.splice(index, 1);
    } else {
      selectedFiles.splice(index, 1);
    }
    renderPhotoPreview();
  });
  inventoryRows.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const property = listings.find((item) => item.id === button.dataset.id);
    if (!property) return;
    if (button.dataset.action === "edit") editProperty(property);
    if (button.dataset.action === "delete") removeProperty(property);
  });
  document.querySelector("#copy-uid").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(auth.currentUser.uid);
      setFeedback(propertyFeedback, "Admin UID copied. Add it to both Firebase rules files.", "success");
    } catch {
      setFeedback(propertyFeedback, `Admin UID: ${auth.currentUser.uid}`);
    }
  });
  signoutButton.addEventListener("click", () => authApi.signOut(auth));

  authApi.onAuthStateChanged(auth, async (user) => {
    loginForm.hidden = Boolean(user);
    dashboard.hidden = !user;
    signoutButton.hidden = !user;
    if (!user) return;
    document.querySelector("#signed-in-email").textContent = user.email || "Authenticated user";
    document.querySelector("#admin-uid").textContent = user.uid;
    document.querySelector("#uid-hint").hidden = false;
    await refreshInventory();
  });
}

const config = window.FIREBASE_CONFIG;
if (!config || !["apiKey", "authDomain", "projectId", "appId", "storageBucket"].every((key) => config[key]?.trim())) {
  configNotice.hidden = false;
} else {
  startAdmin().catch((error) => {
    console.error("Unable to initialize Firebase admin", error);
    configNotice.hidden = false;
    configNotice.querySelector("p").textContent = "Firebase could not initialize. Check your web app config, Authentication, and Storage setup.";
  });
}