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
- **Buy Gems** — from Shop header or Remove Ads page

## Gameplay

- First flap starts the run
- Pass through gaps in pillar pairs to score
- Hit a pillar, the ceiling, or the ground → game over
- Best score is saved in `localStorage` (`skyHopBest`)

## Economy

| Currency | How to earn | Spent on |
|----------|-------------|----------|
| **Coins** | Distance traveled (`1` per 40px) | Common / Rare / Epic skins & maps |
| **Gems** | `1` per **25 pipes** cleared, or Buy Gems packs | Legendary skins & maps only |

Balances show in the **top-right** HUD (coins + gems). Legacy `skyHopStarDust` migrates once into `skyHopGems`.

### Gem packs (simulated GBP)

| Pack | Price |
|------|-------|
| 5 Gems | £0.99 |
| 15 Gems | £1.99 |
| 40 Gems | £4.99 |

### Skin & map rarities

Skins and maps share the same names/tiers (one map themed to each costume). Shop grids group items under **Legendary / Epic / Rare / Common** section headers.

| Rarity | Examples | Price |
|--------|----------|-------|
| **Common** | Coral Hopper (free), Bone Glider (40), Mohawk Riot (55), Hot Sauce (70), Inferno Fiend (85), Frost Shard (95), Chrome Bot (110), Volt Eel (125), Shadow Blade (140) | Coins |
| **Rare** | Neon Pulse (480), Nightfang (620), Pixel Phantom (780), Lava Core (950) | Coins |
| **Epic** | Candy Crash (2200), Ghost Drift (2800), Golden Idol (3600) | Coins |
| **Legendary** | Toxic Slime (25), Void Glitch (35), Cosmic Drift (50), Obsidian King (75) | **Gems only** |

Fairy trails behind the bird scale with rarity. Equipped maps recolor sky, hills, pipes, and ground procedurally.

## Features

- **Skin shop** — ~20 procedural skins with rarity sections, filters, Buy/Equip
- **Map shop** — ~20 themed stages, same rarity/pricing as paired skins
- **Fairy trails** — per-skin particle trails in gameplay + live shop preview
- **Local leaderboards** — Daily / Weekly / Monthly on this device
- **Ads (simulated)** — interstitial every 3 runs (skipped if ads removed)
- **Remove ads** — £1.99 GBP via **No Ads** full-page popup (simulated purchase)
- **Buy Gems** — simulated gem packs for legendary unlocks

## Files

- `index.html` — page shell, dual-currency HUD, shop tabs, gems page, leaderboard, promo, overlays
- `style.css` — responsive layout + rarity section styling
- `game.js` — game loop, physics, skins, maps, trails, persistence
