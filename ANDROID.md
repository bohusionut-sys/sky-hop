# Sky Hop — Android (Capacitor)

Android-first Play Store path for the static web game. The playable web assets live at the repo root (GitHub Pages). Capacitor loads a copy from `www/`.

## Prerequisites (on your machine)

- **Node.js 20+** and npm
- **JDK 21** (Temurin or Android Studio bundled JDK)
- **Android Studio** (Ladybug or newer) with Android SDK + platform tools
- Accept Android SDK licenses in Android Studio SDK Manager

AdMob app/ad unit IDs and Play Billing are **not** wired yet — simulated ads (`showAdThen` in `game.js`) remain. Add AdMob Capacitor plugin later when you have IDs.

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

## Coming next

- **AdMob** — replace simulated `showAdThen` with real rewarded/interstitial units (IDs not required for this wrap)
- **Play Billing** — Stardust packs + No Ads (£1.99)
- App icon / splash via Capacitor assets or Android Studio mipmaps
- Privacy policy + Data safety form before production

## If `cap add android` fails on a machine without SDK

Keep `package.json`, `capacitor.config.json`, `www/` via `npm run build:web`, and this doc. On a machine with Android Studio:

```bash
npm install
npm run build:web
npx cap add android
npx cap sync
npx cap open android
```
