# Sky Hop — Play Ship Checklist

**Package:** `com.skyhop.game`  
**Privacy (live):** https://bohusionut-sys.github.io/sky-hop/privacy.html ✅ verified 2026-09-23  
**Store copy:** [STORE_LISTING.md](./STORE_LISTING.md)  
**Android notes:** [ANDROID.md](./ANDROID.md)

Ruthless split: **DONE in repo + on agent box (JDK/SDK/AAB)** vs **ONLY Play Console / Google login gates**.

---

## DONE (repo / agent — do not re-do)

| Item | Status |
|------|--------|
| Capacitor Android project `android/` with `applicationId` / namespace `com.skyhop.game` | ✅ |
| App name strings = Sky Hop | ✅ |
| `capacitor.config.json` appId `com.skyhop.game`, webDir `www` | ✅ |
| Plugins: `@capacitor-community/admob@7`, `@capgo/native-purchases@7`, `@capacitor/app@7` | ✅ |
| AdMob App ID in `AndroidManifest` meta-data `APPLICATION_ID` | ✅ `ca-app-pub-1834002965799249~7940720644` |
| Ad unit IDs in `ad-config.js` with `USE_REAL_ADS: true` | ✅ interstitial + rewarded |
| `game.js` native AdMob interstitial + rewarded (grant only after reward) | ✅ |
| `billing.js` product IDs + native purchase/restore facade | ✅ |
| IAP product IDs wired in game (remove-ads + 6 Stardust packs) | ✅ |
| GBP prices in UI match intended Console prices (see IAP table) | ✅ |
| Permissions: `INTERNET`, `AD_ID`, `BILLING` in app manifest | ✅ |
| Privacy policy HTML + GitHub Pages URL | ✅ live |
| `STORE_LISTING.md` short/full description drafts | ✅ |
| Play store graphics (original Coral Hopper art) | ✅ see **Store graphics** below |
| `npm install` / `npm run build:web` / `npx cap sync` | ✅ verified on agent box 2026-09-23 |
| Release signing hooks in `android/app/build.gradle` via `keystore.properties` | ✅ wired; box has gitignored `keystore.properties` |
| Signed `app-release.aab` on agent box | ✅ ~6.7MB; jarsigner verified 2026-09-23 |
| Windows scripts: `scripts/create-release-keystore.ps1`, `scripts/assemble-release-aab.ps1` | ✅ |
| Linux/macOS: `scripts/assemble-release-aab.sh`, portable `scripts/setup-capacitor.sh` | ✅ |
| `.gitignore` blocks `*.keystore`, `*.jks`, `android/keystore.properties` | ✅ |

### Box build status (agent Linux box — verified 2026-09-23)

| Item | Status |
|------|--------|
| **JDK 21** | ✅ present (`openjdk 21` / `java` + `keytool`) |
| **Android SDK** | ✅ `ANDROID_HOME=/home/box/android-sdk` (build-tools, platforms, cmdline-tools) |
| **Release keystore** | ✅ local only at `/home/box/sky-hop-secrets/skyhop-release.keystore` (gitignored; never commit) |
| **`android/keystore.properties`** | ✅ present on box, gitignored |
| **Signed release AAB** | ✅ `android/app/build/outputs/bundle/release/app-release.aab` (~6.7MB); jarsigner: **jar verified** (self-signed upload key expected). Mirror: `/home/box/sky-hop-secrets/app-release.aab` |
| **`npx cap sync android`** | ✅ re-confirmed 2026-09-23 |
| **Windows machine `AlexBohus`** | ⚪ optional / currently offline — not required while box can build & sign |

**Secrets location (local only, not in GitHub):** `/home/box/sky-hop-secrets/SECRETS.md`  
**Never commit** keystore, `keystore.properties`, passwords, or AAB binaries.

**Rebuild on this box (if AAB missing):**
```bash
npm install && npm run build:web && npx cap sync android
./scripts/assemble-release-aab.sh
```

---

## ONLY YOU — optional Windows rebuild

Windows machine is **optional** now that the agent box has JDK + SDK + a signed AAB. Use only if you prefer building on Windows:

1. Install **Android Studio** (Ladybug+) + **JDK 21** + accept SDK licenses (if not already).
2. Clone/pull `main`, open PowerShell in repo root:
   ```powershell
   npm install
   npm run cap:sync
   .\scripts\create-release-keystore.ps1   # only if you need a *new* keystore — prefer the existing box keystore backup
   # back up keystore + passwords offline / into password manager
   .\scripts\assemble-release-aab.ps1
   ```
3. Confirm AAB at `android\app\build\outputs\bundle\release\app-release.aab`.
4. Upload store graphics from `store-assets/` (already generated — see **Store graphics** below). Optional: re-capture live device screenshots later.

---

## ONLY PLAY CONSOLE — create app & policy forms

### 1. Create the app (if missing)

- Play Console → **Create app**
- App name: **Sky Hop**
- Default language: English (UK) recommended
- App or game: **Game**
- Free/paid: **Free**
- Declarations: accept Play policies / US export / etc. as prompted
- Package name when uploading first AAB must be **`com.skyhop.game`** (already baked into the project)

### 2. Store listing (paste from STORE_LISTING.md)

- Short description (≤80): use the draft in STORE_LISTING.md
- Full description: paste from STORE_LISTING.md
- App icon 512×512, feature graphic 1024×500, phone screenshots (portrait) — files in `store-assets/`
- Category: **Games → Arcade** (alt Casual)
- Contact email: your publisher email
- **Privacy policy URL:** `https://bohusionut-sys.github.io/sky-hop/privacy.html`

### 3. App content → Ads

- **Contains ads:** **Yes**
- AdMob is the ad SDK

### 4. Data safety — answers ready to paste

Sky Hop does **not** collect account PII itself. Ads/billing partners may process device identifiers. Fill Play’s questionnaire aligned with this:

| Question area | Answer to use |
|---------------|---------------|
| Does your app collect or share any of the required user data types? | **Yes** (because AdMob / Play Billing involve device & purchase data shared with Google) |
| Is all user data collected encrypted in transit? | **Yes** (HTTPS / Google SDKs) |
| Do you provide a way for users to request deletion? | **Yes** — uninstall / clear app storage deletes local saves; ad/purchase data follows Google’s controls (state this in the form notes / privacy policy already covers it) |
| Data collected / shared — **Device or other IDs** (Advertising ID) | Collected & shared: **Yes** · Purpose: Advertising / analytics / fraud prevention · Collected by AdMob · Ephemeral/not linked to Sky Hop identity (no account) |
| **Purchase history** | Collected/processed via Google Play Billing for IAP fulfilment · Purpose: App functionality · Handled by Google Play |
| **Approximate location** | May be used by AdMob for ads (declare if questionnaire asks about approximate location via ads SDK) |
| **Personal info** (name, email, phone) | **Not collected** by Sky Hop |
| **Photos / contacts / files** | **Not collected** |
| Data sold | **No** |
| Kids / COPPA | Not primarily directed at children; see content rating. Do **not** claim Designed for Families unless you enroll and meet those rules. |

Privacy policy URL again: `https://bohusionut-sys.github.io/sky-hop/privacy.html`

### 5. Content rating (IARC questionnaire) — suggested answers

Game type: **Other / Casual / Arcade endless flyer** (pick closest: “Action” or “Casual” if listed — Sky Hop is mild obstacle hopping).

| Topic | Suggested answer |
|-------|------------------|
| Violence | Cartoon / fantasy violence only — bird hits pillars. **No** realistic violence, blood, gore |
| Sexual content | **None** |
| Language | **None** |
| Controlled substances | **None** |
| Gambling / simulated gambling | **None** (IAPs are cosmetics / remove-ads / currency packs — **not** gambling) |
| User interaction / UGC / chat | **No** social features, **no** user-generated content shared online; optional local display name for on-device ranks only |
| Shares location | **No** (app does not request GPS); ads may use approximate location via Google |
| Online content / unrestricted internet | WebView game assets local; ads load from network — answer honestly per form wording (typically “users can interact with online ads”) |
| Age target | Everyone / PEGI 3 style casual — let IARC compute from answers |

Expected rough outcome: **Everyone** / **PEGI 3** / similar — confirm after questionnaire.

### 6. Target audience & content

- Target age group: include **18+** only if you want max ad fill without child-directed flags; for a casual flyer, selecting **13+** or **everyone including older teens** is common. **Do not** select “Designed for children” if you use personalized AdMob + IAPs as currently configured (`taggingForChildDirectedTreatment: false` in game.js).
- News app / COVID / etc.: **No**

### 7. News / COVID / Data protection / Government apps

- All **No** / not applicable unless a form forces otherwise.

### 8. In-app products — create exactly these (GBP)

Play Console → Monetize → Products → In-app products.  
All **one-time** (managed / in-app). Status **Active**.

| Product ID (exact) | Name | Description | Type | Price (GBP) |
|--------------------|------|-------------|------|-------------|
| `skyhop_remove_ads` | Remove ads | Permanently remove interstitial & rewarded ads from Sky Hop | Non-consumable (unmanaged one-time; do **not** consume) | **£1.99** |
| `skyhop_stardust_5` | 5 Stardust | Adds 5 Stardust | Consumable | **£0.99** |
| `skyhop_stardust_15` | 15 Stardust | Adds 15 Stardust | Consumable | **£1.99** |
| `skyhop_stardust_40` | 40 Stardust | Adds 40 Stardust | Consumable | **£4.99** |
| `skyhop_stardust_80` | 80 Stardust | Adds 80 Stardust | Consumable | **£8.99** |
| `skyhop_stardust_150` | 150 Stardust | Adds 150 Stardust | Consumable | **£14.99** |
| `skyhop_stardust_300` | 300 Stardust | Adds 300 Stardust | Consumable | **£24.99** |

Must match `billing.js` + `game.js` (`STARDUST_PACKS` / `REMOVE_ADS_PRODUCT_ID`).  
License testers: add your Google accounts under Setup → License testing.

### 9. AdMob ↔ Play linking

- In AdMob: ensure app is linked to the Play Store listing once published / available.
- Do **not** click your own ads. Use test devices / demo units only for click testing.

### 10. Release tracks

1. Upload **signed** `app-release.aab`
2. **Internal testing** first — verify interstitial, rewarded grant, remove-ads restore, one Stardust pack
3. Closed testing if still required for your account (historically 12 testers / 14 days — check current Play policy for your account)
4. Production rollout

### 11. Countries, pricing, declarations

- Distribute countries: as desired (UK/EU at least)
- Free app with IAPs
- Complete Financial features / Payments profile if prompted

---


---

## Store graphics (ready to upload)

Original art only — exported from Sky Hop’s Coral Hopper bird / coral map palette via `scripts/store-gen/export.html` (regenerate with `./scripts/generate-store-assets.sh`).

**In repo (commit these):**

| Play field | Path |
|------------|------|
| High-res icon 512×512 | [`store-assets/icon-512.png`](./store-assets/icon-512.png) |
| Feature graphic 1024×500 | [`store-assets/feature-1024x500.png`](./store-assets/feature-1024x500.png) |
| Phone screenshot 1 (ready) | [`store-assets/phone-screenshot-01-ready.png`](./store-assets/phone-screenshot-01-ready.png) |
| Phone screenshot 2 (playing) | [`store-assets/phone-screenshot-02-playing.png`](./store-assets/phone-screenshot-02-playing.png) |
| Phone screenshot 3 (game over) | [`store-assets/phone-screenshot-03-gameover.png`](./store-assets/phone-screenshot-03-gameover.png) |

**Local mirror (not in git):** `/home/box/sky-hop-secrets/store-assets/` (same PNGs for Console upload from the agent box).

Also documented in [`store-assets/README.md`](./store-assets/README.md).

## Quick verify matrix (after first internal build)

| Check | Pass? |
|-------|-------|
| Package `com.skyhop.game` | |
| Ads show on device (not placeholdery) | |
| Rewarded: no reward if user closes early | |
| Remove ads IAP → ads stop; restore works | |
| Stardust pack credits correct amount | |
| Privacy URL opens from store listing | |
| Data safety / rating / ads declaration submitted | |

---

## Command cheat sheet

```powershell
# Windows (repo root)
npm install
npm run cap:sync
.\scripts\create-release-keystore.ps1
.\scripts\assemble-release-aab.ps1
```

```bash
# Linux/macOS (after JDK + SDK + keystore.properties exist)
npm install && npm run cap:sync
./scripts/assemble-release-aab.sh
```

---

*Updated 2026-09-23: box JDK/SDK/signed AAB are DONE. Remaining gates are Play Console session (login/2FA/create app / App content / Data safety / IAPs / AAB upload).*
