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
- **Shop** (top-left) — unlock/equip **skins** and **maps**; live preview with fairy trails
- **Rank** (top-center) — full-page daily/weekly/monthly leaderboards
- **No Ads** (mid-right) — full-page £1.99 remove-ads offer

## Gameplay

- First flap starts the run
- Pass through gaps in pillar pairs to score
- Hit a pillar, the ceiling, or the ground → game over
- Best score is saved in `localStorage` (`skyHopBest`)

## Economy

| Currency | How to earn | Spent on |
|----------|-------------|----------|
| **Coins** | Distance traveled (`1` per 40px) | Common / Rare / Epic skins & maps |
| **Star Dust** | `1` per **8 pipes** cleared in a run | Legendary skins & maps only |

Balances show in the **top-right** HUD (coins + Star Dust).

### Skin & map rarities

Skins and maps share the same names/tiers (one map themed to each costume).

| Rarity | Skins / Maps | Price |
|--------|--------------|-------|
| **Common** (grey) | Coral Hopper (free), Bone Glider (30), Mohawk Riot (35), Hot Sauce (40), Inferno Fiend (45), Frost Shard (45), Chrome Bot (50), Volt Eel (50), Shadow Blade (55) | Coins |
| **Rare** (blue) | Neon Pulse (120), Nightfang (150), Pixel Phantom (160), Lava Core (180) | Coins |
| **Epic** (purple) | Candy Crash (350), Ghost Drift (400), Golden Idol (500) | Coins |
| **Legendary** (gold) | Toxic Slime (12), Void Glitch (15), Cosmic Drift (20), Obsidian King (25) | **Star Dust** |

Fairy trails behind the bird scale with rarity (simple sparkles → rich themed dust). Equipped maps recolor sky, hills, pipes, and ground procedurally.

## Features

- **Skin shop** — ~20 procedural skins with rarity badges, filters, Buy/Equip
- **Map shop** — ~20 themed stages, same rarity/pricing as paired skins
- **Fairy trails** — per-skin particle trails in gameplay + live shop preview
- **Local leaderboards** — Daily / Weekly / Monthly on this device
- **Ads (simulated)** — interstitial every 3 runs (skipped if ads removed)
- **Remove ads** — £1.99 GBP via **No Ads** full-page popup (simulated purchase)

## Files

- `index.html` — page shell, dual-currency HUD, shop tabs, leaderboard, promo, overlays
- `style.css` — responsive layout + rarity badge styling
- `game.js` — game loop, physics, skins, maps, trails, persistence
