# Sky Hop — Google Play store assets

Original graphics generated from in-game Coral Hopper palette / bird geometry
(`scripts/store-gen/export.html` + `scripts/generate-store-assets.sh`).
Not Flappy Bird art.

| File | Play use | Size |
|------|----------|------|
| `icon-512.png` | High-res icon | 512×512 |
| `feature-1024x500.png` | Feature graphic | 1024×500 |
| `phone-screenshot-01-ready.png` | Phone screenshot (title / ready) | 1080×1920 |
| `phone-screenshot-02-playing.png` | Phone screenshot (gameplay) | 1080×1920 |
| `phone-screenshot-03-gameover.png` | Phone screenshot (game over + revive) | 1080×1920 |

Regenerate:

```bash
./scripts/generate-store-assets.sh
```

A copy is also kept locally (not in git) under `/home/box/sky-hop-secrets/store-assets/` when that path exists on the agent box.
