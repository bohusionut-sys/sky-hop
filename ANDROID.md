# Sky Hop — Android (Capacitor)

Android-first Play Store path for the static web game. The playable web assets live at the repo root (GitHub Pages). Capacitor loads a copy from `www/`.

## Prerequisites (on your machine)

- **Node.js 20+** and npm
- **JDK 21** (Temurin or Android Studio bundled JDK)
- **Android Studio** (Ladybug or newer) with Android SDK + platform tools
- Accept Android SDK licenses in Android Studio SDK Manager

Mobile Ads + Play Billing plugins are installed. App ID `ca-app-pub-1834002965799249~7940720644`, interstitial `ca-app-pub-1834002965799249/1207791334`, rewarded `ca-app-pub-1834002965799249/4057315950` are in `ad-config.js` (App ID also in AndroidManifest). `USE_REAL_ADS: true` — native uses the SDK; web keeps simulated overlay. Rewarded grants only after the reward callback.

## One-time setup

```bash
cd sky-hop
npm install
npm run build:web
npx cap add android    # creates android/ — skip if already present
npx cap sync
```

Or: `npm run cap:add:android` then `npm run cap:sync`.

## Open in Android Studio

```bash
npm run cap:open
# same as: npx cap open android
```

Or: **File → Open** → select the `android/` folder.

Then:

1. Wait for Gradle sync
2. Pick an emulator or USB device (USB debugging on)
3. Run **app**

## Day-to-day after web changes

```bash
npm run cap:sync
```

This copies `index.html`, `game.js`, `style.css` → `www/` and runs `cap sync`.

## Play Console (high level)

1. Create app in [Google Play Console](https://play.google.com/console) — package **`com.skyhop.game`**
2. In Android Studio: **Build → Generate Signed App Bundle / APK** → Android App Bundle (`.aab`)
3. Create an upload keystore (keep it safe; do not commit `*.jks` / `*.keystore`)
4. Complete store listing, content rating, Privacy Policy URL, target audience
5. Upload AAB to internal testing → closed → production

## Config

| Key | Value |
|-----|--------|
| appId | `com.skyhop.game` |
| appName | Sky Hop |
| webDir | `www` |
| Config file | `capacitor.config.json` |

## Privacy + store listing

- Privacy URL: https://bohusionut-sys.github.io/sky-hop/privacy.html (`privacy.html`)
- Store copy: [STORE_LISTING.md](./STORE_LISTING.md)

## Mobile Ads details

| Item | Value |
|------|-------|
| App ID | `ca-app-pub-1834002965799249~7940720644` |
| Interstitial | `ca-app-pub-1834002965799249/1207791334` |
| Rewarded | `ca-app-pub-1834002965799249/4057315950` |

Plugin: `@capacitor-community/admob@7`. Guides: https://developers.google.com/admob/android/quick-start · interstitial · rewarded-fullscreen-ads.

**Policy:** do not click your own ads; no accidental-click placements; interstitials at natural breaks; rewarded unlock only after earned reward; https://support.google.com/admob/answer/6128543

## Play Billing stubs

Product IDs: `skyhop_remove_ads`, `skyhop_stardust_5/_15/_40/_80/_150/_300` via `billing.js` + `@capgo/native-purchases@7` (simulated on web).

## Remaining checklist

1. Payments approved → create Play app `com.skyhop.game`
2. Privacy URL + STORE_LISTING + rating + Data safety + ads declaration
3. Create IAP products
4. Signed AAB → internal testing (interstitial, rewarded, billing)
5. Closed testing / 12 testers if still required → production

