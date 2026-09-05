# Sky Hop

A lightweight endless flyer — tap to hop through scrolling pillars. Original visuals and title; classic gravity/flap feel.

## How to run

Open `index.html` in any modern browser (double-click or drag into a tab).

Or serve the folder locally:

```bash
cd /workspace/sky-hop
python3 -m http.server 8080
# then visit http://localhost:8080
```

No build step, no dependencies, no CDN assets.

## Controls

- **Click / tap** — flap (or restart after game over)
- **Space** or **↑** — flap
- **Shop** (top-left) — unlock and equip character skins with coins

## Gameplay

- First flap starts the run
- Pass through gaps in pillar pairs to score
- Hit a pillar, the ceiling, or the ground → game over
- Best score is saved in `localStorage` (`skyHopBest`)

## Features

- **Coins** — earned from distance traveled each run (`skyHopCoins`); live balance sits in the **top-right** HUD on ready, playing, and game over
- **Skin shop** — ~20 procedural canvas skins; buy with coins, equip one at a time (`skyHopOwnedSkins`, `skyHopEquippedSkin`)
- **Local leaderboards** — Daily / Weekly / Monthly tabs on this device; period keys roll over in UTC and reseed NPC scores so boards stay fresh
- **Ads (simulated)** — after every 3 completed runs, a short interstitial must be watched before the next play (skipped if ads removed)
- **Remove ads** — £1.99 GBP promo on the **main/ready** screen and **game over** (side panel + banner; thank-you state if already purchased)

## Files

- `index.html` — page shell, coin HUD, shop, leaderboard, promo, overlays
- `style.css` — responsive layout (game + side promo + shop grid)
- `game.js` — game loop, physics, skins, drawing, persistence
