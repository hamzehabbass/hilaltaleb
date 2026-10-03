# Samir Taleb Real Estate

Bilingual Arabic/English real-estate website for Al-Danniyeh, Lebanon. Static HTML/CSS/JavaScript is hosted with Firebase Hosting. Available property listings and customer inquiries use Cloud Firestore.

## Pages

- Home: `/` and `/en.html`
- Property search: `/properties.html` and `/en-properties.html`
- Buyer guide: `/buy.html` and `/en-buy.html`
- Seller guide: `/sell.html` and `/en-sell.html`
- About and contact details: `/about.html` and `/en-about.html`
- Private property desk: `/admin.html`

Public sections ease in from alternating directions as you scroll; the motion respects reduced-motion settings. Buyer/seller guides include checklists and expandable FAQs.

## Run locally

Python 3 is enough for a local preview:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000>. `firebase-config.js` is configured for project `samirtalebrealestate-97131`; the live property query currently returns no available listings. Add the first verified listing through `/admin.html` after enabling an admin account and allowlisting its UID.

## Firebase setup

The Firebase web-app config and Analytics measurement ID are already in `firebase-config.js`. Web config is public by design; never put service-account credentials in the website.

### Admin access

1. In Firebase Authentication, enable the Email/Password provider and create the admin account yourself. The website does not provide public account creation.
2. Open `/admin.html`, sign in, and copy the displayed Admin UID.
3. The UID `HQUMsz71BPVYdFbbeMZCWarPH8v2` is allowlisted in both rules files. Confirm it belongs to the intended admin account, then deploy the rules. If you use another admin account later, replace the UID in both files first.
4. If you forget the password, enter the admin email on `/admin.html` and choose **Forgot password?**. Firebase sends a reset link to that account's email.
5. Sign in. The property desk can add, edit, publish, unpublish, and delete listings, and upload JPG, PNG, or WebP photos up to 8 MB each.

Firestore rules permit public reads only for properties with `status: "available"`; listing writes and admin inventory reads require the allowlisted authenticated UID. Inquiry creation is validated, while inquiry records remain private. Storage images are publicly readable for published listings, but uploads and deletion require the same UID. Never replace these rules with public writes.

### Deploy

1. Confirm Cloud Firestore is enabled for the configured project.
2. Enable Firebase App Check and register the production domain before launch.
3. Enable Cloud Storage. Photo uploads may require a billing-enabled Firebase plan.
4. Push this project to a GitHub repository whose deployment branch is `main`.
5. In GitHub, open **Settings → Secrets and variables → Actions** and add a repository secret named `FIREBASE_SERVICE_ACCOUNT` containing the service-account JSON. Create a dedicated service account with permission to deploy Firebase Hosting, Firestore Rules, and Storage Rules. Never commit the JSON key or paste it into chat.
6. Push to `main` or run **Actions → Deploy to Firebase → Run workflow**. The workflow in `.github/workflows/firebase-deploy.yml` deploys Hosting and both rule sets to `samirtalebrealestate-97131`.

For a local manual deploy instead, authenticate the Firebase CLI with your own Google account and run `firebase deploy --project samirtalebrealestate-97131 --only hosting,firestore:rules,storage`.

### Property documents

Add documents to the `properties` collection. Example shape:

```json
{
	"status": "available",
	"type": "land",
	"titleAr": "عنوان العقار",
	"titleEn": "Property title",
	"descriptionAr": "وصف مؤكد للعقار",
	"descriptionEn": "Verified property description",
	"locationKey": "mrah-el-sreij",
	"locationAr": "مراح السريج",
	"locationEn": "Mrah El Sreij",
	"areaSqm": 1000,
	"price": 0,
	"showPrice": true,
	"currency": "USD",
	"images": ["https://your-public-image-url.example/photo.jpg"],
	"updatedAt": "Firestore timestamp"
}
```

Use the actual price, or `0` for “Price on request”. Set `showPrice` to `false` to hide the amount on the public card; the card then asks about price through its property-specific WhatsApp link. Supported `type` values: `land`, `house`, `apartment`, `commercial`, `other`. Store public HTTPS image URLs in `images` for swipeable galleries; galleries with multiple photos auto-advance and pause during visitor interaction or reduced-motion preference. The contact form opens a prefilled WhatsApp message for the visitor to send, with a Firestore inquiry backup when connected. Public clients cannot read or edit inquiry records.

## Before launch

- The Arabic and English homepages embed the publicly accessible 23-second Facebook reel in an iframe. Other Facebook posts and listing photos remain unverified; add verified listings and owner-approved photos to Firestore.
- The folder did not include a website domain. Once selected, set absolute canonical/alternate URLs and JSON-LD URLs, add a domain-specific `sitemap.xml`, then submit it to Google Search Console and Bing Webmaster Tools.
- The hero uses a remote architectural photo for atmosphere, not as a property listing. Replace it with owner-approved local photography before publishing.
- Confirm the phone numbers, email, and office address with the owner before launch.
