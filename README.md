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
- **Shop** (top-left) — unlock/equip **skins** and **maps**; live preview with fairy trails; **Stardust** tab for currency packs
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
| **Stardust** | `1` per **25 pipes** cleared, or Shop → Stardust packs | Legendary skins & maps only |

Balances show in the **top-right** HUD (coins + stardust). Canonical key is `skyHopStarDust`; legacy `skyHopGems` migrates once (max) then is removed.

### Stardust packs (simulated GBP)

Buy from **Shop → Stardust** tab:

| Pack | Price |
|------|-------|
| 5 Stardust | £0.99 |
| 15 Stardust | £1.99 |
| 40 Stardust | £4.99 |

### Skin & map rarities

Skins and maps share the same names/tiers (one map themed to each costume). Shop grids group items under **Legendary / Epic / Rare / Common** section headers.

| Rarity | Examples | Price |
|--------|----------|-------|
| **Common** | Coral Hopper (free), Bone Glider (40), Mohawk Riot (55), Hot Sauce (70), Inferno Fiend (85), Frost Shard (95), Chrome Bot (110), Volt Eel (125), Shadow Blade (140) | Coins |
| **Rare** | Neon Pulse (480), Nightfang (620), Pixel Phantom (780), Lava Core (950) | Coins |
| **Epic** | Candy Crash (2200), Ghost Drift (2800), Golden Idol (3600) | Coins |
| **Legendary** | Toxic Slime (25), Void Glitch (35), Cosmic Drift (50), Obsidian King (75) | **Stardust only** |

Fairy trails behind the bird scale with rarity. Equipped maps recolor sky, hills, pipes, and ground procedurally.

## Features

- **Skin shop** — ~20 procedural skins with rarity sections, filters, Buy/Equip
- **Map shop** — ~20 themed stages, same rarity/pricing as paired skins
- **Stardust shop tab** — simulated currency packs for legendary unlocks
- **Fairy trails** — per-skin particle trails in gameplay + live shop preview
- **Local leaderboards** — Daily / Weekly / Monthly on this device
- **Ads (simulated)** — interstitial every 3 runs (skipped if ads removed)
- **Remove ads** — £1.99 GBP via **No Ads** full-page popup (simulated purchase)

## Files

- `index.html` — page shell, dual-currency HUD, shop tabs (Skins | Maps | Stardust), leaderboard, promo, overlays
- `style.css` — responsive layout + rarity section styling
- `game.js` — game loop, physics, skins, maps, trails, persistence
