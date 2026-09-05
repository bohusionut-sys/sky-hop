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
- **Shop** (top-left) — unlock/equip **skins**, **maps**, **light trails**, and **music**; live preview; **Stardust** tab for currency packs
- **Music HUD** (under Shop) — mute toggle + volume slider (saved in `localStorage`)
- **Rank** (top-center) — full-page daily/weekly/monthly leaderboards
- **Challenges** (under Rank) — daily + lifetime goals with coin/Stardust rewards
- **No Ads** (mid-right) — full-page £1.99 remove-ads offer

## Gameplay

- First flap starts the run
- Pass through gaps in pillar pairs to score
- Hit a pillar, the ceiling, or the ground → game over
- Best score is saved in `localStorage` (`skyHopBest`)

## Economy

| Currency | How to earn | Spent on |
|----------|-------------|----------|
| **Coins** | Distance traveled (`1` per 40px) | Common / Rare / Epic skins, maps, trails & music |
| **Stardust** | `1` per **25 pipes** cleared, or Shop → Stardust packs | Legendary skins, maps, trails & music only |

Balances show in the **top-right** HUD (coins + stardust). Canonical key is `skyHopStarDust`; legacy `skyHopGems` migrates once (max) then is removed.

**Challenges** add a paced free Stardust trickle (mostly coin rewards; rare 1–2 Stardust claims). Combined with pipe earn (~1 / 25 pipes), engaged free play targets ≈ **~6 Stardust/day** — roughly one cheapest legendary every ~4 days. Packs stay the fast path.

### Stardust packs (simulated GBP)

Buy from **Shop → Stardust** tab:

| Pack | Price |
|------|-------|
| 5 Stardust | £0.99 |
| 15 Stardust | £1.99 |
| 40 Stardust | £4.99 |

### Skin, map, trail & music rarities

Skins, maps, trails, and music share the same names/tiers (one map, one light trail, and one procedural track themed to each costume). Shop grids group items under **Legendary / Epic / Rare / Common** section headers.

| Rarity | Examples | Price |
|--------|----------|-------|
| **Common** | Coral Hopper (free), Bone Glider (40), Mohawk Riot (55), Hot Sauce (70), Inferno Fiend (85), Frost Shard (95), Chrome Bot (110), Volt Eel (125), Shadow Blade (140) | Coins |
| **Rare** | Neon Pulse (480), Nightfang (620), Pixel Phantom (780), Lava Core (950) | Coins |
| **Epic** | Candy Crash (2200), Ghost Drift (2800), Golden Idol (3600) | Coins |
| **Legendary** | Toxic Slime (25), Void Glitch (35), Cosmic Drift (50), Obsidian King (75) | **Stardust only** |

**Light trails** are a smooth glowing ribbon behind the bird (motion-blur streak). Quality scales with rarity (common = soft streak → legendary = richer multi-layer glow). Trails equip independently of skins (`skyHopOwnedTrails` / `skyHopEquippedTrail`); default Coral trail is free and equipped. Equipped maps recolor sky, hills, pipes, and ground procedurally.

**Music** uses short Web Audio API procedural loops (no audio files) — one vibe per skin (neon synth, void glitch, candy playful, etc.). Buy/equip independently (`skyHopOwnedMusic` / `skyHopEquippedMusic`); default Coral is free and equipped. Equipped track plays as BGM on ready/play/over; shop Music tab previews the selected card. Mute + volume persist via `skyHopMusicMuted` / `skyHopMusicVolume`.

## Features

- **Skin shop** — ~20 procedural skins with rarity sections, Buy/Equip
- **Map shop** — ~20 themed stages, same rarity/pricing as paired skins
- **Trail shop** — ~20 light trails (one per design), same rarity/pricing; live preview
- **Music shop** — ~20 procedural Web Audio tracks (one per skin); preview, Buy/Equip, BGM
- **Stardust shop tab** — simulated currency packs for legendary unlocks
- **Light trails** — rarity-scaled glowing ribbons in gameplay + shop preview
- **Music HUD** — mute + volume on main frame (does not block play)
- **Local leaderboards** — Daily / Weekly / Monthly on this device
- **Challenges** — Daily (UTC) + Lifetime goals; claim coins / small Stardust; paced so free play ≈ 1 cheap legendary / ~4 days
- **Ads (simulated)** — interstitial every 3 runs (skipped if ads removed)
- **Remove ads** — £1.99 GBP via **No Ads** full-page popup (simulated purchase)

## Files

- `index.html` — page shell, dual-currency HUD, shop tabs (Skins | Maps | Trails | Stardust), leaderboard, challenges, promo, overlays
- `style.css` — responsive layout + rarity section styling
- `game.js` — game loop, physics, skins, maps, light trails, challenges, persistence
