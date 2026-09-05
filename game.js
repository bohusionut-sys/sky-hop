(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // --- Tunables (classic Flappy-like feel) ---
  const GRAVITY = 0.42;
  const FLAP = -7.2;
  const MAX_FALL = 10;
  const PIPE_SPEED_BASE = 2.4;
  const PIPE_WIDTH = 56;
  const PIPE_GAP_BASE = 128;
  const PIPE_SPACING = 190;
  const GROUND_H = 96;
  const BIRD_X = 88;
  const BIRD_R = 14;

  // Storage keys
  const BEST_KEY = "skyHopBest";
  const COINS_KEY = "skyHopCoins";
  const RUNS_KEY = "skyHopRunsSinceAd";
  const ADS_REMOVED_KEY = "skyHopAdsRemoved";
  const NAME_KEY = "skyHopPlayerName";
  const LB_PREFIX = "skyHopLB_";
  const OWNED_SKINS_KEY = "skyHopOwnedSkins";
  const EQUIPPED_SKIN_KEY = "skyHopEquippedSkin";
  const STARDUST_KEY = "skyHopStarDust";
  const STARDUST_KEY_LEGACY_GEMS = "skyHopGems";
  const OWNED_MAPS_KEY = "skyHopOwnedMaps";
  const EQUIPPED_MAP_KEY = "skyHopEquippedMap";
  const OWNED_TRAILS_KEY = "skyHopOwnedTrails";
  const EQUIPPED_TRAIL_KEY = "skyHopEquippedTrail";
  const OWNED_MUSIC_KEY = "skyHopOwnedMusic";
  const EQUIPPED_MUSIC_KEY = "skyHopEquippedMusic";
  const MUSIC_MUTE_KEY = "skyHopMusicMuted";
  const MUSIC_VOLUME_KEY = "skyHopMusicVolume";
  const MUSIC_ENABLED_KEY = "skyHopMusicEnabled";
  const VIBRATION_KEY = "skyHopVibration";
  const SFX_KEY = "skyHopSfx";
  const CHALLENGES_KEY = "skyHopChallenges";

  // Coins: 1 coin per this many pixels of horizontal travel
  const PIXELS_PER_COIN = 40;
  // Stardust: 1 per this many pipes cleared in a run (slow free earn)
  const PIPES_PER_STARDUST = 25;
  const AD_EVERY_N_RUNS = 3;
  const AD_COUNTDOWN_SEC = 5;
  const LB_MAX = 8;
  const SPECIAL_CURRENCY_NAME = "Stardust";
  const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const RARITY_SECTIONS = ["legendary", "epic", "rare", "common"];

  // Simulated Stardust packs (GBP)
  const STARDUST_PACKS = [
    { id: "pack5", amount: 5, priceGbp: "0.99", label: "5 Stardust" },
    { id: "pack15", amount: 15, priceGbp: "1.99", label: "15 Stardust" },
    { id: "pack40", amount: 40, priceGbp: "4.99", label: "40 Stardust" },
    { id: "pack80", amount: 80, priceGbp: "8.99", label: "80 Stardust" },
    { id: "pack150", amount: 150, priceGbp: "14.99", label: "150 Stardust" },
    { id: "pack300", amount: 300, priceGbp: "24.99", label: "300 Stardust" },
  ];

  /*
   * Free Stardust budget (engaged player, challenges + pipe earn):
   *   Target ≈ ~6 Stardust / day average → ~1 cheapest legendary (~25) every ~4 days.
   *   Pipes: 1 / 25 cleared (~3–5/day if playing regularly).
   *   Dailies: mostly coins; at most one hard daily may grant 1 Stardust (~0–1/day).
   *   Lifetime: sparse 1–2 Stardust milestones that stretch past week one.
   *   Paid packs remain the fast path for legendaries.
   */
  const DAILY_CHALLENGE_COUNT = 4;
  const DAILY_CHALLENGE_POOL = [
    {
      id: "d_score_8",
      kind: "daily",
      type: "score_run",
      title: "Sky Starter",
      description: "Score at least 8 in a single run",
      target: 8,
      reward: { coins: 45 },
    },
    {
      id: "d_score_15",
      kind: "daily",
      type: "score_run",
      title: "Clean Passes",
      description: "Score at least 15 in a single run",
      target: 15,
      reward: { coins: 80 },
    },
    {
      id: "d_pipes_run_12",
      kind: "daily",
      type: "pipes_run",
      title: "Pipe Rush",
      description: "Clear 12 pipes in one run",
      target: 12,
      reward: { coins: 55 },
    },
    {
      id: "d_coins_run_20",
      kind: "daily",
      type: "coins_run",
      title: "Coin Hop",
      description: "Earn 20 coins in a single run",
      target: 20,
      reward: { coins: 40 },
    },
    {
      id: "d_distance_run_1600",
      kind: "daily",
      type: "distance_run",
      title: "Long Glide",
      description: "Travel 1,600 distance in one run",
      target: 1600,
      reward: { coins: 50 },
    },
    {
      id: "d_runs_4",
      kind: "daily",
      type: "runs_day",
      title: "Keep Hopping",
      description: "Complete 4 runs today",
      target: 4,
      reward: { coins: 60 },
    },
    {
      id: "d_pipes_day_25",
      kind: "daily",
      type: "pipes_day",
      title: "Daily Clearance",
      description: "Clear 25 pipes in total today",
      target: 25,
      reward: { coins: 70 },
    },
    {
      id: "d_coins_day_40",
      kind: "daily",
      type: "coins_day",
      title: "Pocket Change",
      description: "Earn 40 coins from runs today",
      target: 40,
      reward: { coins: 35 },
    },
    {
      // Harder daily — only SD daily in the pool (≈0–1 free SD from dailies)
      id: "d_score_22",
      kind: "daily",
      type: "score_run",
      title: "Star Flight",
      description: "Score at least 22 in a single run",
      target: 22,
      reward: { coins: 40, stardust: 1 },
    },
  ];

  const LIFETIME_CHALLENGES = [
    {
      id: "l_runs_15",
      kind: "lifetime",
      type: "runs_total",
      title: "Warm-up Wings",
      description: "Complete 15 runs",
      target: 15,
      reward: { coins: 100 },
    },
    {
      id: "l_pipes_80",
      kind: "lifetime",
      type: "pipes_total",
      title: "Pipe Apprentice",
      description: "Clear 80 pipes in total",
      target: 80,
      reward: { coins: 120 },
    },
    {
      id: "l_coins_200",
      kind: "lifetime",
      type: "coins_total",
      title: "Coin Collector",
      description: "Earn 200 coins from runs (lifetime)",
      target: 200,
      reward: { coins: 80 },
    },
    {
      id: "l_score_20",
      kind: "lifetime",
      type: "score_run",
      title: "High Flyer",
      description: "Score at least 20 in a single run",
      target: 20,
      reward: { coins: 150 },
    },
    {
      id: "l_runs_50",
      kind: "lifetime",
      type: "runs_total",
      title: "Dedicated Hopper",
      description: "Complete 50 runs",
      target: 50,
      reward: { coins: 200, stardust: 1 },
    },
    {
      id: "l_pipes_400",
      kind: "lifetime",
      type: "pipes_total",
      title: "Pillar Veteran",
      description: "Clear 400 pipes in total",
      target: 400,
      reward: { coins: 180, stardust: 1 },
    },
    {
      id: "l_score_45",
      kind: "lifetime",
      type: "score_run",
      title: "Sky Legend",
      description: "Score at least 45 in a single run",
      target: 45,
      reward: { coins: 250, stardust: 2 },
    },
    {
      id: "l_legendary_soft",
      kind: "lifetime",
      type: "legendary_run",
      title: "Wear the Crown",
      description: "Score 8+ in one run with a legendary skin equipped",
      target: 1,
      reward: { coins: 120, stardust: 1 },
      soft: true,
    },
  ];

  const CHALLENGE_BY_ID = Object.fromEntries(
    [...DAILY_CHALLENGE_POOL, ...LIFETIME_CHALLENGES].map((c) => [c.id, c])
  );

  const NPC_NAMES = [
    "SkyPilot",
    "Nimbus",
    "CoralWing",
    "TealDart",
    "Hopster",
    "CloudKit",
    "Gale",
    "Zephyr",
    "Pip",
    "Aero",
  ];

  // --- Skins (~20) — procedural canvas looks ---
  const SKINS = [
    {
      id: "coral",
      name: "Coral Hopper",
      price: 0,
      rarity: "common",
      currency: "coins",
      trailColor: "#e9c46a",
      trailAccent: "#f4a261",
      trailStyle: "sparkle",
      body: "#e76f51",
      belly: "#f4a261",
      wing: "#c44536",
      beak: "#f4d35e",
      eye: "#1a1a2e",
      crest: "#9b2226",
      accent: "#e9c46a",
      accessory: "crest",
    },
    {
      id: "neon",
      name: "Neon Pulse",
      price: 480,
      rarity: "rare",
      currency: "coins",
      trailColor: "#ff2bd6",
      trailAccent: "#00f0ff",
      trailStyle: "neon",
      body: "#1b1030",
      belly: "#ff2bd6",
      wing: "#00f0ff",
      beak: "#b8f7ff",
      eye: "#00f0ff",
      crest: "#ff2bd6",
      accent: "#00f0ff",
      accessory: "visor",
      glow: "#ff2bd6",
    },
    {
      id: "bone",
      name: "Bone Glider",
      price: 40,
      rarity: "common",
      currency: "coins",
      trailColor: "#f5f0e6",
      trailAccent: "#cfc4b0",
      trailStyle: "sparkle",
      body: "#f5f0e6",
      belly: "#d9d0c1",
      wing: "#cfc4b0",
      beak: "#a89880",
      eye: "#2a2a2a",
      crest: "#ffffff",
      accent: "#e8e0d0",
      accessory: "bones",
    },
    {
      id: "infernal",
      name: "Inferno Fiend",
      price: 85,
      rarity: "common",
      currency: "coins",
      trailColor: "#ff4500",
      trailAccent: "#ffcc00",
      trailStyle: "ember",
      body: "#3a0a0a",
      belly: "#ff4500",
      wing: "#8b0000",
      beak: "#ffcc00",
      eye: "#ffef9a",
      crest: "#ff2200",
      accent: "#ff6a00",
      accessory: "horns",
      trail: "#ff4500",
    },
    {
      id: "void",
      name: "Void Glitch",
      price: 35,
      rarity: "legendary",
      currency: "gems",
      trailColor: "#5b2dff",
      trailAccent: "#39ff14",
      trailStyle: "void",
      body: "#0a0614",
      belly: "#5b2dff",
      wing: "#1a1040",
      beak: "#c084fc",
      eye: "#39ff14",
      crest: "#7c3aed",
      accent: "#39ff14",
      accessory: "glitch",
      glow: "#5b2dff",
    },
    {
      id: "mohawk",
      name: "Mohawk Riot",
      price: 55,
      rarity: "common",
      currency: "coins",
      trailColor: "#f43f5e",
      trailAccent: "#fbbf24",
      trailStyle: "sparkle",
      body: "#1f2937",
      belly: "#f43f5e",
      wing: "#111827",
      beak: "#fbbf24",
      eye: "#111827",
      crest: "#ef4444",
      accent: "#f43f5e",
      accessory: "mohawk",
    },
    {
      id: "vampire",
      name: "Nightfang",
      price: 620,
      rarity: "rare",
      currency: "coins",
      trailColor: "#dc2626",
      trailAccent: "#fca5a5",
      trailStyle: "wisp",
      body: "#1a0b14",
      belly: "#6b0f2a",
      wing: "#2d0a18",
      beak: "#f8fafc",
      eye: "#dc2626",
      crest: "#7f1d1d",
      accent: "#fca5a5",
      accessory: "fangs",
    },
    {
      id: "chrome",
      name: "Chrome Bot",
      price: 110,
      rarity: "common",
      currency: "coins",
      trailColor: "#38bdf8",
      trailAccent: "#e2e8f0",
      trailStyle: "sparkle",
      body: "#94a3b8",
      belly: "#e2e8f0",
      wing: "#64748b",
      beak: "#38bdf8",
      eye: "#0ea5e9",
      crest: "#cbd5e1",
      accent: "#38bdf8",
      accessory: "antenna",
    },
    {
      id: "hotsauce",
      name: "Hot Sauce",
      price: 70,
      rarity: "common",
      currency: "coins",
      trailColor: "#f97316",
      trailAccent: "#fde047",
      trailStyle: "ember",
      body: "#b91c1c",
      belly: "#f97316",
      wing: "#7f1d1d",
      beak: "#fde047",
      eye: "#1c1917",
      crest: "#ea580c",
      accent: "#fb923c",
      accessory: "flame",
      trail: "#f97316",
    },
    {
      id: "assassin",
      name: "Shadow Blade",
      price: 140,
      rarity: "common",
      currency: "coins",
      trailColor: "#22d3ee",
      trailAccent: "#94a3b8",
      trailStyle: "wisp",
      body: "#0f172a",
      belly: "#334155",
      wing: "#020617",
      beak: "#94a3b8",
      eye: "#22d3ee",
      crest: "#1e293b",
      accent: "#22d3ee",
      accessory: "mask",
    },
    {
      id: "slime",
      name: "Toxic Slime",
      price: 25,
      rarity: "legendary",
      currency: "gems",
      trailColor: "#a3e635",
      trailAccent: "#bef264",
      trailStyle: "slime",
      body: "#65a30d",
      belly: "#a3e635",
      wing: "#3f6212",
      beak: "#d9f99d",
      eye: "#14532d",
      crest: "#84cc16",
      accent: "#bef264",
      accessory: "slime",
      glow: "#a3e635",
    },
    {
      id: "golden",
      name: "Golden Idol",
      price: 3600,
      rarity: "epic",
      currency: "coins",
      trailColor: "#facc15",
      trailAccent: "#fff7cc",
      trailStyle: "dust",
      body: "#ca8a04",
      belly: "#fde047",
      wing: "#a16207",
      beak: "#fff7cc",
      eye: "#422006",
      crest: "#eab308",
      accent: "#facc15",
      accessory: "crown",
      glow: "#facc15",
    },
    {
      id: "ice",
      name: "Frost Shard",
      price: 95,
      rarity: "common",
      currency: "coins",
      trailColor: "#67e8f9",
      trailAccent: "#ffffff",
      trailStyle: "sparkle",
      body: "#bae6fd",
      belly: "#e0f2fe",
      wing: "#7dd3fc",
      beak: "#38bdf8",
      eye: "#0c4a6e",
      crest: "#ffffff",
      accent: "#67e8f9",
      accessory: "icicle",
    },
    {
      id: "pixel",
      name: "Pixel Phantom",
      price: 780,
      rarity: "rare",
      currency: "coins",
      trailColor: "#4ade80",
      trailAccent: "#fef08a",
      trailStyle: "pixel",
      body: "#22c55e",
      belly: "#86efac",
      wing: "#15803d",
      beak: "#fef08a",
      eye: "#052e16",
      crest: "#4ade80",
      accent: "#bbf7d0",
      accessory: "pixel",
    },
    {
      id: "cosmic",
      name: "Cosmic Drift",
      price: 50,
      rarity: "legendary",
      currency: "gems",
      trailColor: "#818cf8",
      trailAccent: "#fbbf24",
      trailStyle: "cosmic",
      body: "#312e81",
      belly: "#818cf8",
      wing: "#1e1b4b",
      beak: "#f0abfc",
      eye: "#fbbf24",
      crest: "#c084fc",
      accent: "#a78bfa",
      accessory: "stars",
      glow: "#818cf8",
    },
    {
      id: "lava",
      name: "Lava Core",
      price: 950,
      rarity: "rare",
      currency: "coins",
      trailColor: "#f97316",
      trailAccent: "#fef08a",
      trailStyle: "ember",
      body: "#292524",
      belly: "#f97316",
      wing: "#1c1917",
      beak: "#fb923c",
      eye: "#fef08a",
      crest: "#ea580c",
      accent: "#fdba74",
      accessory: "cracks",
      trail: "#ea580c",
    },
    {
      id: "ghost",
      name: "Ghost Drift",
      price: 2800,
      rarity: "epic",
      currency: "coins",
      trailColor: "#e2e8f0",
      trailAccent: "#94a3b8",
      trailStyle: "mist",
      body: "#e2e8f0",
      belly: "#f8fafc",
      wing: "#cbd5e1",
      beak: "#94a3b8",
      eye: "#64748b",
      crest: "#ffffff",
      accent: "#e2e8f0",
      accessory: "ghost",
      alpha: 0.82,
    },
    {
      id: "eel",
      name: "Volt Eel",
      price: 125,
      rarity: "common",
      currency: "coins",
      trailColor: "#facc15",
      trailAccent: "#2dd4bf",
      trailStyle: "spark",
      body: "#0f766e",
      belly: "#2dd4bf",
      wing: "#115e59",
      beak: "#fde047",
      eye: "#fef08a",
      crest: "#5eead4",
      accent: "#facc15",
      accessory: "sparks",
      trail: "#facc15",
    },
    {
      id: "candy",
      name: "Candy Crash",
      price: 2200,
      rarity: "epic",
      currency: "coins",
      trailColor: "#f472b6",
      trailAccent: "#67e8f9",
      trailStyle: "candy",
      body: "#ec4899",
      belly: "#fbcfe8",
      wing: "#db2777",
      beak: "#67e8f9",
      eye: "#831843",
      crest: "#f472b6",
      accent: "#a5f3fc",
      accessory: "sprinkles",
    },
    {
      id: "obsidian",
      name: "Obsidian King",
      price: 75,
      rarity: "legendary",
      currency: "gems",
      trailColor: "#f43f5e",
      trailAccent: "#a1a1aa",
      trailStyle: "obsidian",
      body: "#09090b",
      belly: "#27272a",
      wing: "#18181b",
      beak: "#a1a1aa",
      eye: "#f43f5e",
      crest: "#3f3f46",
      accent: "#f43f5e",
      accessory: "spikes",
      glow: "#f43f5e",
    },
  ];

  const SKIN_BY_ID = Object.fromEntries(SKINS.map((s) => [s.id, s]));
  const DEFAULT_SKIN_ID = "coral";

  // --- Maps (~20) — one theme per skin, same rarity/pricing ---
  const MAPS = [
    { id: "coral", name: "Coral Hopper", price: 0, rarity: "common", currency: "coins", skyTop: "#4a9fd8", skyBot: "#b8e4f8", cloud: "rgba(255,255,255,0.55)", ground: "#3d8b5a", groundDark: "#2f6b45", dirt: "#8b6914", dirtDark: "#6b5010", pipe: "#2a9d8f", pipeDark: "#1d7a6f", pipeRim: "#e9c46a", pipeHighlight: "#40c4b0", hill1: "rgba(45,120,90,0.35)", hill2: "rgba(35,100,75,0.4)", sun: "rgba(255,236,179,0.85)", sunGlow: "rgba(255,220,140,0.2)", decor: "day" },
    { id: "neon", name: "Neon Pulse", price: 480, rarity: "rare", currency: "coins", skyTop: "#12081f", skyBot: "#2a1048", cloud: "rgba(255,43,214,0.25)", ground: "#1a1030", groundDark: "#0d0618", dirt: "#2d1b4e", dirtDark: "#1a0f30", pipe: "#ff2bd6", pipeDark: "#7a0d68", pipeRim: "#00f0ff", pipeHighlight: "#ff6ae8", hill1: "rgba(255,43,214,0.15)", hill2: "rgba(0,240,255,0.12)", sun: "rgba(0,240,255,0.7)", sunGlow: "rgba(255,43,214,0.25)", decor: "neon" },
    { id: "bone", name: "Bone Glider", price: 40, rarity: "common", currency: "coins", skyTop: "#9ca3af", skyBot: "#e5e7eb", cloud: "rgba(255,255,255,0.7)", ground: "#a8a29e", groundDark: "#78716c", dirt: "#d6d3d1", dirtDark: "#a8a29e", pipe: "#d9d0c1", pipeDark: "#a89880", pipeRim: "#f5f0e6", pipeHighlight: "#ffffff", hill1: "rgba(120,113,108,0.35)", hill2: "rgba(87,83,78,0.4)", sun: "rgba(255,255,255,0.9)", sunGlow: "rgba(255,255,255,0.25)", decor: "fog" },
    { id: "infernal", name: "Inferno Fiend", price: 85, rarity: "common", currency: "coins", skyTop: "#1a0505", skyBot: "#5c1408", cloud: "rgba(255,100,40,0.2)", ground: "#3a1508", groundDark: "#1f0a04", dirt: "#5c2a10", dirtDark: "#3a1808", pipe: "#8b0000", pipeDark: "#4a0000", pipeRim: "#ffcc00", pipeHighlight: "#ff4500", hill1: "rgba(180,40,10,0.35)", hill2: "rgba(120,20,5,0.4)", sun: "rgba(255,80,20,0.85)", sunGlow: "rgba(255,40,0,0.3)", decor: "embers" },
    { id: "void", name: "Void Glitch", price: 35, rarity: "legendary", currency: "gems", skyTop: "#05020c", skyBot: "#1a0a3a", cloud: "rgba(91,45,255,0.2)", ground: "#0a0614", groundDark: "#05020a", dirt: "#1a1040", dirtDark: "#0c0820", pipe: "#5b2dff", pipeDark: "#2a1060", pipeRim: "#39ff14", pipeHighlight: "#7c3aed", hill1: "rgba(91,45,255,0.2)", hill2: "rgba(57,255,20,0.1)", sun: "rgba(57,255,20,0.55)", sunGlow: "rgba(91,45,255,0.3)", decor: "glitch" },
    { id: "mohawk", name: "Mohawk Riot", price: 55, rarity: "common", currency: "coins", skyTop: "#374151", skyBot: "#9ca3af", cloud: "rgba(244,63,94,0.2)", ground: "#1f2937", groundDark: "#111827", dirt: "#4b5563", dirtDark: "#374151", pipe: "#f43f5e", pipeDark: "#9f1239", pipeRim: "#fbbf24", pipeHighlight: "#fb7185", hill1: "rgba(31,41,55,0.5)", hill2: "rgba(17,24,39,0.55)", sun: "rgba(251,191,36,0.75)", sunGlow: "rgba(244,63,94,0.2)", decor: "day" },
    { id: "vampire", name: "Nightfang", price: 620, rarity: "rare", currency: "coins", skyTop: "#0c0610", skyBot: "#3b0a1a", cloud: "rgba(220,38,38,0.18)", ground: "#1a0b14", groundDark: "#0a0508", dirt: "#2d0a18", dirtDark: "#1a0810", pipe: "#6b0f2a", pipeDark: "#3a0814", pipeRim: "#fca5a5", pipeHighlight: "#dc2626", hill1: "rgba(80,10,30,0.4)", hill2: "rgba(50,5,20,0.45)", sun: "rgba(220,38,38,0.55)", sunGlow: "rgba(127,29,29,0.35)", decor: "moon" },
    { id: "chrome", name: "Chrome Bot", price: 110, rarity: "common", currency: "coins", skyTop: "#334155", skyBot: "#94a3b8", cloud: "rgba(226,232,240,0.4)", ground: "#64748b", groundDark: "#475569", dirt: "#94a3b8", dirtDark: "#64748b", pipe: "#38bdf8", pipeDark: "#0284c7", pipeRim: "#e2e8f0", pipeHighlight: "#7dd3fc", hill1: "rgba(71,85,105,0.4)", hill2: "rgba(51,65,85,0.45)", sun: "rgba(56,189,248,0.8)", sunGlow: "rgba(148,163,184,0.3)", decor: "grid" },
    { id: "hotsauce", name: "Hot Sauce", price: 70, rarity: "common", currency: "coins", skyTop: "#7f1d1d", skyBot: "#fb923c", cloud: "rgba(253,224,71,0.25)", ground: "#b91c1c", groundDark: "#7f1d1d", dirt: "#ea580c", dirtDark: "#9a3412", pipe: "#f97316", pipeDark: "#c2410c", pipeRim: "#fde047", pipeHighlight: "#fb923c", hill1: "rgba(185,28,28,0.4)", hill2: "rgba(127,29,29,0.45)", sun: "rgba(253,224,71,0.9)", sunGlow: "rgba(249,115,22,0.35)", decor: "embers" },
    { id: "assassin", name: "Shadow Blade", price: 140, rarity: "common", currency: "coins", skyTop: "#020617", skyBot: "#1e293b", cloud: "rgba(34,211,238,0.15)", ground: "#0f172a", groundDark: "#020617", dirt: "#1e293b", dirtDark: "#0f172a", pipe: "#334155", pipeDark: "#0f172a", pipeRim: "#22d3ee", pipeHighlight: "#64748b", hill1: "rgba(15,23,42,0.55)", hill2: "rgba(2,6,23,0.6)", sun: "rgba(34,211,238,0.5)", sunGlow: "rgba(34,211,238,0.15)", decor: "night" },
    { id: "slime", name: "Toxic Slime", price: 25, rarity: "legendary", currency: "gems", skyTop: "#14532d", skyBot: "#65a30d", cloud: "rgba(163,230,53,0.3)", ground: "#3f6212", groundDark: "#1a2e05", dirt: "#4d7c0f", dirtDark: "#365314", pipe: "#84cc16", pipeDark: "#3f6212", pipeRim: "#d9f99d", pipeHighlight: "#a3e635", hill1: "rgba(101,163,13,0.35)", hill2: "rgba(63,98,18,0.4)", sun: "rgba(190,242,100,0.75)", sunGlow: "rgba(163,230,53,0.3)", decor: "bubbles" },
    { id: "golden", name: "Golden Idol", price: 3600, rarity: "epic", currency: "coins", skyTop: "#78350f", skyBot: "#fde047", cloud: "rgba(250,204,21,0.35)", ground: "#ca8a04", groundDark: "#854d0e", dirt: "#eab308", dirtDark: "#a16207", pipe: "#eab308", pipeDark: "#a16207", pipeRim: "#fff7cc", pipeHighlight: "#facc15", hill1: "rgba(202,138,4,0.4)", hill2: "rgba(133,77,14,0.45)", sun: "rgba(255,247,204,0.95)", sunGlow: "rgba(250,204,21,0.4)", decor: "sparkle" },
    { id: "ice", name: "Frost Shard", price: 95, rarity: "common", currency: "coins", skyTop: "#0c4a6e", skyBot: "#bae6fd", cloud: "rgba(255,255,255,0.65)", ground: "#7dd3fc", groundDark: "#0284c7", dirt: "#e0f2fe", dirtDark: "#7dd3fc", pipe: "#38bdf8", pipeDark: "#0369a1", pipeRim: "#ffffff", pipeHighlight: "#67e8f9", hill1: "rgba(125,211,252,0.4)", hill2: "rgba(56,189,248,0.35)", sun: "rgba(255,255,255,0.9)", sunGlow: "rgba(186,230,253,0.4)", decor: "snow" },
    { id: "pixel", name: "Pixel Phantom", price: 780, rarity: "rare", currency: "coins", skyTop: "#052e16", skyBot: "#22c55e", cloud: "rgba(187,247,208,0.35)", ground: "#15803d", groundDark: "#052e16", dirt: "#16a34a", dirtDark: "#14532d", pipe: "#4ade80", pipeDark: "#166534", pipeRim: "#fef08a", pipeHighlight: "#86efac", hill1: "rgba(34,197,94,0.35)", hill2: "rgba(21,128,61,0.4)", sun: "rgba(254,240,138,0.8)", sunGlow: "rgba(74,222,128,0.3)", decor: "pixel" },
    { id: "cosmic", name: "Cosmic Drift", price: 50, rarity: "legendary", currency: "gems", skyTop: "#0b0620", skyBot: "#312e81", cloud: "rgba(192,132,252,0.25)", ground: "#1e1b4b", groundDark: "#0b0620", dirt: "#312e81", dirtDark: "#1e1b4b", pipe: "#818cf8", pipeDark: "#4338ca", pipeRim: "#f0abfc", pipeHighlight: "#a78bfa", hill1: "rgba(129,140,248,0.25)", hill2: "rgba(67,56,202,0.3)", sun: "rgba(251,191,36,0.7)", sunGlow: "rgba(192,132,252,0.3)", decor: "stars" },
    { id: "lava", name: "Lava Core", price: 950, rarity: "rare", currency: "coins", skyTop: "#1c1917", skyBot: "#7c2d12", cloud: "rgba(249,115,22,0.2)", ground: "#292524", groundDark: "#0c0a09", dirt: "#44403c", dirtDark: "#292524", pipe: "#ea580c", pipeDark: "#7c2d12", pipeRim: "#fef08a", pipeHighlight: "#f97316", hill1: "rgba(120,53,15,0.45)", hill2: "rgba(68,64,60,0.5)", sun: "rgba(249,115,22,0.8)", sunGlow: "rgba(234,88,12,0.35)", decor: "embers" },
    { id: "ghost", name: "Ghost Drift", price: 2800, rarity: "epic", currency: "coins", skyTop: "#1e293b", skyBot: "#64748b", cloud: "rgba(248,250,252,0.35)", ground: "#334155", groundDark: "#1e293b", dirt: "#475569", dirtDark: "#334155", pipe: "#cbd5e1", pipeDark: "#64748b", pipeRim: "#f8fafc", pipeHighlight: "#e2e8f0", hill1: "rgba(100,116,139,0.35)", hill2: "rgba(51,65,85,0.4)", sun: "rgba(248,250,252,0.55)", sunGlow: "rgba(226,232,240,0.2)", decor: "mist" },
    { id: "eel", name: "Volt Eel", price: 125, rarity: "common", currency: "coins", skyTop: "#042f2e", skyBot: "#0f766e", cloud: "rgba(250,204,21,0.2)", ground: "#115e59", groundDark: "#042f2e", dirt: "#0f766e", dirtDark: "#134e4a", pipe: "#2dd4bf", pipeDark: "#0f766e", pipeRim: "#facc15", pipeHighlight: "#5eead4", hill1: "rgba(15,118,110,0.4)", hill2: "rgba(19,78,74,0.45)", sun: "rgba(250,204,21,0.75)", sunGlow: "rgba(45,212,191,0.25)", decor: "sparks" },
    { id: "candy", name: "Candy Crash", price: 2200, rarity: "epic", currency: "coins", skyTop: "#831843", skyBot: "#fbcfe8", cloud: "rgba(165,243,252,0.4)", ground: "#db2777", groundDark: "#9d174d", dirt: "#ec4899", dirtDark: "#be185d", pipe: "#f472b6", pipeDark: "#be185d", pipeRim: "#67e8f9", pipeHighlight: "#fbcfe8", hill1: "rgba(236,72,153,0.35)", hill2: "rgba(190,24,93,0.4)", sun: "rgba(167,232,252,0.85)", sunGlow: "rgba(244,114,182,0.3)", decor: "sprinkles" },
    { id: "obsidian", name: "Obsidian King", price: 75, rarity: "legendary", currency: "gems", skyTop: "#000000", skyBot: "#27272a", cloud: "rgba(244,63,94,0.15)", ground: "#18181b", groundDark: "#09090b", dirt: "#3f3f46", dirtDark: "#27272a", pipe: "#3f3f46", pipeDark: "#18181b", pipeRim: "#f43f5e", pipeHighlight: "#71717a", hill1: "rgba(39,39,42,0.55)", hill2: "rgba(9,9,11,0.6)", sun: "rgba(244,63,94,0.55)", sunGlow: "rgba(244,63,94,0.2)", decor: "spikes" },
  ];

  const MAP_BY_ID = Object.fromEntries(MAPS.map((m) => [m.id, m]));
  const DEFAULT_MAP_ID = "coral";

  // --- Light trails (~20) — one per design, same ids/names/pricing as skins ---
  const TRAILS = SKINS.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    rarity: s.rarity,
    currency: s.currency,
    color: s.trailColor,
    accent: s.trailAccent,
  }));
  const TRAIL_BY_ID = Object.fromEntries(TRAILS.map((t) => [t.id, t]));
  const DEFAULT_TRAIL_ID = "coral";

  // --- Music (~20) — one track per skin, same ids/names/pricing ---
  // Procedural Web Audio loops; vibe drives timbre / rhythm (no external files).
  const MUSIC_VIBES = {
    // Original youth anthems — catchy hooks / dance grooves, not covers of famous songs
    coral: { style: "bubblegum", bpm: 124, root: 196, wave: "triangle", brightness: 0.86, attack: false },
    neon: { style: "cyberPop", bpm: 132, root: 110, wave: "sawtooth", brightness: 0.95, attack: true },
    bone: { style: "chillHop", bpm: 88, root: 98, wave: "triangle", brightness: 0.5, attack: false },
    infernal: { style: "rageBeat", bpm: 150, root: 73, wave: "sawtooth", brightness: 0.82, attack: true },
    void: { style: "nightDrive", bpm: 100, root: 55, wave: "sine", brightness: 0.45, attack: true },
    mohawk: { style: "punkPop", bpm: 168, root: 123, wave: "square", brightness: 0.96, attack: true },
    vampire: { style: "softRnb", bpm: 92, root: 87, wave: "triangle", brightness: 0.55, attack: false },
    chrome: { style: "loftHouse", bpm: 126, root: 130.81, wave: "sawtooth", brightness: 0.84, attack: false },
    hotsauce: { style: "festival", bpm: 140, root: 110, wave: "sawtooth", brightness: 0.92, attack: true },
    assassin: { style: "phonk", bpm: 108, root: 65.41, wave: "sawtooth", brightness: 0.62, attack: true },
    slime: { style: "wobble", bpm: 110, root: 98, wave: "triangle", brightness: 0.72, attack: false },
    golden: { style: "anthem", bpm: 118, root: 174.61, wave: "triangle", brightness: 0.88, attack: false },
    ice: { style: "sparkle", bpm: 128, root: 261.63, wave: "sine", brightness: 0.94, attack: false },
    pixel: { style: "hyperpop", bpm: 156, root: 220, wave: "square", brightness: 0.93, attack: false },
    cosmic: { style: "indieGlow", bpm: 104, root: 146.83, wave: "sine", brightness: 0.7, attack: false },
    lava: { style: "dropRush", bpm: 145, root: 82.41, wave: "sawtooth", brightness: 0.88, attack: true },
    ghost: { style: "bedroom", bpm: 78, root: 123.47, wave: "sine", brightness: 0.4, attack: false },
    eel: { style: "dancePop", bpm: 128, root: 164.81, wave: "sawtooth", brightness: 0.9, attack: false },
    candy: { style: "popHook", bpm: 120, root: 246.94, wave: "square", brightness: 0.92, attack: false },
    obsidian: { style: "trapWave", bpm: 140, root: 55, wave: "square", brightness: 0.78, attack: true },
  };

  const MUSIC = SKINS.map((s) => {
    const vibe = MUSIC_VIBES[s.id] || MUSIC_VIBES.coral;
    const attack = !!vibe.attack;
    return {
      id: s.id,
      name: attack ? s.name + " · Attack" : s.name,
      price: s.price,
      rarity: s.rarity,
      currency: s.currency,
      color: s.trailColor,
      accent: s.trailAccent,
      vibe,
      attackMode: attack,
    };
  });
  const MUSIC_BY_ID = Object.fromEntries(MUSIC.map((m) => [m.id, m]));
  const DEFAULT_MUSIC_ID = "coral";

  // --- State ---
  const STATE = { READY: 0, PLAYING: 1, OVER: 2 };
  let state = STATE.READY;
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  let frames = 0;
  let pipeSpeed = PIPE_SPEED_BASE;
  let pipeGap = PIPE_GAP_BASE;

  function loadStardustBalance() {
    const canonicalRaw = localStorage.getItem(STARDUST_KEY);
    const legacyGemsRaw = localStorage.getItem(STARDUST_KEY_LEGACY_GEMS);
    const hasCanonical = canonicalRaw !== null && canonicalRaw !== "";
    const hasLegacyGems = legacyGemsRaw !== null && legacyGemsRaw !== "";
    const canonical = hasCanonical ? Number(canonicalRaw) || 0 : 0;
    const legacyGems = hasLegacyGems ? Number(legacyGemsRaw) || 0 : 0;

    if (hasLegacyGems) {
      // Prefer skyHopStarDust; migrate skyHopGems once (max to avoid double-count), then stop writing gems key.
      const migrated = hasCanonical ? Math.max(canonical, legacyGems) : legacyGems;
      localStorage.setItem(STARDUST_KEY, String(migrated));
      try {
        localStorage.removeItem(STARDUST_KEY_LEGACY_GEMS);
      } catch (_) {
        /* ignore */
      }
      return migrated;
    }
    return hasCanonical ? canonical : 0;
  }

  let coins = Number(localStorage.getItem(COINS_KEY) || 0) || 0;
  let stardust = loadStardustBalance();
  let runDistance = 0;
  let coinsEarnedThisRun = 0;
  let stardustEarnedThisRun = 0;
  let runsSinceAd = Number(localStorage.getItem(RUNS_KEY) || 0) || 0;
  let adsRemoved = localStorage.getItem(ADS_REMOVED_KEY) === "1";
  let playerName = (localStorage.getItem(NAME_KEY) || "You").slice(0, 16);
  let pendingStartAfterAd = false;
  let adBlocking = false;

  function loadOwnedSkins() {
    let owned = [DEFAULT_SKIN_ID];
    try {
      const raw = JSON.parse(localStorage.getItem(OWNED_SKINS_KEY) || "null");
      if (Array.isArray(raw) && raw.length) {
        owned = raw.filter((id) => SKIN_BY_ID[id]);
      }
    } catch (_) {
      /* ignore */
    }
    if (!owned.includes(DEFAULT_SKIN_ID)) owned.unshift(DEFAULT_SKIN_ID);
    return Array.from(new Set(owned));
  }

  let ownedSkins = loadOwnedSkins();
  let equippedSkinId = localStorage.getItem(EQUIPPED_SKIN_KEY) || DEFAULT_SKIN_ID;
  if (!SKIN_BY_ID[equippedSkinId] || !ownedSkins.includes(equippedSkinId)) {
    equippedSkinId = DEFAULT_SKIN_ID;
  }

  function loadOwnedMaps() {
    let owned = [DEFAULT_MAP_ID];
    try {
      const raw = JSON.parse(localStorage.getItem(OWNED_MAPS_KEY) || "null");
      if (Array.isArray(raw) && raw.length) {
        owned = raw.filter((id) => MAP_BY_ID[id]);
      }
    } catch (_) {
      /* ignore */
    }
    if (!owned.includes(DEFAULT_MAP_ID)) owned.unshift(DEFAULT_MAP_ID);
    return Array.from(new Set(owned));
  }

  let ownedMaps = loadOwnedMaps();
  let equippedMapId = localStorage.getItem(EQUIPPED_MAP_KEY) || DEFAULT_MAP_ID;
  if (!MAP_BY_ID[equippedMapId] || !ownedMaps.includes(equippedMapId)) {
    equippedMapId = DEFAULT_MAP_ID;
  }

  function loadOwnedTrails() {
    let owned = [DEFAULT_TRAIL_ID];
    try {
      const raw = JSON.parse(localStorage.getItem(OWNED_TRAILS_KEY) || "null");
      if (Array.isArray(raw) && raw.length) {
        owned = raw.filter((id) => TRAIL_BY_ID[id]);
      }
    } catch (_) {
      /* ignore */
    }
    if (!owned.includes(DEFAULT_TRAIL_ID)) owned.unshift(DEFAULT_TRAIL_ID);
    return Array.from(new Set(owned));
  }

  let ownedTrails = loadOwnedTrails();
  let equippedTrailId = localStorage.getItem(EQUIPPED_TRAIL_KEY) || DEFAULT_TRAIL_ID;
  if (!TRAIL_BY_ID[equippedTrailId] || !ownedTrails.includes(equippedTrailId)) {
    equippedTrailId = DEFAULT_TRAIL_ID;
  }

  function loadOwnedMusic() {
    let owned = [DEFAULT_MUSIC_ID];
    try {
      const raw = JSON.parse(localStorage.getItem(OWNED_MUSIC_KEY) || "null");
      if (Array.isArray(raw) && raw.length) {
        owned = raw.filter((id) => MUSIC_BY_ID[id]);
      }
    } catch (_) {
      /* ignore */
    }
    if (!owned.includes(DEFAULT_MUSIC_ID)) owned.unshift(DEFAULT_MUSIC_ID);
    return Array.from(new Set(owned));
  }

  let ownedMusic = loadOwnedMusic();
  let equippedMusicId = localStorage.getItem(EQUIPPED_MUSIC_KEY) || DEFAULT_MUSIC_ID;
  if (!MUSIC_BY_ID[equippedMusicId] || !ownedMusic.includes(equippedMusicId)) {
    equippedMusicId = DEFAULT_MUSIC_ID;
  }

  function loadMusicMuted() {
    try {
      // Prefer explicit enabled key when present; migrate from mute key otherwise.
      const enabledRaw = localStorage.getItem(MUSIC_ENABLED_KEY);
      if (enabledRaw === "0" || enabledRaw === "1") {
        return enabledRaw !== "1";
      }
      return localStorage.getItem(MUSIC_MUTE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function loadMusicVolume() {
    try {
      const v = parseFloat(localStorage.getItem(MUSIC_VOLUME_KEY) || "0.45");
      if (Number.isFinite(v)) return Math.max(0, Math.min(1, v));
    } catch (_) {
      /* ignore */
    }
    return 0.45;
  }

  function loadBoolSetting(key, defaultOn) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return !!defaultOn;
      return raw === "1" || raw === "true";
    } catch (_) {
      return !!defaultOn;
    }
  }

  let musicMuted = loadMusicMuted();
  let musicVolume = loadMusicVolume();
  let vibrationEnabled = loadBoolSetting(VIBRATION_KEY, true);
  let sfxEnabled = loadBoolSetting(SFX_KEY, true);

  let shopTab = "skins"; // skins | maps | trails | music | stardust
  let shopRarityFilter = "all";
  let shopPreviewSkinId = equippedSkinId;
  let shopPreviewMapId = equippedMapId;
  let shopPreviewTrailId = equippedTrailId;
  let shopPreviewMusicId = equippedMusicId;
  let trailPoints = [];
  let shopTrailPoints = [];
  let shopPreviewAnimId = 0;

  function persistOwnedSkins() {
    localStorage.setItem(OWNED_SKINS_KEY, JSON.stringify(ownedSkins));
  }

  function persistEquippedSkin() {
    localStorage.setItem(EQUIPPED_SKIN_KEY, equippedSkinId);
  }

  function getEquippedSkin() {
    return SKIN_BY_ID[equippedSkinId] || SKIN_BY_ID[DEFAULT_SKIN_ID];
  }

  function persistOwnedMaps() {
    localStorage.setItem(OWNED_MAPS_KEY, JSON.stringify(ownedMaps));
  }

  function persistEquippedMap() {
    localStorage.setItem(EQUIPPED_MAP_KEY, equippedMapId);
  }

  function getEquippedMap() {
    return MAP_BY_ID[equippedMapId] || MAP_BY_ID[DEFAULT_MAP_ID];
  }

  function persistOwnedTrails() {
    localStorage.setItem(OWNED_TRAILS_KEY, JSON.stringify(ownedTrails));
  }

  function persistEquippedTrail() {
    localStorage.setItem(EQUIPPED_TRAIL_KEY, equippedTrailId);
  }

  function getEquippedTrail() {
    return TRAIL_BY_ID[equippedTrailId] || TRAIL_BY_ID[DEFAULT_TRAIL_ID];
  }

  function persistOwnedMusic() {
    localStorage.setItem(OWNED_MUSIC_KEY, JSON.stringify(ownedMusic));
  }

  function persistEquippedMusic() {
    localStorage.setItem(EQUIPPED_MUSIC_KEY, equippedMusicId);
  }

  function getEquippedMusic() {
    return MUSIC_BY_ID[equippedMusicId] || MUSIC_BY_ID[DEFAULT_MUSIC_ID];
  }

  function persistMusicMute() {
    localStorage.setItem(MUSIC_MUTE_KEY, musicMuted ? "1" : "0");
    localStorage.setItem(MUSIC_ENABLED_KEY, musicMuted ? "0" : "1");
  }

  function persistMusicVolume() {
    localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
  }

  function persistVibration() {
    localStorage.setItem(VIBRATION_KEY, vibrationEnabled ? "1" : "0");
  }

  function persistSfx() {
    localStorage.setItem(SFX_KEY, sfxEnabled ? "1" : "0");
  }

  function applyMapPalette(map) {
    C.skyTop = map.skyTop;
    C.skyBot = map.skyBot;
    C.cloud = map.cloud;
    C.ground = map.ground;
    C.groundDark = map.groundDark;
    C.dirt = map.dirt;
    C.dirtDark = map.dirtDark;
    C.pipe = map.pipe;
    C.pipeDark = map.pipeDark;
    C.pipeRim = map.pipeRim;
    C.pipeHighlight = map.pipeHighlight;
    C.hill1 = map.hill1;
    C.hill2 = map.hill2;
    C.sun = map.sun;
    C.sunGlow = map.sunGlow;
    C.mapDecor = map.decor;
  }

  const bird = {
    x: BIRD_X,
    y: H / 2,
    vy: 0,
    rot: 0,
    wing: 0,
  };

  let pipes = [];
  let particles = [];
  let groundOffset = 0;
  let skyOffset = 0;
  let flash = 0;
  let overTimer = 0;

  // Palette — dusk teal / coral hop
  const C = {
    skyTop: "#4a9fd8",
    skyBot: "#b8e4f8",
    cloud: "rgba(255,255,255,0.55)",
    ground: "#3d8b5a",
    groundDark: "#2f6b45",
    dirt: "#8b6914",
    dirtDark: "#6b5010",
    pipe: "#2a9d8f",
    pipeDark: "#1d7a6f",
    pipeRim: "#e9c46a",
    pipeHighlight: "#40c4b0",
    hill1: "rgba(45, 120, 90, 0.35)",
    hill2: "rgba(35, 100, 75, 0.4)",
    sun: "rgba(255, 236, 179, 0.85)",
    sunGlow: "rgba(255, 220, 140, 0.2)",
    mapDecor: "day",
    hud: "#fff",
    hudShadow: "rgba(0,0,0,0.35)",
    panel: "rgba(15, 23, 42, 0.72)",
    accent: "#e9c46a",
    coin: "#f4d35e",
    gem: "#c084fc",
    stardust: "#c084fc", // alias
  };

  applyMapPalette(getEquippedMap());

  // --- Procedural music (Web Audio API, no external files) ---
  const musicEngine = {
    ctx: null,
    master: null,
    muteGain: null,
    playingId: null,
    previewing: false,
    timerId: 0,
    nextTime: 0,
    step: 0,
    pattern: null,
    track: null,
  };

  const MUSIC_SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pent: [0, 2, 4, 7, 9],
    dark: [0, 1, 3, 5, 7, 8, 10],
    chip: [0, 3, 5, 7, 10],
    blues: [0, 3, 5, 6, 7, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    harmonic: [0, 2, 3, 5, 7, 8, 11],
    // Youth-catchy: bright pop pent + soft minor for hooks
    pop: [0, 2, 4, 5, 7, 9],
    trap: [0, 3, 5, 7, 10],
  };

  function styleScale(style) {
    // Bright hooky
    if (["popHook", "bubblegum", "sparkle", "dancePop", "anthem", "hyperpop", "candy", "playful", "tropical", "majestic"].includes(style)) {
      return MUSIC_SCALES.pop;
    }
    // Festival / cyber energy
    if (["festival", "cyberPop", "dropRush", "loftHouse", "electric", "synth", "spicy"].includes(style)) {
      return MUSIC_SCALES.pent;
    }
    // Trap / phonk / rage
    if (["trapWave", "phonk", "rageBeat", "wobble", "rumble"].includes(style)) {
      return MUSIC_SCALES.trap;
    }
    // Moody youth
    if (["nightDrive", "softRnb", "indieGlow", "bedroom", "noir", "hollow", "stealth", "ambient", "ethereal"].includes(style)) {
      return MUSIC_SCALES.minor;
    }
    if (["punkPop", "riot", "glitch", "tense"].includes(style)) {
      return MUSIC_SCALES.phrygian;
    }
    if (["chip", "robot", "arcade", "arcadeBoss"].includes(style)) {
      return MUSIC_SCALES.chip;
    }
    if (["crystal", "cosmic"].includes(style)) {
      return MUSIC_SCALES.lydian;
    }
    return MUSIC_SCALES.minor;
  }

  function ensureMusicContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!musicEngine.ctx) {
      musicEngine.ctx = new AC();
      musicEngine.master = musicEngine.ctx.createGain();
      musicEngine.muteGain = musicEngine.ctx.createGain();
      musicEngine.master.connect(musicEngine.muteGain);
      musicEngine.muteGain.connect(musicEngine.ctx.destination);
      musicEngine.master.gain.value = musicVolume * 0.34;
      musicEngine.muteGain.gain.value = musicMuted ? 0 : 1;
    }
    if (musicEngine.ctx.state === "suspended") {
      musicEngine.ctx.resume().catch(() => {});
    }
    return musicEngine.ctx;
  }

  function resumeMusicOnGesture() {
    ensureMusicContext();
  }

  function applyMusicGains() {
    if (!musicEngine.master || !musicEngine.muteGain) return;
    musicEngine.master.gain.value = Math.max(0, Math.min(1, musicVolume)) * 0.34;
    // Shop previews stay audible even if Background music is toggled off
    const audible = musicEngine.previewing || !musicMuted;
    musicEngine.muteGain.gain.value = audible ? 1 : 0;
  }

  /** Short haptic pulse when vibration is enabled and supported. */
  function vibratePulse(pattern) {
    if (!vibrationEnabled) return;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern);
      }
    } catch (_) {
      /* ignore */
    }
  }

  /**
   * Simple Web Audio SFX blips (independent of BGM mute).
   * kind: "flap" | "death" | "ui"
   */
  function playSfx(kind) {
    if (!sfxEnabled) return;
    const ctx = ensureMusicContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (kind === "flap") {
      osc.type = "square";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.06);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (kind === "death") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.28);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.34);
    } else {
      // ui click
      osc.type = "triangle";
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  function buildMusicPattern(track) {
    const vibe = track.vibe || MUSIC_VIBES.coral;
    const scale = styleScale(vibe.style);
    const style = vibe.style;
    const steps = 32; // 2-bar loop at 8th notes — room for real phrases
    const bass = new Array(steps).fill(-1);
    const lead = new Array(steps).fill(-1);
    const chord = new Array(steps).fill(-1);
    const kick = new Array(steps).fill(0);
    const snare = new Array(steps).fill(0);
    const hat = new Array(steps).fill(0);

    // Original catchy youth hooks (scale degrees). Short sticky phrases — NOT famous melodies.
    const motifs = {
      // Chorus-y pop: leap up, bounce home
      popHook: [0, 2, 4, 7, 4, -1, 2, 0, 5, 4, 2, 0, 4, 2, 0, -1],
      bubblegum: [4, 4, 2, 0, 5, 4, 2, -1, 4, 5, 7, 5, 4, 2, 0, 2],
      sparkle: [7, 5, 4, 2, 4, 5, 7, 9, 7, 5, 4, 2, 0, 2, 4, 5],
      dancePop: [0, -1, 4, 5, 7, -1, 5, 4, 0, -1, 4, 7, 5, 4, 2, 0],
      anthem: [0, 4, 7, 4, 5, 7, 9, 7, 0, 4, 7, 12, 9, 7, 5, 4],
      hyperpop: [0, 7, 4, 12, 7, 4, 0, 5, 9, 5, 12, 7, 4, 0, 7, 4],
      cyberPop: [0, 0, 5, 7, 9, 7, 5, 0, 4, 5, 7, 12, 9, 7, 5, 4],
      festival: [0, 4, 7, 12, 7, 4, 0, 7, 5, 9, 12, 16, 12, 9, 7, 4],
      dropRush: [0, 0, 0, 5, 7, 7, 5, 3, 0, 5, 7, 10, 7, 5, 0, 5],
      loftHouse: [0, -1, 2, 4, -1, 4, 5, 7, 0, -1, 4, 5, -1, 7, 5, 4],
      trapWave: [0, -1, -1, 3, 5, -1, 7, -1, 0, -1, 5, -1, 3, -1, 7, 5],
      phonk: [0, 0, -1, 3, 0, -1, 5, 3, 0, 0, -1, 7, 5, -1, 3, 0],
      rageBeat: [0, 0, 3, 5, 0, 3, 7, 5, 0, 5, 8, 7, 5, 3, 0, 3],
      punkPop: [0, 2, 0, 4, 0, 5, 4, 2, 0, 4, 7, 4, 5, 2, 0, 2],
      softRnb: [0, -1, 2, 3, 5, -1, 3, 2, 0, -1, 5, 3, 2, -1, 0, -1],
      nightDrive: [0, -1, 4, -1, 7, -1, 5, -1, 4, -1, 2, -1, 0, 2, 4, 5],
      indieGlow: [0, 2, 4, -1, 5, 4, 2, 0, 4, -1, 7, 5, 4, 2, 0, -1],
      bedroom: [0, -1, -1, 4, -1, -1, 7, -1, 5, -1, -1, 4, -1, -1, 2, -1],
      chillHop: [0, -1, 3, -1, 5, -1, 3, 0, -1, 5, -1, 7, 5, -1, 3, -1],
      wobble: [0, 0, 3, 3, 5, 5, 3, 0, 7, 5, 3, 0, 5, 3, 0, 0],
      // Fallbacks kept for safety
      tropical: [0, 2, 4, 2, 5, 4, 2, 0, 0, 2, 4, 5, 4, 2, 0, -1],
      synth: [0, 0, 3, 4, 7, 4, 3, 0, 5, 4, 3, 2, 0, 2, 4, 7],
      arcade: [0, 2, 4, 7, 4, 2, 0, 4, 5, 7, 9, 7, 5, 4, 2, 0],
      chip: [0, 4, 7, 4, 5, 9, 5, 4, 0, 4, 7, 12, 7, 4, 0, 4],
      playful: [0, 2, 4, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, 2, 4],
      electric: [0, 3, 5, 7, 10, 7, 5, 3, 0, 5, 7, 12, 10, 7, 5, 0],
      glitch: [0, 7, 3, 10, 0, 5, 12, 3, 7, 0, 10, 5, 3, 12, 7, 0],
      riot: [0, 0, 3, 0, 5, 0, 3, 7, 0, 3, 5, 7, 5, 3, 0, 3],
      ambient: [0, -1, -1, 4, -1, -1, 7, -1, 5, -1, -1, 4, -1, -1, 2, -1],
      ethereal: [7, -1, 9, -1, 12, -1, 9, -1, 5, -1, 7, -1, 9, -1, 5, -1],
      hollow: [0, -1, 3, -1, 5, -1, 3, -1, 0, -1, 2, -1, 5, -1, 7, -1],
      noir: [0, -1, 2, -1, 3, -1, 5, -1, 7, -1, 5, -1, 3, -1, 2, -1],
      stealth: [0, -1, -1, 2, -1, -1, 3, -1, 5, -1, -1, 3, -1, -1, 2, -1],
      majestic: [0, 2, 4, 5, 7, 5, 4, 2, 0, 4, 7, 9, 7, 5, 4, 2],
      crystal: [4, 5, 7, 9, 7, 5, 4, 2, 0, 2, 4, 5, 7, 9, 12, 9],
      tense: [0, 1, 3, 1, 0, 3, 5, 3, 0, 1, 3, 5, 7, 5, 3, 1],
      rumble: [0, 0, -1, 3, 0, -1, 5, 0, 0, 3, -1, 5, 0, 3, 0, -1],
      spicy: [0, 3, 5, 7, 5, 3, 0, 5, 7, 10, 7, 5, 3, 0, 5, 3],
      robot: [0, 2, 0, 4, 0, 2, 5, 2, 0, 4, 7, 4, 5, 2, 0, 2],
    };

    const bassMotif = {
      // Sidechain-ish / dance bass
      popHook: [0, -1, -1, 0, 5, -1, -1, 5, 0, -1, -1, 0, 7, -1, 5, -1],
      bubblegum: [0, -1, 0, -1, 5, -1, 4, -1, 0, -1, 0, -1, 5, -1, 0, -1],
      sparkle: [0, -1, -1, -1, 4, -1, -1, -1, 5, -1, -1, -1, 0, -1, 7, -1],
      dancePop: [0, -1, 0, -1, 0, -1, 5, -1, 0, -1, 0, -1, 7, -1, 5, -1],
      anthem: [0, -1, -1, -1, 4, -1, -1, -1, 5, -1, -1, -1, 7, -1, 5, -1],
      hyperpop: [0, 0, -1, 5, 0, -1, 7, 5, 0, 0, -1, 4, 0, 5, 7, -1],
      cyberPop: [0, -1, 0, -1, 5, -1, 0, -1, 0, -1, 7, -1, 5, -1, 0, -1],
      festival: [0, 0, -1, 0, 5, 5, -1, 5, 7, 7, -1, 7, 0, 5, 0, -1],
      dropRush: [0, 0, 0, -1, 5, 5, 0, -1, 7, 7, 0, -1, 5, 0, 3, -1],
      loftHouse: [0, -1, -1, -1, 0, -1, -1, -1, 5, -1, -1, -1, 0, -1, 7, -1],
      trapWave: [0, -1, -1, -1, -1, -1, -1, -1, 5, -1, -1, -1, -1, -1, 3, -1],
      phonk: [0, 0, -1, -1, 0, 0, -1, 3, 5, 5, -1, -1, 0, 0, 3, -1],
      rageBeat: [0, 0, 0, -1, 3, 3, 0, -1, 5, 5, 0, -1, 0, 3, 5, -1],
      punkPop: [0, 0, -1, 0, 5, 5, -1, 5, 0, 0, -1, 0, 7, 5, -1, 0],
      softRnb: [0, -1, -1, -1, 3, -1, -1, -1, 5, -1, -1, -1, 0, -1, -1, -1],
      nightDrive: [0, -1, -1, -1, -1, -1, 5, -1, 0, -1, -1, -1, -1, -1, 7, -1],
      indieGlow: [0, -1, -1, 2, -1, -1, 5, -1, 0, -1, -1, 4, -1, -1, 5, -1],
      bedroom: [0, -1, -1, -1, -1, -1, -1, -1, 5, -1, -1, -1, -1, -1, -1, -1],
      chillHop: [0, -1, -1, -1, 5, -1, -1, -1, 0, -1, -1, -1, 3, -1, -1, -1],
      wobble: [0, 0, -1, 0, 3, 3, -1, 3, 5, 5, -1, 5, 0, 0, -1, 0],
      default: [0, -1, -1, -1, 0, -1, -1, -1, 5, -1, -1, -1, 0, -1, 7, -1],
    };

    const bMotif = bassMotif[style] || bassMotif.default;
    const motif = motifs[style] || motifs.popHook;

    // Youth groove families
    const liftStyles = new Set([
      "popHook", "bubblegum", "sparkle", "anthem", "hyperpop", "festival", "dancePop", "cyberPop", "punkPop",
    ]);
    const trapFeel = new Set(["trapWave", "phonk", "rageBeat", "chillHop"]);
    const fourOnFloor = new Set(["dancePop", "loftHouse", "festival", "cyberPop", "dropRush", "sparkle"]);
    const softFeel = new Set(["softRnb", "bedroom", "indieGlow", "nightDrive", "ambient", "ethereal", "hollow"]);
    const busy = new Set(["hyperpop", "punkPop", "riot", "chip", "playful", "electric"]);

    // Pop progression roots (I–V–vi–IV style degree indices into scale) — original chord motion feel
    const popProg = [0, 4, 5, 3]; // scale degrees: I, V, vi, IV-ish depending on scale length

    for (let i = 0; i < steps; i++) {
      const mi = i % 16;
      const bar = Math.floor(i / 8) % 4;
      const octaveBoost = i >= 16 && liftStyles.has(style) ? 12 : 0;

      const md = motif[mi];
      if (md >= 0) {
        const deg = scale[md % scale.length] + Math.floor(md / scale.length) * 12;
        lead[i] = deg + octaveBoost;
      }
      // Soft styles: breathe on offbeats
      if (softFeel.has(style) && i % 2 === 1) lead[i] = -1;
      // Hyperpop stutter fill on second bar
      if (style === "hyperpop" && i >= 24 && i % 2 === 0) {
        lead[i] = scale[(i / 2) % scale.length | 0] + 12;
      }

      const bd = bMotif[mi];
      if (bd >= 0) bass[i] = scale[bd % scale.length];

      // Chords: youth pop progression on most bright styles
      if (softFeel.has(style)) {
        if (i % 16 === 0) chord[i] = scale[0];
        else if (i % 16 === 8) chord[i] = scale[Math.min(5, scale.length - 1) % scale.length];
      } else if (liftStyles.has(style) || fourOnFloor.has(style) || style === "anthem") {
        if (i % 8 === 0) {
          const degIdx = popProg[bar % popProg.length] % scale.length;
          chord[i] = scale[degIdx];
        }
      } else {
        if (i % 8 === 0) chord[i] = scale[0];
        else if (i % 8 === 4) chord[i] = scale[Math.min(3, scale.length - 1)];
      }

      // Drums
      if (trapFeel.has(style)) {
        // Half-time kick/snare + rolling hats
        if (i % 8 === 0) kick[i] = 1;
        if (i % 16 === 8) snare[i] = 1;
        if (i % 2 === 1) hat[i] = 0.2;
        if (i % 16 >= 12) hat[i] = Math.max(hat[i], 0.32); // end-of-bar roll
        if (style === "rageBeat" && i % 4 === 2) kick[i] = Math.max(kick[i], 0.7);
      } else if (fourOnFloor.has(style)) {
        if (i % 2 === 0) kick[i] = 0.9;
        if (i % 8 === 4) snare[i] = 1;
        if (i % 2 === 1) hat[i] = 0.26;
        if (style === "festival" && i % 16 >= 14) hat[i] = 0.4;
      } else if (softFeel.has(style)) {
        if (i % 8 === 0) kick[i] = 0.85;
        if (i % 16 === 8) snare[i] = 0.55;
        if (i % 4 === 2) hat[i] = 0.14;
      } else if (busy.has(style)) {
        if (i % 4 === 0) kick[i] = 1;
        if (i % 8 === 4) snare[i] = 1;
        if (i % 2 === 1) hat[i] = 0.24;
        if (style === "punkPop" && i % 4 === 2) kick[i] = Math.max(kick[i], 0.55);
      } else {
        if (i % 4 === 0) kick[i] = 1;
        if (i % 8 === 4) snare[i] = 0.85;
        if (i % 4 === 2) hat[i] = 0.2;
      }
      if (style === "wobble" && i % 2 === 0) kick[i] = Math.max(kick[i], 0.7);
      if (style === "phonk" && i % 16 === 4) snare[i] = 0.4;
    }

    return { bass, lead, chord, kick, snare, hat, steps, vibe };
  }

  function musicNoteFreq(root, semitone) {
    return root * Math.pow(2, semitone / 12);
  }

  function playMusicTone(freq, when, dur, type, gainVal, filterFreq) {
    const ctx = musicEngine.ctx;
    if (!ctx || !musicEngine.master || !freq || freq < 20) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, when);
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(filterFreq || 1800, when);
    filt.Q.value = 0.8;
    const peak = Math.max(0.001, gainVal || 0.05);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + Math.min(0.04, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.06, dur));
    osc.connect(filt);
    filt.connect(g);
    g.connect(musicEngine.master);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  function playMusicKick(when, gainVal) {
    const ctx = musicEngine.ctx;
    if (!ctx || !musicEngine.master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, when);
    osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gainVal || 0.12), when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
    osc.connect(g);
    g.connect(musicEngine.master);
    osc.start(when);
    osc.stop(when + 0.2);
  }

  function playMusicSnare(when, gainVal) {
    const ctx = musicEngine.ctx;
    if (!ctx || !musicEngine.master) return;
    // tonal body
    playMusicTone(180, when, 0.08, "triangle", (gainVal || 0.06) * 0.5, 900);
    // noise crack
    const len = Math.max(1, Math.floor(ctx.sampleRate * 0.08));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 1800;
    g.gain.setValueAtTime(Math.max(0.0001, gainVal || 0.05), when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);
    src.connect(filt);
    filt.connect(g);
    g.connect(musicEngine.master);
    src.start(when);
    src.stop(when + 0.1);
  }

  function playMusicNoise(when, dur, gainVal) {
    const ctx = musicEngine.ctx;
    if (!ctx || !musicEngine.master) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    filt.type = "highpass";
    filt.frequency.value = 6000;
    g.gain.setValueAtTime(Math.max(0.0001, gainVal || 0.02), when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(musicEngine.master);
    src.start(when);
    src.stop(when + dur + 0.02);
  }

  function scheduleMusicStep() {
    if (!musicEngine.ctx || !musicEngine.pattern || !musicEngine.track) return;
    const ctx = musicEngine.ctx;
    const lookAhead = 0.15;
    const pattern = musicEngine.pattern;
    const vibe = pattern.vibe;
    const stepDur = 60 / Math.max(40, vibe.bpm) / 2; // 8th notes
    const bright = vibe.brightness || 0.5;
    const wave = vibe.wave || "sine";
    const style = vibe.style;

    while (musicEngine.nextTime < ctx.currentTime + lookAhead) {
      const i = musicEngine.step % pattern.steps;
      const t = musicEngine.nextTime;
      const root = vibe.root;

      if (pattern.kick[i] > 0) {
        playMusicKick(t, 0.14 * bright * pattern.kick[i]);
      }
      if (pattern.snare[i] > 0) {
        playMusicSnare(t, 0.07 * bright * pattern.snare[i]);
      }
      // Hats stay quiet — supporting sparkle only
      if (pattern.hat[i] > 0 && style !== "ethereal" && style !== "ambient") {
        playMusicNoise(t, stepDur * 0.22, 0.008 * pattern.hat[i]);
      }

      if (pattern.bass[i] >= 0) {
        const f = musicNoteFreq(root / 2, pattern.bass[i]);
        const bassWave =
          style === "wobble" || style === "rumble" || style === "glitch" || style === "synth"
            ? "sawtooth"
            : "triangle";
        playMusicTone(f, t, stepDur * 1.6, bassWave, 0.11 * bright, 380);
        if (style === "wobble" || style === "synth") {
          playMusicTone(f * 2.005, t, stepDur * 1.2, "sawtooth", 0.04 * bright, 600);
        }
      }

      if (pattern.chord[i] >= 0) {
        const base = musicNoteFreq(root, pattern.chord[i]);
        const third = musicNoteFreq(root, pattern.chord[i] + (styleScale(style)[2] || 3));
        const fifth = musicNoteFreq(root, pattern.chord[i] + 7);
        const isArcade = String(style).startsWith("arcade");
        const padDur = stepDur * (isArcade ? 3.2 : 7.5);
        const padWave = isArcade ? "square" : "sine";
        const padGain = isArcade ? 0.025 : 0.035;
        playMusicTone(base, t, padDur, padWave, padGain * bright, isArcade ? 1400 : 700);
        playMusicTone(third, t, padDur, padWave, padGain * 0.75 * bright, isArcade ? 1600 : 900);
        playMusicTone(fifth, t, padDur, isArcade ? "square" : "triangle", padGain * 0.6 * bright, isArcade ? 1800 : 1100);
      }

      if (pattern.lead[i] >= 0) {
        const f = musicNoteFreq(root, pattern.lead[i]);
        const isArcade = style.startsWith("arcade") || style === "chip" || style === "robot" || style === "playful";
        const isAttack = style === "arcadeAttack";
        let leadWave = isArcade ? "square" : wave;
        let leadGain = (isAttack ? 0.13 : isArcade ? 0.11 : 0.09) * bright;
        let filt = isAttack ? 3800 : isArcade ? 3200 : 1400 + bright * 1800;
        let dur = stepDur * (style === "ambient" || style === "ethereal" ? 2.4 : isAttack ? 0.75 : isArcade ? 0.95 : 1.15);
        if (style === "synth" || style === "spicy" || style === "electric") {
          leadWave = "sawtooth";
          leadGain = 0.08 * bright;
          filt = 2400;
        }
        if (isArcade) {
          // Octave sparkle + short duty-cycle feel
          playMusicTone(f * 2, t, dur * 0.55, "square", leadGain * 0.35, 4500);
          if (i % 2 === 0) {
            playMusicTone(f * 1.5, t, stepDur * 0.35, "square", leadGain * 0.22, 3800);
          }
        }
        if (isAttack) {
          // Attack mode: double-time stabs + power fifths
          if (i % 2 === 0) {
            playMusicTone(f * 1.498, t, stepDur * 0.4, "square", leadGain * 0.4, 4200);
          }
          if (i % 4 === 0) {
            playMusicKick(t, 0.16 * bright);
          }
          if (i % 8 === 4) {
            playMusicSnare(t, 0.1 * bright);
          }
        }
        if (style === "arcadeBoss" && i % 4 === 0) {
          playMusicTone(f / 2, t, stepDur * 1.8, "square", leadGain * 0.45, 1800);
        }
        if (style === "glitch") {
          leadWave = "square";
          if (i % 4 === 3) playMusicTone(f * 1.5, t, stepDur * 0.35, "square", 0.05, 2000);
        }
        playMusicTone(f, t, dur, leadWave, leadGain, filt);
      }

      // Style drone beds
      if (i === 0 && (style === "ambient" || style === "noir" || style === "hollow" || style === "regal" || style === "ghost" || style === "glitch" || style === "ethereal")) {
        playMusicTone(root / 2, t, stepDur * pattern.steps * 0.95, "sine", 0.045 * bright, 320);
        playMusicTone(root * 0.75, t, stepDur * pattern.steps * 0.95, "triangle", 0.025 * bright, 450);
      }

      musicEngine.nextTime += stepDur;
      musicEngine.step += 1;
    }
  }

  function stopMusicLoop() {
    if (musicEngine.timerId) {
      clearInterval(musicEngine.timerId);
      musicEngine.timerId = 0;
    }
    musicEngine.playingId = null;
    musicEngine.pattern = null;
    musicEngine.track = null;
    musicEngine.previewing = false;
  }


  function auditionMusicTrack(trackId, sourceLabel) {
    const id = trackId || shopPreviewMusicId || equippedMusicId;
    const track = MUSIC_BY_ID[id] || getEquippedMusic();
    if (!track) return;
    shopPreviewMusicId = track.id;
    resumeMusicOnGesture();
    // Force restart so repeated Preview taps always re-trigger audio
    stopMusicLoop();
    startMusicTrack(track.id, true);
    updateShopLivePreview();
    if (musicPreviewStatus) {
      musicPreviewStatus.textContent = "Playing: " + track.name + (sourceLabel ? " (" + sourceLabel + ")" : "");
    }
    playSfx("ui");
  }

  function startMusicTrack(trackId, asPreview) {
    const track = MUSIC_BY_ID[trackId] || getEquippedMusic();
    if (!track) return;
    // Shop previews always play so players can audition before buying.
    // Only block non-preview BGM when music is muted/disabled.
    if (musicMuted && !asPreview) {
      stopMusicLoop();
      return;
    }
    const ctx = ensureMusicContext();
    if (!ctx) return;
    if (musicEngine.playingId === track.id && musicEngine.previewing === !!asPreview && musicEngine.timerId) {
      applyMusicGains();
      return;
    }
    stopMusicLoop();
    musicEngine.track = track;
    musicEngine.pattern = buildMusicPattern(track);
    musicEngine.playingId = track.id;
    musicEngine.previewing = !!asPreview;
    musicEngine.step = 0;
    musicEngine.nextTime = ctx.currentTime + 0.05;
    applyMusicGains();
    scheduleMusicStep();
    musicEngine.timerId = setInterval(scheduleMusicStep, 40);
  }

  function syncBackgroundMusic() {
    try {
      // Shop music tab uses preview; otherwise BGM on ready/play/over
      if (shopModal && !shopModal.classList.contains("hidden") && shopTab === "music") {
        startMusicTrack(shopPreviewMusicId || equippedMusicId, true);
        return;
      }
      if (musicMuted) {
        stopMusicLoop();
        return;
      }
      if (state === STATE.READY || state === STATE.PLAYING || state === STATE.OVER) {
        startMusicTrack(equippedMusicId, false);
      } else {
        stopMusicLoop();
      }
    } catch (err) {
      console.warn("music sync failed", err);
      try { stopMusicLoop(); } catch (_) {}
    }
  }

  function setMusicMuted(muted) {
    musicMuted = !!muted;
    persistMusicMute();
    applyMusicGains();
    if (musicMuted) stopMusicLoop();
    else syncBackgroundMusic();
    syncSettingsUI();
  }

  function setMusicEnabled(enabled) {
    setMusicMuted(!enabled);
  }

  function setMusicVolume(vol) {
    musicVolume = Math.max(0, Math.min(1, Number(vol) || 0));
    persistMusicVolume();
    applyMusicGains();
    syncSettingsUI();
  }

  function setVibrationEnabled(on) {
    vibrationEnabled = !!on;
    persistVibration();
    syncSettingsUI();
  }

  function setSfxEnabled(on) {
    sfxEnabled = !!on;
    persistSfx();
    syncSettingsUI();
  }

  function syncSettingsUI() {
    const vib = document.getElementById("settings-vibration");
    const sfx = document.getElementById("settings-sfx");
    const music = document.getElementById("settings-music");
    const vol = document.getElementById("settings-music-volume");
    if (vib) vib.checked = vibrationEnabled;
    if (sfx) sfx.checked = sfxEnabled;
    if (music) music.checked = !musicMuted;
    if (vol) {
      vol.value = String(Math.round(musicVolume * 100));
      vol.disabled = musicMuted;
    }
  }

  // --- Period helpers (UTC) ---
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function utcDayKey(d) {
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  }

  function utcMonthKey(d) {
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
  }

  /** ISO week key: YYYY-Www (UTC) */
  function utcIsoWeekKey(d) {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${pad2(weekNo)}`;
  }

  function periodKey(kind) {
    const now = new Date();
    if (kind === "daily") return utcDayKey(now);
    if (kind === "weekly") return utcIsoWeekKey(now);
    return utcMonthKey(now);
  }

  function periodLabel(kind, key) {
    if (kind === "daily") return `Day ${key} (UTC)`;
    if (kind === "weekly") return `Week ${key} (UTC)`;
    return `Month ${key} (UTC)`;
  }

  function seedNpc(kind) {
    const key = periodKey(kind);
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    const count = 4 + (hash % 3);
    const entries = [];
    const used = new Set();
    for (let i = 0; i < count; i++) {
      let ni = (hash + i * 17) % NPC_NAMES.length;
      while (used.has(ni)) ni = (ni + 1) % NPC_NAMES.length;
      used.add(ni);
      const base = kind === "daily" ? 4 : kind === "weekly" ? 10 : 18;
      const scoreVal = base + ((hash >> (i * 3)) % 25) + i * 2;
      entries.push({ name: NPC_NAMES[ni], score: scoreVal, isYou: false });
    }
    entries.sort((a, b) => b.score - a.score);
    return entries.slice(0, LB_MAX);
  }

  function loadBoard(kind) {
    const key = periodKey(kind);
    const storageKey = LB_PREFIX + kind;
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(storageKey) || "null");
    } catch (_) {
      raw = null;
    }
    if (!raw || raw.periodKey !== key || !Array.isArray(raw.entries)) {
      const entries = seedNpc(kind);
      const data = { periodKey: key, entries };
      localStorage.setItem(storageKey, JSON.stringify(data));
      return data;
    }
    return raw;
  }

  function saveBoard(kind, data) {
    localStorage.setItem(LB_PREFIX + kind, JSON.stringify(data));
  }

  function upsertPlayerScore(kind, playerScore) {
    const data = loadBoard(kind);
    const entries = data.entries.filter((e) => !e.isYou);
    entries.push({ name: playerName || "You", score: playerScore, isYou: true });
    entries.sort((a, b) => b.score - a.score || (a.isYou ? -1 : 1));
    data.entries = entries.slice(0, LB_MAX);
    const stillYou = data.entries.some((e) => e.isYou);
    if (!stillYou && playerScore > 0) {
      const last = data.entries[data.entries.length - 1];
      if (!last || playerScore >= last.score) {
        data.entries[data.entries.length - 1] = {
          name: playerName || "You",
          score: playerScore,
          isYou: true,
        };
        data.entries.sort((a, b) => b.score - a.score || (a.isYou ? -1 : 1));
      }
    }
    saveBoard(kind, data);
    return data;
  }

  function updateLeaderboardsOnScore(finalScore) {
    if (finalScore <= 0) {
      refreshLeaderboardUI();
      return;
    }
    for (const kind of ["daily", "weekly", "monthly"]) {
      const data = loadBoard(kind);
      const you = data.entries.find((e) => e.isYou);
      const prev = you ? you.score : 0;
      if (finalScore > prev) {
        upsertPlayerScore(kind, finalScore);
      }
    }
    refreshLeaderboardUI();
  }

  // --- Challenges (local / device) ---
  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pickDailyIds(dayKey) {
    const pool = DAILY_CHALLENGE_POOL.slice();
    let h = hashStr("skyHopDaily|" + dayKey);
    // Fisher–Yates with deterministic PRNG
    for (let i = pool.length - 1; i > 0; i--) {
      h = (Math.imul(h, 1103515245) + 12345) >>> 0;
      const j = h % (i + 1);
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, DAILY_CHALLENGE_COUNT).map((c) => c.id);
  }

  function emptyChallengeState(dayKey) {
    return {
      dayKey,
      dailyIds: pickDailyIds(dayKey),
      progress: {},
      claimed: {},
    };
  }

  function loadChallengeState() {
    const dayKey = utcDayKey(new Date());
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(CHALLENGES_KEY) || "null");
    } catch (_) {
      raw = null;
    }
    if (!raw || typeof raw !== "object") {
      const fresh = emptyChallengeState(dayKey);
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify(fresh));
      return fresh;
    }
    if (!raw.progress || typeof raw.progress !== "object") raw.progress = {};
    if (!raw.claimed || typeof raw.claimed !== "object") raw.claimed = {};
    if (raw.dayKey !== dayKey || !Array.isArray(raw.dailyIds) || raw.dailyIds.length === 0) {
      // Roll a new daily set; keep lifetime progress + claimed
      const next = emptyChallengeState(dayKey);
      for (const c of LIFETIME_CHALLENGES) {
        if (raw.progress[c.id] != null) next.progress[c.id] = raw.progress[c.id];
        if (raw.claimed[c.id]) next.claimed[c.id] = true;
      }
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify(next));
      return next;
    }
    // Ensure daily ids still valid
    const nextDaily = raw.dailyIds.filter((id) => CHALLENGE_BY_ID[id] && CHALLENGE_BY_ID[id].kind === "daily");
    if (nextDaily.length !== DAILY_CHALLENGE_COUNT) {
      raw.dailyIds = pickDailyIds(dayKey);
      // Reset progress/claimed for dailies when set is repaired
      for (const id of Object.keys(raw.progress)) {
        if (CHALLENGE_BY_ID[id] && CHALLENGE_BY_ID[id].kind === "daily" && !raw.dailyIds.includes(id)) {
          delete raw.progress[id];
          delete raw.claimed[id];
        }
      }
    } else {
      raw.dailyIds = nextDaily;
    }
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(raw));
    return raw;
  }

  let challengeState = loadChallengeState();
  let activeChallengeTab = "daily";

  function saveChallengeState() {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challengeState));
  }

  function ensureChallengeDay() {
    const dayKey = utcDayKey(new Date());
    if (challengeState.dayKey !== dayKey) {
      challengeState = loadChallengeState();
    }
  }

  function getChallengeProgress(id) {
    return Number(challengeState.progress[id] || 0);
  }

  function setChallengeProgress(id, value) {
    const v = Math.max(0, Math.floor(value));
    const prev = getChallengeProgress(id);
    if (v > prev) {
      challengeState.progress[id] = v;
      return true;
    }
    return false;
  }

  function bumpChallengeProgress(id, amount) {
    if (amount <= 0) return false;
    const next = getChallengeProgress(id) + Math.floor(amount);
    challengeState.progress[id] = next;
    return true;
  }

  function maxChallengeProgress(id, value) {
    return setChallengeProgress(id, Math.max(getChallengeProgress(id), value));
  }

  function isChallengeClaimed(id) {
    return !!challengeState.claimed[id];
  }

  function applyRunToChallenge(def, run) {
    const id = def.id;
    switch (def.type) {
      case "score_run":
      case "pipes_run":
        return maxChallengeProgress(id, run.score);
      case "coins_run":
        return maxChallengeProgress(id, run.coins);
      case "distance_run":
        return maxChallengeProgress(id, run.distance);
      case "runs_day":
      case "runs_total":
        return bumpChallengeProgress(id, 1);
      case "pipes_day":
      case "pipes_total":
        return bumpChallengeProgress(id, run.score);
      case "coins_day":
      case "coins_total":
        return bumpChallengeProgress(id, run.coins);
      case "legendary_run":
        if (run.legendaryOk) return maxChallengeProgress(id, 1);
        return false;
      default:
        return false;
    }
  }

  function updateChallengesOnRunEnd(runStats) {
    ensureChallengeDay();
    let changed = false;
    const activeDaily = challengeState.dailyIds
      .map((id) => CHALLENGE_BY_ID[id])
      .filter(Boolean);
    for (const def of activeDaily) {
      if (applyRunToChallenge(def, runStats)) changed = true;
    }
    for (const def of LIFETIME_CHALLENGES) {
      if (applyRunToChallenge(def, runStats)) changed = true;
    }
    if (changed) saveChallengeState();
    if (challengesPage && !challengesPage.classList.contains("hidden")) {
      renderChallengesList();
    }
  }

  function formatChallengeReward(reward) {
    const parts = [];
    if (reward.coins) parts.push(`+${reward.coins} coins`);
    if (reward.stardust) {
      parts.push(`+${reward.stardust} ${SPECIAL_CURRENCY_NAME}`);
    }
    return parts.join(" · ") || "—";
  }

  function claimChallenge(id) {
    ensureChallengeDay();
    const def = CHALLENGE_BY_ID[id];
    if (!def) return;
    if (def.kind === "daily" && !challengeState.dailyIds.includes(id)) return;
    if (isChallengeClaimed(id)) return;
    const progress = getChallengeProgress(id);
    if (progress < def.target) return;
    challengeState.claimed[id] = true;
    const reward = def.reward || {};
    if (reward.coins) {
      coins += reward.coins;
      persistCoins();
    }
    if (reward.stardust) {
      stardust += reward.stardust;
      persistStardust();
    }
    if (!reward.coins && !reward.stardust) syncCoinHUD();
    saveChallengeState();
    renderChallengesList();
  }

  function challengesForTab(tab) {
    ensureChallengeDay();
    if (tab === "lifetime") return LIFETIME_CHALLENGES.slice();
    return challengeState.dailyIds.map((id) => CHALLENGE_BY_ID[id]).filter(Boolean);
  }

  function renderChallengesList() {
    if (!challengesListEl) return;
    ensureChallengeDay();
    if (challengesPeriodLabel) {
      if (activeChallengeTab === "daily") {
        challengesPeriodLabel.textContent = `Daily · ${challengeState.dayKey} (UTC) · resets at midnight UTC`;
      } else {
        challengesPeriodLabel.textContent = "Lifetime · progress saved on this device";
      }
    }
    const list = challengesForTab(activeChallengeTab);
    challengesListEl.innerHTML = "";
    for (const def of list) {
      const progress = Math.min(getChallengeProgress(def.id), def.target);
      const pct = def.target > 0 ? Math.min(100, (progress / def.target) * 100) : 0;
      const done = getChallengeProgress(def.id) >= def.target;
      const claimed = isChallengeClaimed(def.id);
      const card = document.createElement("article");
      card.className = "challenge-card";
      card.setAttribute("role", "listitem");
      if (done) card.classList.add("complete");
      if (claimed) card.classList.add("claimed");

      const rewardHtml = formatChallengeReward(def.reward || {})
        .replace(SPECIAL_CURRENCY_NAME, `<span class="sd">${SPECIAL_CURRENCY_NAME}</span>`);

      const soft = def.soft
        ? `<span class="challenge-soft">Optional · needs legendary skin</span>`
        : "";

      card.innerHTML =
        `<div class="challenge-card-top">` +
        `<div><h3 class="challenge-title"></h3><p class="challenge-desc"></p>${soft}</div>` +
        `<div class="challenge-reward">${rewardHtml}</div>` +
        `</div>` +
        `<div class="challenge-progress-row">` +
        `<div class="challenge-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>` +
        `<span class="challenge-frac">${progress} / ${def.target}</span>` +
        `</div>` +
        `<div class="challenge-actions"></div>`;

      card.querySelector(".challenge-title").textContent = def.title;
      card.querySelector(".challenge-desc").textContent = def.description;

      const actions = card.querySelector(".challenge-actions");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "challenge-claim";
      if (claimed) {
        btn.textContent = "Completed";
        btn.classList.add("done");
        btn.disabled = true;
      } else if (done) {
        btn.textContent = "Claim";
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          claimChallenge(def.id);
        });
      } else {
        btn.textContent = "In progress";
        btn.disabled = true;
      }
      actions.appendChild(btn);
      challengesListEl.appendChild(card);
    }
  }

  function openChallengesPage() {
    ensureChallengeDay();
    renderChallengesList();
    openPage(challengesPage);
  }

  // --- DOM: leaderboard / promo / ads / shop ---
  const lbList = document.getElementById("lb-list");
  const lbPeriodLabel = document.getElementById("lb-period-label");
  const lbTabs = document.querySelectorAll(".lb-tab");
  const nameInput = document.getElementById("player-name");
  const promoOffer = document.getElementById("promo-offer");
  const promoThanks = document.getElementById("promo-thanks");
  const btnBuyAds = document.getElementById("btn-buy-ads");
  const btnRemoveAds = document.getElementById("btn-remove-ads");
  const btnRank = document.getElementById("btn-rank");
  const removeAdsPage = document.getElementById("remove-ads-page");
  const rankPage = document.getElementById("rank-page");
  const removeAdsBack = document.getElementById("remove-ads-back");
  const rankBack = document.getElementById("rank-back");
  const btnChallenges = document.getElementById("btn-challenges");
  const challengesPage = document.getElementById("challenges-page");
  const challengesBack = document.getElementById("challenges-back");
  const challengesListEl = document.getElementById("challenges-list");
  const challengesPeriodLabel = document.getElementById("challenges-period-label");
  const challengeTabs = document.querySelectorAll(".challenge-tab");
  const btnSettings = document.getElementById("btn-settings");
  const settingsPage = document.getElementById("settings-page");
  const settingsBack = document.getElementById("settings-back");
  const coinBalanceEl = document.getElementById("coin-balance");
  const stardustBalanceEl = document.getElementById("stardust-balance") || document.getElementById("gems-balance");
  const shopCoinBalanceEl = document.getElementById("shop-coin-balance");
  const shopStardustBalanceEl = document.getElementById("shop-stardust-balance") || document.getElementById("shop-gems-balance");
  const btnShop = document.getElementById("btn-shop");
  const shopModal = document.getElementById("shop-modal");
  const shopClose = document.getElementById("shop-close");
  const shopGrid = document.getElementById("shop-grid");
  const shopTabs = document.querySelectorAll(".shop-tab");
  const shopFiltersEl = document.getElementById("shop-filters");
  const shopFilters = document.querySelectorAll(".shop-filter");
  const shopHintEl = document.getElementById("shop-hint");
  const shopLiveEl = document.querySelector(".shop-live");
  const shopLivePreview = document.getElementById("shop-live-preview");
  const shopPreviewLabel = document.getElementById("shop-preview-label");
  const shopMusicPreviewBtn = document.getElementById("shop-music-preview-btn");
  const musicPreviewBar = document.getElementById("music-preview-bar");
  const musicPreviewStatus = document.getElementById("music-preview-status");
  const adOverlay = document.getElementById("ad-overlay");
  const adCountdown = document.getElementById("ad-countdown");
  const adContinue = document.getElementById("ad-continue");
  const checkoutModal = document.getElementById("checkout-modal");
  const checkoutItemEl = document.querySelector(".checkout-item");
  const checkoutPriceEl = document.querySelector(".checkout-price");
  const checkoutCancel = document.getElementById("checkout-cancel");
  const checkoutConfirm = document.getElementById("checkout-confirm");
  let checkoutKind = "ads"; // ads | stardust
  let pendingStardustPack = null;

  let activePeriod = "daily";

  function refreshLeaderboardUI() {
    const data = loadBoard(activePeriod);
    lbPeriodLabel.textContent = periodLabel(activePeriod, data.periodKey);
    lbList.innerHTML = "";
    data.entries.forEach((e, i) => {
      const li = document.createElement("li");
      if (e.isYou) li.classList.add("you");
      li.innerHTML =
        `<span class="lb-rank">${i + 1}</span>` +
        `<span class="lb-name"></span>` +
        `<span class="lb-score">${e.score}</span>`;
      li.querySelector(".lb-name").textContent = e.name;
      lbList.appendChild(li);
    });
  }

  function syncPromoUI() {
    if (adsRemoved) {
      promoOffer.classList.add("hidden");
      promoThanks.classList.remove("hidden");
      if (btnRemoveAds) {
        btnRemoveAds.textContent = "Ads Off";
        btnRemoveAds.classList.add("ads-cleared");
      }
    } else {
      promoOffer.classList.remove("hidden");
      promoThanks.classList.add("hidden");
      if (btnRemoveAds) {
        btnRemoveAds.textContent = "No Ads";
        btnRemoveAds.classList.remove("ads-cleared");
      }
    }
  }

  function syncPromoVisibility() {
    // Frame nav buttons visible on ready + game-over; hidden while playing
    document.body.classList.toggle("ready", state === STATE.READY);
    document.body.classList.toggle("playing", state === STATE.PLAYING);
    document.body.classList.toggle("over", state === STATE.OVER);
    syncBackgroundMusic();
  }

  function openPage(el) {
    if (!el) return;
    el.classList.remove("hidden");
    el.setAttribute("aria-hidden", "false");
  }

  function closePage(el) {
    if (!el) return;
    el.classList.add("hidden");
    el.setAttribute("aria-hidden", "true");
    el.style.display = "";
  }

  function openRemoveAdsPage() {
    syncPromoUI();
    openPage(removeAdsPage);
  }

  function openRankPage() {
    refreshLeaderboardUI();
    openPage(rankPage);
  }

  function openSettingsPage() {
    if (!settingsPage) {
      console.warn("settings-page missing");
      return;
    }
    syncSettingsUI();
    settingsPage.classList.remove("hidden");
    settingsPage.setAttribute("aria-hidden", "false");
    settingsPage.style.display = "flex";
    openPage(settingsPage);
  }

  function syncCoinHUD() {
    const text = String(coins);
    const stardustText = String(stardust);
    if (coinBalanceEl) coinBalanceEl.textContent = text;
    if (shopCoinBalanceEl) shopCoinBalanceEl.textContent = text;
    if (stardustBalanceEl) stardustBalanceEl.textContent = stardustText;
    if (shopStardustBalanceEl) shopStardustBalanceEl.textContent = stardustText;
  }

  function persistCoins() {
    localStorage.setItem(COINS_KEY, String(coins));
    syncCoinHUD();
  }

  function persistStardust() {
    localStorage.setItem(STARDUST_KEY, String(stardust));
    // Never write skyHopGems after migration
    syncCoinHUD();
  }

  function rarityLabel(r) {
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  function priceLabel(item) {
    if (item.price <= 0) return "Free";
    if (item.currency === "gems" || item.currency === "stardust") {
      return `${item.price} ${SPECIAL_CURRENCY_NAME}`;
    }
    return `${item.price} coins`;
  }

  function isStardustCurrency(item) {
    return item.currency === "gems" || item.currency === "stardust";
  }

  function canAfford(item) {
    if (item.price <= 0) return true;
    if (isStardustCurrency(item)) return stardust >= item.price;
    return coins >= item.price;
  }

  function spendForItem(item) {
    if (item.price <= 0) return true;
    if (isStardustCurrency(item)) {
      if (stardust < item.price) return false;
      stardust -= item.price;
      persistStardust();
      return true;
    }
    if (coins < item.price) return false;
    coins -= item.price;
    persistCoins();
    return true;
  }

  function sortByRarity(list) {
    return list.slice().sort((a, b) => {
      const ra = RARITY_ORDER[a.rarity] ?? 9;
      const rb = RARITY_ORDER[b.rarity] ?? 9;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }

  function trailQuality(rarity) {
    if (rarity === "legendary") {
      return { maxPts: 30, width: 13, layers: 3, glow: 1 };
    }
    if (rarity === "epic") {
      return { maxPts: 24, width: 10, layers: 3, glow: 0.88 };
    }
    if (rarity === "rare") {
      return { maxPts: 18, width: 7.5, layers: 2, glow: 0.72 };
    }
    return { maxPts: 12, width: 5, layers: 1, glow: 0.55 };
  }

  function pushLightTrailPoint(list, x, y, trail, drift) {
    const q = trailQuality(trail.rarity || "common");
    const d = drift == null ? pipeSpeed * 0.85 : drift;
    for (let i = 0; i < list.length; i++) {
      list[i].x -= d;
    }
    list.push({ x, y });
    while (list.length > q.maxPts) list.shift();
  }

  function seedShopLightTrail(list, trail, cx, cy) {
    list.length = 0;
    const q = trailQuality(trail.rarity || "common");
    for (let i = 0; i < q.maxPts; i++) {
      const t = i / Math.max(1, q.maxPts - 1);
      list.push({
        x: cx - (1 - t) * (q.maxPts * 3.2),
        y: cy + Math.sin(t * Math.PI * 2.2) * 6 * (1 - t),
      });
    }
  }

  function drawLightTrail(c, list, trail) {
    if (!list || list.length < 2 || !trail) return;
    const q = trailQuality(trail.rarity || "common");
    const n = list.length;
    const color = trail.color || "#e9c46a";
    const accent = trail.accent || color;

    const layers = [];
    if (q.layers >= 1) {
      layers.push({ wMul: 1, aMul: q.layers === 1 ? 0.42 : 0.18, col: accent });
    }
    if (q.layers >= 2) {
      layers.push({ wMul: 0.55, aMul: 0.4, col: color });
    }
    if (q.layers >= 3) {
      layers.push({ wMul: 0.22, aMul: 0.75, col: "#ffffff" });
    }

    c.save();
    c.lineCap = "round";
    c.lineJoin = "round";
    c.globalCompositeOperation = "lighter";

    for (const layer of layers) {
      for (let i = 1; i < n; i++) {
        const t = i / (n - 1);
        const fade = t * t;
        const a = fade * layer.aMul * q.glow;
        if (a < 0.02) continue;
        const w = q.width * layer.wMul * (0.2 + 0.8 * t);
        c.globalAlpha = Math.min(1, a);
        c.strokeStyle = layer.col;
        c.lineWidth = w;
        c.beginPath();
        c.moveTo(list[i - 1].x, list[i - 1].y);
        c.lineTo(list[i].x, list[i].y);
        c.stroke();
      }
    }

    const tip = list[n - 1];
    const tipR = q.width * (0.35 + 0.15 * q.layers);
    c.globalAlpha = 0.35 * q.glow;
    c.fillStyle = color;
    c.beginPath();
    c.arc(tip.x, tip.y, tipR, 0, Math.PI * 2);
    c.fill();
    if (q.layers >= 2) {
      c.globalAlpha = 0.25 * q.glow;
      c.fillStyle = accent;
      c.beginPath();
      c.arc(tip.x, tip.y, tipR * 1.6, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  }

  function persistRuns() {
    localStorage.setItem(RUNS_KEY, String(runsSinceAd));
  }

  function persistAdsRemoved() {
    localStorage.setItem(ADS_REMOVED_KEY, adsRemoved ? "1" : "0");
  }

  function setCheckoutUI(itemLabel, priceLabel, confirmLabel) {
    if (checkoutItemEl) checkoutItemEl.textContent = itemLabel;
    if (checkoutPriceEl) checkoutPriceEl.textContent = priceLabel;
    if (checkoutConfirm) checkoutConfirm.textContent = confirmLabel;
  }

  function openCheckoutAds() {
    if (adsRemoved) return;
    checkoutKind = "ads";
    pendingStardustPack = null;
    setCheckoutUI("Remove ads — Sky Hop", "£1.99 GBP", "Confirm £1.99");
    checkoutModal.classList.remove("hidden");
    checkoutModal.setAttribute("aria-hidden", "false");
  }

  function openCheckoutStardustPack(pack) {
    checkoutKind = "stardust";
    pendingStardustPack = pack;
    setCheckoutUI(
      `${pack.label} — Sky Hop`,
      `£${pack.priceGbp} GBP`,
      `Confirm £${pack.priceGbp}`
    );
    checkoutModal.classList.remove("hidden");
    checkoutModal.setAttribute("aria-hidden", "false");
  }

  function openCheckout() {
    openCheckoutAds();
  }

  function renderStardustPacks() {
    shopGrid.innerHTML = "";
    const intro = document.createElement("div");
    intro.className = "shop-section-header rarity-legendary";
    intro.innerHTML =
      `<span class="shop-section-title">Stardust Packs</span>` +
      `<span class="shop-section-count">${STARDUST_PACKS.length} packs</span>`;
    shopGrid.appendChild(intro);
    const wrap = document.createElement("div");
    wrap.className = "stardust-packs";
    shopGrid.appendChild(wrap);
    for (const pack of STARDUST_PACKS) {
      const card = document.createElement("article");
      card.className = "stardust-pack-card";
      card.innerHTML =
        `<div class="stardust-pack-icon" aria-hidden="true"></div>` +
        `<p class="stardust-pack-amount">${pack.amount} Stardust</p>` +
        `<p class="stardust-pack-price">£${pack.priceGbp} <span>GBP</span></p>` +
        `<p class="stardust-pack-note">Simulated purchase — no real payment.</p>`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "promo-btn stardust-pack-btn";
      btn.textContent = `Buy · £${pack.priceGbp}`;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openCheckoutStardustPack(pack);
      });
      card.appendChild(btn);
      wrap.appendChild(card);
    }
  }

  nameInput.value = playerName;
  nameInput.addEventListener("change", () => {
    playerName = (nameInput.value.trim() || "You").slice(0, 16);
    nameInput.value = playerName;
    localStorage.setItem(NAME_KEY, playerName);
    for (const kind of ["daily", "weekly", "monthly"]) {
      const data = loadBoard(kind);
      let changed = false;
      for (const e of data.entries) {
        if (e.isYou) {
          e.name = playerName;
          changed = true;
        }
      }
      if (changed) saveBoard(kind, data);
    }
    refreshLeaderboardUI();
  });

  lbTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activePeriod = tab.dataset.period;
      lbTabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      refreshLeaderboardUI();
    });
  });

  btnBuyAds.addEventListener("click", openCheckout);
  if (btnRemoveAds) {
    btnRemoveAds.addEventListener("click", (e) => {
      e.stopPropagation();
      openRemoveAdsPage();
    });
  }
  if (btnRank) {
    btnRank.addEventListener("click", (e) => {
      e.stopPropagation();
      openRankPage();
    });
  }
  if (removeAdsBack) {
    removeAdsBack.addEventListener("click", () => closePage(removeAdsPage));
  }
  if (rankBack) {
    rankBack.addEventListener("click", () => closePage(rankPage));
  }
  if (removeAdsPage) {
    removeAdsPage.addEventListener("click", (e) => {
      if (e.target === removeAdsPage) closePage(removeAdsPage);
    });
  }
  if (rankPage) {
    rankPage.addEventListener("click", (e) => {
      if (e.target === rankPage) closePage(rankPage);
    });
  }
  if (btnChallenges) {
    btnChallenges.addEventListener("click", (e) => {
      e.stopPropagation();
      openChallengesPage();
    });
  }
  if (challengesBack) {
    challengesBack.addEventListener("click", () => closePage(challengesPage));
  }
  if (challengesPage) {
    challengesPage.addEventListener("click", (e) => {
      if (e.target === challengesPage) closePage(challengesPage);
    });
  }
  challengeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeChallengeTab = tab.dataset.challengeTab || "daily";
      challengeTabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      renderChallengesList();
    });
  });

  function handleOpenSettings(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    }
    resumeMusicOnGesture();
    playSfx("ui");
    openSettingsPage();
  }
  window.__skyHopOpenSettings = handleOpenSettings;
  if (btnSettings) {
    btnSettings.onclick = handleOpenSettings;
    btnSettings.addEventListener("click", handleOpenSettings);
    btnSettings.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        handleOpenSettings(e);
      },
      { passive: false }
    );
  }
  if (settingsBack) {
    settingsBack.addEventListener("click", () => {
      playSfx("ui");
      closePage(settingsPage);
    });
  }
  if (settingsPage) {
    settingsPage.addEventListener("click", (e) => {
      if (e.target === settingsPage) closePage(settingsPage);
    });
  }

  checkoutCancel.addEventListener("click", () => {
    pendingStardustPack = null;
    checkoutKind = "ads";
    checkoutModal.classList.add("hidden");
    checkoutModal.setAttribute("aria-hidden", "true");
  });

  checkoutConfirm.addEventListener("click", () => {
    if (checkoutKind === "stardust" && pendingStardustPack) {
      stardust += pendingStardustPack.amount;
      persistStardust();
      pendingStardustPack = null;
      checkoutKind = "ads";
      checkoutModal.classList.add("hidden");
      checkoutModal.setAttribute("aria-hidden", "true");
      if (shopModal && !shopModal.classList.contains("hidden")) renderShop();
      return;
    }
    adsRemoved = true;
    persistAdsRemoved();
    runsSinceAd = 0;
    persistRuns();
    checkoutModal.classList.add("hidden");
    checkoutModal.setAttribute("aria-hidden", "true");
    syncPromoUI();
  });

  // --- Shop UI ---
  function drawSkinPreview(c, skin, map, trailList, wingPhase, trail) {
    const pctx = c.getContext("2d");
    const pw = c.width;
    const ph = c.height;
    pctx.clearRect(0, 0, pw, ph);
    const theme = map || getEquippedMap();
    const g = pctx.createLinearGradient(0, 0, 0, ph);
    g.addColorStop(0, theme.skyTop);
    g.addColorStop(1, theme.skyBot);
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, pw, ph);
    // mini ground strip
    pctx.fillStyle = theme.ground;
    pctx.fillRect(0, ph - 14, pw, 14);
    pctx.fillStyle = theme.pipe;
    pctx.fillRect(pw - 28, 8, 12, ph - 28);
    pctx.fillRect(8, 18, 10, ph - 38);
    if (trailList && trailList.length && trail) drawLightTrail(pctx, trailList, trail);
    pctx.save();
    pctx.translate(pw / 2 + 8, ph / 2);
    pctx.scale(1.05, 1.05);
    drawBirdOn(pctx, skin, wingPhase || 0, true);
    pctx.restore();
  }

  function drawMusicPreview(c, track) {
    const pctx = c.getContext("2d");
    const pw = c.width;
    const ph = c.height;
    pctx.clearRect(0, 0, pw, ph);
    const g = pctx.createLinearGradient(0, 0, 0, ph);
    g.addColorStop(0, "#0f172a");
    g.addColorStop(1, "#1e293b");
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, pw, ph);
    const color = track.color || "#e9c46a";
    const accent = track.accent || color;
    const vibe = track.vibe || MUSIC_VIBES.coral;
    const bars = 12;
    const gap = 3;
    const barW = (pw - 20 - gap * (bars - 1)) / bars;
    for (let i = 0; i < bars; i++) {
      const n = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.85 + vibe.root * 0.02));
      const h = 10 + n * (ph - 28);
      const x = 10 + i * (barW + gap);
      const y = (ph - h) / 2;
      pctx.fillStyle = i % 2 === 0 ? color : accent;
      pctx.globalAlpha = 0.55 + n * 0.4;
      pctx.fillRect(x, y, barW, h);
    }
    pctx.globalAlpha = 1;
    pctx.fillStyle = "rgba(255,255,255,0.85)";
    pctx.font = "bold 10px system-ui,sans-serif";
    pctx.textAlign = "center";
    pctx.fillText("♪ " + (vibe.style || "loop"), pw / 2, ph - 6);
  }

  function drawMusicLivePreview(c, track) {
    const pctx = c.getContext("2d");
    const pw = c.width;
    const ph = c.height;
    pctx.clearRect(0, 0, pw, ph);
    const g = pctx.createLinearGradient(0, 0, pw, ph);
    g.addColorStop(0, "#0b1224");
    g.addColorStop(1, "#1a1030");
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, pw, ph);
    const color = track.color || "#e9c46a";
    const accent = track.accent || color;
    const vibe = track.vibe || MUSIC_VIBES.coral;
    const bars = 16;
    const gap = 3;
    const barW = (pw - 24 - gap * (bars - 1)) / bars;
    for (let i = 0; i < bars; i++) {
      const pulse = 0.35 + 0.65 * Math.abs(Math.sin(frames * 0.18 + i * 0.55));
      const h = 12 + pulse * (ph - 36);
      const x = 12 + i * (barW + gap);
      const y = ph - 14 - h;
      pctx.fillStyle = i % 3 === 0 ? accent : color;
      pctx.globalAlpha = 0.45 + pulse * 0.5;
      pctx.fillRect(x, y, barW, h);
    }
    pctx.globalAlpha = 1;
    pctx.fillStyle = "rgba(255,255,255,0.9)";
    pctx.font = "bold 11px system-ui,sans-serif";
    pctx.textAlign = "center";
    pctx.fillText(track.name + " · " + Math.round(vibe.bpm) + " BPM", pw / 2, 14);
  }

  function drawTrailPreview(c, trail) {
    const pctx = c.getContext("2d");
    const pw = c.width;
    const ph = c.height;
    pctx.clearRect(0, 0, pw, ph);
    const g = pctx.createLinearGradient(0, 0, 0, ph);
    g.addColorStop(0, "#0f172a");
    g.addColorStop(1, "#1e293b");
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, pw, ph);
    const pts = [];
    seedShopLightTrail(pts, trail, pw * 0.72, ph * 0.5);
    drawLightTrail(pctx, pts, trail);
    pctx.save();
    pctx.translate(pw * 0.72, ph * 0.5);
    pctx.scale(0.7, 0.7);
    drawBirdOn(pctx, getEquippedSkin(), 0, true);
    pctx.restore();
  }

  function drawMapPreview(c, map) {
    const pctx = c.getContext("2d");
    const pw = c.width;
    const ph = c.height;
    pctx.clearRect(0, 0, pw, ph);
    const g = pctx.createLinearGradient(0, 0, 0, ph);
    g.addColorStop(0, map.skyTop);
    g.addColorStop(1, map.skyBot);
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, pw, ph);
    pctx.fillStyle = map.sun;
    pctx.beginPath();
    pctx.arc(pw - 28, 18, 10, 0, Math.PI * 2);
    pctx.fill();
    pctx.fillStyle = map.hill1;
    pctx.beginPath();
    pctx.moveTo(0, ph - 18);
    pctx.quadraticCurveTo(pw * 0.3, ph - 40, pw * 0.55, ph - 20);
    pctx.lineTo(pw, ph - 18);
    pctx.lineTo(pw, ph);
    pctx.lineTo(0, ph);
    pctx.fill();
    pctx.fillStyle = map.pipe;
    pctx.fillRect(22, 10, 14, ph - 34);
    pctx.fillRect(pw - 40, 22, 14, ph - 46);
    pctx.fillStyle = map.pipeRim;
    pctx.fillRect(18, ph - 30, 22, 6);
    pctx.fillRect(pw - 44, 22, 22, 6);
    pctx.fillStyle = map.ground;
    pctx.fillRect(0, ph - 12, pw, 12);
  }

  function syncShopChrome() {
    const isCurrencyTab = shopTab === "stardust";
    shopTabs.forEach((t) => {
      const on = t.dataset.tab === shopTab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      const kind = t.dataset.tab;
      if (kind === "stardust") {
        t.textContent = "Stardust";
      } else if (kind === "maps") {
        t.textContent = `Maps (${MAPS.length})`;
      } else if (kind === "trails") {
        t.textContent = `Light Trails (${TRAILS.length})`;
      } else if (kind === "music") {
        t.textContent = `Music (${MUSIC.length})`;
      } else {
        t.textContent = `Character Skins (${SKINS.length})`;
      }
    });
    // Rarity filters removed from UI — shop uses named rarity sections only
    if (shopFiltersEl) {
      shopFiltersEl.classList.add("hidden");
      shopFiltersEl.hidden = true;
    }
    if (shopLiveEl) shopLiveEl.classList.toggle("hidden", isCurrencyTab);
    const showMusicPreview = !isCurrencyTab && shopTab === "music";
    if (musicPreviewBar) {
      musicPreviewBar.classList.toggle("hidden", !showMusicPreview);
      musicPreviewBar.hidden = !showMusicPreview;
    }
    if (shopMusicPreviewBtn) {
      shopMusicPreviewBtn.classList.toggle("hidden", !showMusicPreview);
      shopMusicPreviewBtn.hidden = !showMusicPreview;
    }
    if (shopHintEl) {
      shopHintEl.innerHTML = isCurrencyTab
        ? "Purchase <strong>Stardust</strong> packs here. Stardust unlocks Legendary skins, maps, trails &amp; music."
        : shopTab === "maps"
          ? "Map themes grouped by rarity. Coins unlock Common–Epic; <strong>Stardust</strong> unlocks Legendaries."
          : shopTab === "trails"
            ? "Light trails grouped by rarity. Equip independently of your skin. Legendaries need <strong>Stardust</strong>."
            : shopTab === "music"
              ? "Tap <strong>Preview</strong> to audition any track before buying — locked tracks included. Equip for background music. Legendaries need <strong>Stardust</strong>."
              : "Character skins grouped by rarity. Coins unlock Common–Epic; <strong>Stardust</strong> unlocks Legendaries.";
    }
  }

  function updateShopLivePreview() {
    if (!shopLivePreview) return;
    const skin = SKIN_BY_ID[shopPreviewSkinId] || getEquippedSkin();
    const map = MAP_BY_ID[shopPreviewMapId] || getEquippedMap();
    const trail = TRAIL_BY_ID[shopPreviewTrailId] || getEquippedTrail();
    const music = MUSIC_BY_ID[shopPreviewMusicId] || getEquippedMusic();
    const cx = shopLivePreview.width / 2 + 8;
    const cy = shopLivePreview.height / 2 + Math.sin(frames * 0.12) * 4;
    if (shopPreviewLabel) {
      if (shopTab === "stardust") {
        shopPreviewLabel.textContent = "Stardust packs";
      } else if (shopTab === "maps") {
        shopPreviewLabel.textContent = `Map: ${map.name} · ${rarityLabel(map.rarity)}`;
      } else if (shopTab === "trails") {
        shopPreviewLabel.textContent = `Trail: ${trail.name} · ${rarityLabel(trail.rarity)}`;
      } else if (shopTab === "music") {
        shopPreviewLabel.textContent = `Music: ${music.name} · ${rarityLabel(music.rarity)} · preview`;
      } else {
        shopPreviewLabel.textContent = `Skin: ${skin.name} · ${rarityLabel(skin.rarity)}`;
      }
    }
    if (shopTab === "music") {
      drawMusicLivePreview(shopLivePreview, music);
      return;
    }
    pushLightTrailPoint(shopTrailPoints, cx, cy, trail, 2.4);
    drawSkinPreview(
      shopLivePreview,
      skin,
      map,
      shopTrailPoints,
      Math.sin(frames * 0.25),
      trail
    );
  }

  function appendShopCard(item, kind) {
    const isMap = kind === "maps";
    const isTrail = kind === "trails";
    const isMusic = kind === "music";
    const owned = isMap
      ? ownedMaps.includes(item.id)
      : isTrail
        ? ownedTrails.includes(item.id)
        : isMusic
          ? ownedMusic.includes(item.id)
          : ownedSkins.includes(item.id);
    const equipped = isMap
      ? equippedMapId === item.id
      : isTrail
        ? equippedTrailId === item.id
        : isMusic
          ? equippedMusicId === item.id
          : equippedSkinId === item.id;
    const card = document.createElement("article");
    card.className =
      "skin-card rarity-" +
      item.rarity +
      (equipped ? " equipped" : "") +
      (owned ? "" : " locked");
    card.dataset.id = item.id;

    const badge = document.createElement("span");
    badge.className = "rarity-badge rarity-" + item.rarity;
    badge.textContent = rarityLabel(item.rarity);

    const preview = document.createElement("canvas");
    preview.className = "skin-preview";
    preview.width = 140;
    preview.height = 72;
    preview.setAttribute("aria-hidden", "true");

    const nameEl = document.createElement("div");
    nameEl.className = "skin-name";
    nameEl.textContent = item.name;

    const meta = document.createElement("div");
    meta.className = "skin-meta";
    if (owned) {
      meta.innerHTML = equipped
        ? '<span class="skin-price">Equipped</span>'
        : "<span>Owned</span>";
    } else {
      const curClass = isStardustCurrency(item) ? "skin-price stardust" : "skin-price";
      meta.innerHTML = `<span class="${curClass}">${priceLabel(item)}</span>`;
    }

    const actions = document.createElement("div");
    actions.className = "skin-actions";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "skin-btn";

    const selectPreview = () => {
      if (isMap) shopPreviewMapId = item.id;
      else if (isTrail) {
        shopPreviewTrailId = item.id;
        shopTrailPoints = [];
      } else if (isMusic) {
        auditionMusicTrack(item.id, "select");
        return;
      } else shopPreviewSkinId = item.id;
      updateShopLivePreview();
    };
    card.addEventListener("click", selectPreview);

    if (isMusic) {
      const previewBtn = document.createElement("button");
      previewBtn.type = "button";
      previewBtn.className = "skin-btn preview";
      previewBtn.textContent = "▶ Preview";
      const playThis = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        auditionMusicTrack(item.id, "button");
      };
      previewBtn.addEventListener("click", playThis);
      previewBtn.addEventListener("touchend", playThis, { passive: false });
      previewBtn.addEventListener("pointerup", playThis);
      actions.appendChild(previewBtn);
    }

    if (equipped) {
      btn.classList.add("equipped");
      btn.textContent = "Equipped";
      btn.disabled = true;
    } else if (owned) {
      btn.classList.add("equip");
      btn.textContent = "Equip";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isMap) {
          equippedMapId = item.id;
          persistEquippedMap();
          applyMapPalette(getEquippedMap());
          shopPreviewMapId = item.id;
        } else if (isTrail) {
          equippedTrailId = item.id;
          persistEquippedTrail();
          shopPreviewTrailId = item.id;
          trailPoints = [];
          shopTrailPoints = [];
        } else if (isMusic) {
          equippedMusicId = item.id;
          persistEquippedMusic();
          shopPreviewMusicId = item.id;
          resumeMusicOnGesture();
          syncBackgroundMusic();
        } else {
          equippedSkinId = item.id;
          persistEquippedSkin();
          shopPreviewSkinId = item.id;
        }
        renderShop();
      });
    } else {
      btn.classList.add("buy");
      if (isStardustCurrency(item)) btn.classList.add("buy-stardust");
      const afford = canAfford(item);
      btn.textContent = afford
        ? "Buy"
        : isStardustCurrency(item)
          ? "Need Stardust"
          : "Need coins";
      btn.disabled = !afford;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!canAfford(item)) return;
        if (isMap && ownedMaps.includes(item.id)) return;
        if (isTrail && ownedTrails.includes(item.id)) return;
        if (isMusic && ownedMusic.includes(item.id)) return;
        if (!isMap && !isTrail && !isMusic && ownedSkins.includes(item.id)) return;
        if (!spendForItem(item)) return;
        if (isMap) {
          ownedMaps.push(item.id);
          persistOwnedMaps();
          equippedMapId = item.id;
          persistEquippedMap();
          applyMapPalette(getEquippedMap());
          shopPreviewMapId = item.id;
        } else if (isTrail) {
          ownedTrails.push(item.id);
          persistOwnedTrails();
          equippedTrailId = item.id;
          persistEquippedTrail();
          shopPreviewTrailId = item.id;
          trailPoints = [];
          shopTrailPoints = [];
        } else if (isMusic) {
          ownedMusic.push(item.id);
          persistOwnedMusic();
          equippedMusicId = item.id;
          persistEquippedMusic();
          shopPreviewMusicId = item.id;
          resumeMusicOnGesture();
          syncBackgroundMusic();
        } else {
          ownedSkins.push(item.id);
          persistOwnedSkins();
          equippedSkinId = item.id;
          persistEquippedSkin();
          shopPreviewSkinId = item.id;
        }
        renderShop();
      });
    }

    actions.appendChild(btn);
    card.appendChild(badge);
    card.appendChild(preview);
    card.appendChild(nameEl);
    card.appendChild(meta);
    card.appendChild(actions);
    shopGrid.appendChild(card);
    if (isMap) drawMapPreview(preview, item);
    else if (isTrail) drawTrailPreview(preview, item);
    else if (isMusic) drawMusicPreview(preview, item);
    else drawSkinPreview(preview, item, MAP_BY_ID[item.id] || getEquippedMap(), null, 0, null);
  }

  function renderShop() {
    shopGrid.innerHTML = "";
    syncCoinHUD();
    syncShopChrome();
    if (shopTab === "stardust") {
      renderStardustPacks();
      return;
    }
    const catalog =
      shopTab === "maps"
        ? MAPS
        : shopTab === "trails"
          ? TRAILS
          : shopTab === "music"
            ? MUSIC
            : SKINS;
    const kind =
      shopTab === "maps"
        ? "maps"
        : shopTab === "trails"
          ? "trails"
          : shopTab === "music"
            ? "music"
            : "skins";
    let items = sortByRarity(catalog);
    if (shopRarityFilter !== "all") {
      items = items.filter((it) => it.rarity === shopRarityFilter);
    }

    const kindNoun =
      kind === "maps"
        ? "Maps"
        : kind === "trails"
          ? "Light Trails"
          : kind === "music"
            ? "Music"
            : "Character Skins";
    // Always show rarity sections with category-aware titles (no separate filter UI)
    shopRarityFilter = "all";
    for (const rarity of RARITY_SECTIONS) {
      const group = items.filter((it) => it.rarity === rarity);
      if (!group.length) continue;
      const header = document.createElement("div");
      header.className = "shop-section-header rarity-" + rarity;
      header.innerHTML =
        `<span class="shop-section-title">${rarityLabel(rarity)} ${kindNoun}</span>` +
        `<span class="shop-section-count">${group.length}</span>`;
      shopGrid.appendChild(header);
      for (const item of group) {
        appendShopCard(item, kind);
      }
    }
    updateShopLivePreview();
  }

  function openShop() {
    shopPreviewSkinId = equippedSkinId;
    shopPreviewMapId = equippedMapId;
    shopPreviewTrailId = equippedTrailId;
    shopPreviewMusicId = equippedMusicId;
    shopTrailPoints = [];
    resumeMusicOnGesture();
    renderShop();
    shopModal.classList.remove("hidden");
    shopModal.setAttribute("aria-hidden", "false");
    syncBackgroundMusic();
    if (shopPreviewAnimId) cancelAnimationFrame(shopPreviewAnimId);
    const tick = () => {
      if (shopModal.classList.contains("hidden")) return;
      frames++;
      updateShopLivePreview();
      shopPreviewAnimId = requestAnimationFrame(tick);
    };
    shopPreviewAnimId = requestAnimationFrame(tick);
  }

  function closeShop() {
    shopModal.classList.add("hidden");
    shopModal.setAttribute("aria-hidden", "true");
    if (shopPreviewAnimId) {
      cancelAnimationFrame(shopPreviewAnimId);
      shopPreviewAnimId = 0;
    }
    syncBackgroundMusic();
  }

  btnShop.addEventListener("click", (e) => {
    e.stopPropagation();
    resumeMusicOnGesture();
    playSfx("ui");
    openShop();
  });
  if (shopMusicPreviewBtn) {
    const playSelected = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      auditionMusicTrack(shopPreviewMusicId || equippedMusicId, "bar");
    };
    shopMusicPreviewBtn.addEventListener("click", playSelected);
    shopMusicPreviewBtn.addEventListener("touchend", playSelected, { passive: false });
    shopMusicPreviewBtn.addEventListener("pointerup", playSelected);
  }
  shopClose.addEventListener("click", closeShop);
  shopModal.addEventListener("click", (e) => {
    if (e.target === shopModal) closeShop();
  });
  shopTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      shopTab = tab.dataset.tab;
      shopTrailPoints = [];
      resumeMusicOnGesture();
      renderShop();
      syncBackgroundMusic();
    });
  });
  shopFilters.forEach((btn) => {
    btn.addEventListener("click", () => {
      shopRarityFilter = btn.dataset.rarity;
      renderShop();
    });
  });

  (function wireSettingsControls() {
    const vib = document.getElementById("settings-vibration");
    const sfx = document.getElementById("settings-sfx");
    const music = document.getElementById("settings-music");
    const vol = document.getElementById("settings-music-volume");
    if (vib) {
      vib.addEventListener("change", () => {
        resumeMusicOnGesture();
        setVibrationEnabled(vib.checked);
        if (vib.checked) vibratePulse(12);
        playSfx("ui");
      });
    }
    if (sfx) {
      sfx.addEventListener("change", () => {
        resumeMusicOnGesture();
        setSfxEnabled(sfx.checked);
        if (sfx.checked) playSfx("ui");
      });
    }
    if (music) {
      music.addEventListener("change", () => {
        resumeMusicOnGesture();
        setMusicEnabled(music.checked);
        playSfx("ui");
      });
    }
    if (vol) {
      vol.addEventListener("input", (e) => {
        e.stopPropagation();
        resumeMusicOnGesture();
        setMusicVolume(Number(vol.value) / 100);
        if (musicMuted && musicVolume > 0) setMusicMuted(false);
        else syncBackgroundMusic();
      });
      vol.addEventListener("click", (e) => e.stopPropagation());
      vol.addEventListener("mousedown", (e) => e.stopPropagation());
      vol.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    }
    syncSettingsUI();
  })();

  // First user gesture unlocks AudioContext (mobile browsers)
  window.addEventListener("pointerdown", resumeMusicOnGesture, { once: false, passive: true });
  window.addEventListener("keydown", resumeMusicOnGesture, { once: false });

  function showAdThen(callback) {
    adBlocking = true;
    pendingStartAfterAd = false;
    adOverlay.classList.remove("hidden");
    adOverlay.setAttribute("aria-hidden", "false");
    adContinue.disabled = true;
    let left = AD_COUNTDOWN_SEC;
    adCountdown.textContent = `Continue in ${left}…`;
    const tick = setInterval(() => {
      left--;
      if (left > 0) {
        adCountdown.textContent = `Continue in ${left}…`;
      } else {
        clearInterval(tick);
        adCountdown.textContent = "Ready";
        adContinue.disabled = false;
      }
    }, 1000);

    const onContinue = () => {
      adContinue.removeEventListener("click", onContinue);
      clearInterval(tick);
      adOverlay.classList.add("hidden");
      adOverlay.setAttribute("aria-hidden", "true");
      adBlocking = false;
      runsSinceAd = 0;
      persistRuns();
      if (typeof callback === "function") callback();
    };
    adContinue.addEventListener("click", onContinue);
  }

  function needsAdGate() {
    return !adsRemoved && runsSinceAd >= AD_EVERY_N_RUNS;
  }

  // Ensure boards exist / rollover on load
  loadBoard("daily");
  loadBoard("weekly");
  loadBoard("monthly");
  refreshLeaderboardUI();
  syncPromoUI();
  syncCoinHUD();
  persistOwnedSkins();
  persistEquippedSkin();
  persistOwnedTrails();
  persistEquippedTrail();
  persistOwnedMusic();
  persistEquippedMusic();
  syncSettingsUI();

  function resetGame() {
    state = STATE.READY;
    score = 0;
    frames = 0;
    pipeSpeed = PIPE_SPEED_BASE;
    pipeGap = PIPE_GAP_BASE;
    runDistance = 0;
    coinsEarnedThisRun = 0;
    stardustEarnedThisRun = 0;
    trailPoints = [];
    bird.x = BIRD_X;
    bird.y = H / 2 - 20;
    bird.vy = 0;
    bird.rot = 0;
    bird.wing = 0;
    pipes = [];
    particles = [];
    groundOffset = 0;
    skyOffset = 0;
    flash = 0;
    overTimer = 0;
    spawnPipe(W + 40);
    spawnPipe(W + 40 + PIPE_SPACING);
    spawnPipe(W + 40 + PIPE_SPACING * 2);
    syncPromoVisibility();
  }

  function spawnPipe(x) {
    const margin = 50;
    const usable = H - GROUND_H - margin * 2 - pipeGap;
    const top = margin + Math.random() * Math.max(20, usable);
    pipes.push({
      x,
      top,
      gap: pipeGap,
      scored: false,
    });
  }

  function tryStartPlay() {
    if (adBlocking) return;
    state = STATE.PLAYING;
    syncPromoVisibility();
  }

  function flap() {
    resumeMusicOnGesture();
    if (adBlocking) return;
    if (!shopModal.classList.contains("hidden")) return;
    if (removeAdsPage && !removeAdsPage.classList.contains("hidden")) return;
    if (rankPage && !rankPage.classList.contains("hidden")) return;
    if (challengesPage && !challengesPage.classList.contains("hidden")) return;
    if (settingsPage && !settingsPage.classList.contains("hidden")) return;
    if (!checkoutModal.classList.contains("hidden")) return;
    if (state === STATE.OVER) {
      if (overTimer > 20) {
        resetGame();
      }
      return;
    }
    if (state === STATE.READY) {
      tryStartPlay();
      if (state !== STATE.PLAYING) return;
    }
    bird.vy = FLAP;
    bird.wing = 8;
    playSfx("flap");
    vibratePulse(10);
    const skin = getEquippedSkin();
    const pColor = skin.trail || skin.accent || skin.belly;
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: bird.x - 6,
        y: bird.y + 4,
        vx: -1.5 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 2.5,
        life: 18 + Math.random() * 10,
        max: 28,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? pColor : skin.accent || C.accent,
      });
    }
  }

  function onPointer(e) {
    const path = typeof e.composedPath === "function" ? e.composedPath() : [];
    for (const n of path) {
      if (!n || !n.id) continue;
      if (
        n.id === "btn-settings" ||
        n.id === "btn-shop" ||
        n.id === "btn-rank" ||
        n.id === "btn-challenges" ||
        n.id === "btn-remove-ads" ||
        n.id === "currency-hud"
      ) {
        return;
      }
      if (n.classList && (n.classList.contains("frame-rail") || n.classList.contains("frame-nav"))) return;
    }
    e.preventDefault();
    flap();
  }

  function onKey(e) {
    if (e.code === "Space" || e.code === "ArrowUp" || e.key === " ") {
      e.preventDefault();
      flap();
    }
    if (e.code === "Escape") {
      closeShop();
      if (challengesPage) closePage(challengesPage);
      if (rankPage) closePage(rankPage);
      if (removeAdsPage) closePage(removeAdsPage);
      if (settingsPage) closePage(settingsPage);
    }
  }

  canvas.addEventListener("mousedown", onPointer);
  canvas.addEventListener("touchstart", onPointer, { passive: false });
  window.addEventListener("keydown", onKey);

  function update() {
    frames++;
    groundOffset = (groundOffset + (state === STATE.PLAYING ? pipeSpeed : pipeSpeed * 0.35)) % 48;
    skyOffset = (skyOffset + (state === STATE.PLAYING ? 0.35 : 0.12)) % W;

    if (bird.wing > 0) bird.wing--;

    if (flash > 0) flash--;

    if (state === STATE.READY) {
      bird.y = H / 2 - 20 + Math.sin(frames * 0.08) * 8;
      bird.rot = Math.sin(frames * 0.08) * 0.12;
      pushLightTrailPoint(trailPoints, bird.x - 6, bird.y, getEquippedTrail(), 2.2);
      return;
    }

    if (state === STATE.OVER) {
      overTimer++;
      bird.vy = Math.min(bird.vy + GRAVITY, MAX_FALL);
      bird.y += bird.vy;
      bird.rot = Math.min(Math.PI / 2, bird.rot + 0.08);
      const floor = H - GROUND_H - BIRD_R;
      if (bird.y > floor) bird.y = floor;
      for (let i = 0; i < trailPoints.length; i++) trailPoints[i].x -= pipeSpeed * 0.35;
      while (trailPoints.length > 2 && trailPoints[0].x < -40) trailPoints.shift();
      updateParticles();
      return;
    }

    // playing
    bird.vy = Math.min(bird.vy + GRAVITY, MAX_FALL);
    bird.y += bird.vy;
    const targetRot = bird.vy < 0 ? -0.45 : Math.min(1.1, bird.vy * 0.09);
    bird.rot += (targetRot - bird.rot) * 0.25;

    pipeSpeed = PIPE_SPEED_BASE + Math.min(1.6, score * 0.04);
    pipeGap = Math.max(100, PIPE_GAP_BASE - Math.min(28, score * 0.6));

    runDistance += pipeSpeed;

    for (const p of pipes) {
      p.x -= pipeSpeed;
      if (!p.scored && p.x + PIPE_WIDTH < bird.x) {
        p.scored = true;
        score++;
        if (score > best) {
          best = score;
          localStorage.setItem(BEST_KEY, String(best));
        }
      }
    }

    while (pipes.length && pipes[0].x + PIPE_WIDTH < -10) {
      pipes.shift();
      const lastX = pipes[pipes.length - 1].x;
      spawnPipe(lastX + PIPE_SPACING);
    }

    const floor = H - GROUND_H - BIRD_R + 2;
    if (bird.y + BIRD_R >= floor || bird.y - BIRD_R <= 0) {
      die();
    } else {
      for (const p of pipes) {
        if (hitPipe(p)) {
          die();
          break;
        }
      }
    }

    updateParticles();

    // Light trail behind bird (equipped trail, independent of skin)
    const trail = getEquippedTrail();
    pushLightTrailPoint(trailPoints, bird.x - 6, bird.y, trail);
  }

  function hitPipe(p) {
    const bx = bird.x;
    const by = bird.y;
    const r = BIRD_R - 2;
    if (bx + r < p.x || bx - r > p.x + PIPE_WIDTH) return false;
    const gapTop = p.top;
    const gapBot = p.top + p.gap;
    if (by - r < gapTop || by + r > gapBot) return true;
    return false;
  }

  function die() {
    if (state !== STATE.PLAYING) return;
    state = STATE.OVER;
    flash = 8;
    overTimer = 0;
    bird.vy = Math.min(bird.vy, 2);
    playSfx("death");
    vibratePulse([30, 40, 30]);

    coinsEarnedThisRun = Math.floor(runDistance / PIXELS_PER_COIN);
    stardustEarnedThisRun = Math.floor(score / PIPES_PER_STARDUST);
    if (coinsEarnedThisRun > 0) {
      coins += coinsEarnedThisRun;
      persistCoins();
    }
    if (stardustEarnedThisRun > 0) {
      stardust += stardustEarnedThisRun;
      persistStardust();
    }
    if (coinsEarnedThisRun <= 0 && stardustEarnedThisRun <= 0) {
      syncCoinHUD();
    }

    if (!adsRemoved) {
      runsSinceAd += 1;
      persistRuns();
      // Show interstitial after the run ends (not on next start)
      if (needsAdGate()) {
        showAdThen(() => {
          syncPromoVisibility();
        });
      }
    }

    updateLeaderboardsOnScore(score);

    const equipped = getEquippedSkin();
    const legendaryOk =
      !!equipped &&
      equipped.rarity === "legendary" &&
      ownedSkins.includes(equipped.id) &&
      score >= 8;
    updateChallengesOnRunEnd({
      score,
      coins: coinsEarnedThisRun,
      distance: Math.floor(runDistance),
      legendaryOk,
    });

    syncPromoVisibility();
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) particles.splice(i, 1);
    }
  }

  // --- Drawing ---
  function draw() {
    applyMapPalette(getEquippedMap());
    drawSky();
    drawHills();
    drawPipes();
    drawGround();
    drawParticles();
    drawLightTrail(ctx, trailPoints, getEquippedTrail());
    drawBird();
    drawHUD();
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash / 12})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H - GROUND_H);
    g.addColorStop(0, C.skyTop);
    g.addColorStop(1, C.skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.beginPath();
    ctx.arc(W - 70, 70, 36, 0, Math.PI * 2);
    ctx.fillStyle = C.sun;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W - 70, 70, 52, 0, Math.PI * 2);
    ctx.fillStyle = C.sunGlow;
    ctx.fill();

    // Map décor accents (lightweight)
    if (C.mapDecor === "stars" || C.mapDecor === "glitch" || C.mapDecor === "neon") {
      ctx.fillStyle = C.mapDecor === "neon" ? "rgba(0,240,255,0.35)" : "rgba(255,255,255,0.45)";
      for (let i = 0; i < 12; i++) {
        const sx = (i * 97 + skyOffset * 0.15) % W;
        const sy = 30 + ((i * 53) % (H - GROUND_H - 80));
        ctx.fillRect(sx, sy, C.mapDecor === "glitch" ? 3 : 2, C.mapDecor === "glitch" ? 2 : 2);
      }
    } else if (C.mapDecor === "snow" || C.mapDecor === "sprinkles") {
      ctx.fillStyle = C.mapDecor === "sprinkles" ? "rgba(255,180,220,0.5)" : "rgba(255,255,255,0.55)";
      for (let i = 0; i < 10; i++) {
        const sx = (i * 73 + skyOffset * 0.4) % W;
        const sy = (i * 41 + frames * 0.6) % (H - GROUND_H);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (C.mapDecor === "pixel") {
      ctx.fillStyle = "rgba(187,247,208,0.25)";
      for (let i = 0; i < 8; i++) {
        ctx.fillRect((i * 50 + (skyOffset | 0) % 50) % W, 40 + i * 28, 6, 6);
      }
    }

    drawCloud(40 - skyOffset * 0.6, 90, 1.1);
    drawCloud(180 - skyOffset * 0.45, 140, 0.85);
    drawCloud(300 - skyOffset * 0.55, 70, 1.0);
    drawCloud(420 - skyOffset * 0.6, 120, 0.9);
  }

  function drawCloud(x, y, s) {
    const xx = ((x % (W + 120)) + W + 120) % (W + 120) - 60;
    ctx.fillStyle = C.cloud;
    ctx.beginPath();
    ctx.ellipse(xx, y, 28 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(xx + 22 * s, y + 4, 22 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(xx - 20 * s, y + 6, 20 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHills() {
    const base = H - GROUND_H;
    ctx.fillStyle = C.hill1;
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let x = 0; x <= W; x += 20) {
      const y = base - 40 - Math.sin((x + skyOffset * 0.2) * 0.02) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, base);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = C.hill2;
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let x = 0; x <= W; x += 16) {
      const y = base - 22 - Math.sin((x + skyOffset * 0.35) * 0.035 + 1) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, base);
    ctx.closePath();
    ctx.fill();
  }

  function drawPipes() {
    for (const p of pipes) {
      drawPipePair(p);
    }
  }

  function drawPipePair(p) {
    const gapTop = p.top;
    const gapBot = p.top + p.gap;
    const floorY = H - GROUND_H;

    drawPipeSegment(p.x, 0, PIPE_WIDTH, gapTop, true);
    drawPipeSegment(p.x, gapBot, PIPE_WIDTH, floorY - gapBot, false);
  }

  function drawPipeSegment(x, y, w, h, isTop) {
    if (h <= 0) return;
    const bodyG = ctx.createLinearGradient(x, 0, x + w, 0);
    bodyG.addColorStop(0, C.pipeDark);
    bodyG.addColorStop(0.25, C.pipeHighlight);
    bodyG.addColorStop(0.55, C.pipe);
    bodyG.addColorStop(1, C.pipeDark);
    ctx.fillStyle = bodyG;
    ctx.fillRect(x + 4, y, w - 8, h);

    const rimH = 22;
    const rimExpand = 6;
    const rimY = isTop ? y + h - rimH : y;
    ctx.fillStyle = C.pipe;
    roundRect(x - rimExpand, rimY, w + rimExpand * 2, rimH, 4);
    ctx.fill();

    const rimG = ctx.createLinearGradient(x - rimExpand, 0, x + w + rimExpand, 0);
    rimG.addColorStop(0, C.pipeDark);
    rimG.addColorStop(0.3, C.pipeHighlight);
    rimG.addColorStop(0.7, C.pipe);
    rimG.addColorStop(1, C.pipeDark);
    ctx.fillStyle = rimG;
    roundRect(x - rimExpand, rimY, w + rimExpand * 2, rimH, 4);
    ctx.fill();

    ctx.fillStyle = C.pipeRim;
    ctx.fillRect(x - rimExpand + 2, rimY + 4, w + rimExpand * 2 - 4, 4);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(x - rimExpand + 2, rimY + 4, w + rimExpand * 2 - 4, 1.5);

    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 10, isTop ? y : y + rimH);
    ctx.lineTo(x + 10, isTop ? y + h - rimH : y + h);
    ctx.stroke();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawGround() {
    const y = H - GROUND_H;
    ctx.fillStyle = C.dirt;
    ctx.fillRect(0, y + 22, W, GROUND_H - 22);
    const gg = ctx.createLinearGradient(0, y, 0, y + 28);
    gg.addColorStop(0, C.ground);
    gg.addColorStop(1, C.groundDark);
    ctx.fillStyle = gg;
    ctx.fillRect(0, y, W, 28);

    ctx.fillStyle = C.ground;
    for (let x = -groundOffset; x < W + 48; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, y + 14);
      ctx.lineTo(x + 8, y + 2);
      ctx.lineTo(x + 16, y + 14);
      ctx.fill();
    }

    ctx.fillStyle = C.dirtDark;
    for (let x = -groundOffset * 0.5; x < W + 40; x += 40) {
      ctx.fillRect(x + 6, y + 40, 6, 4);
      ctx.fillRect(x + 22, y + 58, 8, 3);
      ctx.fillRect(x + 10, y + 72, 5, 4);
    }

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(0, y, W, 2);
  }

  /** Draw bird body using a skin onto any 2d context (already translated). */
  function drawBirdOn(c, skin, wingPhase, animate) {
    const r = BIRD_R;
    const alpha = skin.alpha != null ? skin.alpha : 1;
    c.save();
    c.globalAlpha = alpha;

    if (skin.glow) {
      c.shadowColor = skin.glow;
      c.shadowBlur = 12;
    }

    // Shadow
    c.fillStyle = "rgba(0,0,0,0.18)";
    c.beginPath();
    c.ellipse(2, r + 4, r * 0.9, 4, 0, 0, Math.PI * 2);
    c.fill();

    // Body
    if (skin.accessory === "pixel") {
      c.fillStyle = skin.body;
      c.fillRect(-r - 1, -r, (r + 2) * 2, r * 2);
      c.fillStyle = skin.belly;
      c.fillRect(-2, 0, r, r - 2);
    } else {
      c.fillStyle = skin.body;
      c.beginPath();
      c.ellipse(0, 0, r + 2, r, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = skin.belly;
      c.beginPath();
      c.ellipse(2, 4, r * 0.7, r * 0.65, -0.2, 0, Math.PI * 2);
      c.fill();
    }

    c.shadowBlur = 0;

    // Accessories (head)
    drawAccessory(c, skin, r, animate);

    // Wing
    const wingAngle = animate
      ? wingPhase > 0
        ? -0.7
        : 0.35 + Math.sin(frames * 0.35) * 0.08
      : 0.25;
    c.save();
    c.translate(-2, 2);
    c.rotate(wingAngle);
    c.fillStyle = skin.wing;
    if (skin.accessory === "pixel") {
      c.fillRect(-12, -5, 14, 10);
    } else {
      c.beginPath();
      c.ellipse(-4, 0, 10, 7, 0.1, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.2)";
      c.beginPath();
      c.ellipse(-5, -2, 5, 3, 0.1, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // Eye
    if (skin.accessory === "visor") {
      c.fillStyle = skin.eye;
      c.fillRect(4, -7, 12, 6);
      c.fillStyle = "rgba(255,255,255,0.35)";
      c.fillRect(5, -6, 4, 2);
    } else if (skin.accessory === "mask") {
      c.fillStyle = "#0b1220";
      c.fillRect(2, -8, 14, 8);
      c.fillStyle = skin.eye;
      c.beginPath();
      c.arc(10, -4, 2.2, 0, Math.PI * 2);
      c.fill();
    } else {
      c.fillStyle = "#fff";
      c.beginPath();
      c.ellipse(8, -4, 5.5, 5.5, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = skin.eye;
      c.beginPath();
      c.arc(10, -4, 2.6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#fff";
      c.beginPath();
      c.arc(11, -5.2, 1, 0, Math.PI * 2);
      c.fill();
    }

    // Beak / fangs
    if (skin.accessory === "fangs") {
      c.fillStyle = skin.beak;
      c.beginPath();
      c.moveTo(12, -1);
      c.lineTo(20, 1);
      c.lineTo(12, 4);
      c.closePath();
      c.fill();
      c.fillStyle = "#fff";
      c.beginPath();
      c.moveTo(13, 3);
      c.lineTo(15, 8);
      c.lineTo(16.5, 3);
      c.fill();
      c.beginPath();
      c.moveTo(16.5, 3);
      c.lineTo(18, 7.5);
      c.lineTo(19.5, 2.5);
      c.fill();
    } else {
      c.fillStyle = skin.beak;
      c.beginPath();
      c.moveTo(12, 0);
      c.lineTo(22, 2);
      c.lineTo(12, 5);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(0,0,0,0.2)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(12, 2.5);
      c.lineTo(20, 2.5);
      c.stroke();
    }

    // Cheek / slime drip / cracks overlay
    if (skin.accessory === "slime") {
      c.fillStyle = skin.accent;
      c.beginPath();
      c.ellipse(0, r - 2, 5, 4, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(6, r + 2, 3, 5, 0.2, 0, Math.PI * 2);
      c.fill();
    } else if (skin.accessory === "cracks") {
      c.strokeStyle = skin.belly;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-6, -2);
      c.lineTo(-1, 3);
      c.lineTo(-4, 8);
      c.stroke();
      c.beginPath();
      c.moveTo(2, -6);
      c.lineTo(5, 0);
      c.stroke();
    } else if (skin.accessory === "sprinkles") {
      const dots = [
        [-6, -4, "#67e8f9"],
        [0, 6, "#fde047"],
        [-8, 4, "#a78bfa"],
        [4, -8, "#fff"],
      ];
      for (const [dx, dy, col] of dots) {
        c.fillStyle = col;
        c.beginPath();
        c.arc(dx, dy, 1.6, 0, Math.PI * 2);
        c.fill();
      }
    } else if (skin.accessory !== "ghost") {
      c.fillStyle = "rgba(255, 150, 140, 0.35)";
      c.beginPath();
      c.ellipse(4, 2, 3, 2, 0, 0, Math.PI * 2);
      c.fill();
    }

    if (skin.accessory === "glitch" && animate) {
      c.fillStyle = "rgba(57,255,20,0.35)";
      c.fillRect(-r - 4, -2 + Math.sin(frames * 0.4) * 3, 6, 3);
      c.fillStyle = "rgba(91,45,255,0.35)";
      c.fillRect(r - 2, 2 + Math.cos(frames * 0.35) * 2, 5, 2);
    }

    if (skin.accessory === "sparks" && animate) {
      c.strokeStyle = skin.accent;
      c.lineWidth = 1.5;
      const t = frames * 0.4;
      c.beginPath();
      c.moveTo(-r - 2, 0);
      c.lineTo(-r - 8, Math.sin(t) * 4);
      c.stroke();
      c.beginPath();
      c.moveTo(-r, 4);
      c.lineTo(-r - 6, 4 + Math.cos(t) * 3);
      c.stroke();
    }

    c.restore();
  }

  function drawAccessory(c, skin, r, animate) {
    const acc = skin.accessory;
    if (acc === "crest" || !acc) {
      c.fillStyle = skin.crest;
      c.beginPath();
      c.moveTo(-4, -r + 2);
      c.quadraticCurveTo(-2, -r - 10, 6, -r - 2);
      c.quadraticCurveTo(2, -r - 4, -2, -r + 4);
      c.fill();
      return;
    }
    if (acc === "mohawk") {
      c.fillStyle = skin.crest;
      for (let i = 0; i < 5; i++) {
        const x = -6 + i * 3.2;
        const h = 10 + (i % 2) * 4;
        c.beginPath();
        c.moveTo(x, -r + 2);
        c.lineTo(x + 1.5, -r - h);
        c.lineTo(x + 3, -r + 2);
        c.fill();
      }
      return;
    }
    if (acc === "horns") {
      c.fillStyle = skin.crest;
      c.beginPath();
      c.moveTo(-8, -r + 4);
      c.quadraticCurveTo(-14, -r - 8, -6, -r - 10);
      c.quadraticCurveTo(-8, -r - 2, -4, -r + 2);
      c.fill();
      c.beginPath();
      c.moveTo(2, -r + 2);
      c.quadraticCurveTo(10, -r - 10, 8, -r - 12);
      c.quadraticCurveTo(6, -r - 2, 4, -r + 4);
      c.fill();
      return;
    }
    if (acc === "antenna") {
      c.strokeStyle = skin.crest;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, -r);
      c.lineTo(2, -r - 10);
      c.stroke();
      c.fillStyle = skin.beak;
      c.beginPath();
      c.arc(2, -r - 12, 3, 0, Math.PI * 2);
      c.fill();
      return;
    }
    if (acc === "crown") {
      c.fillStyle = skin.crest;
      c.beginPath();
      c.moveTo(-8, -r + 2);
      c.lineTo(-6, -r - 8);
      c.lineTo(-2, -r - 2);
      c.lineTo(2, -r - 10);
      c.lineTo(6, -r - 2);
      c.lineTo(10, -r - 8);
      c.lineTo(8, -r + 2);
      c.closePath();
      c.fill();
      c.fillStyle = "#fff";
      c.beginPath();
      c.arc(2, -r - 6, 1.5, 0, Math.PI * 2);
      c.fill();
      return;
    }
    if (acc === "icicle") {
      c.fillStyle = skin.crest;
      c.beginPath();
      c.moveTo(-4, -r);
      c.lineTo(0, -r - 12);
      c.lineTo(4, -r);
      c.fill();
      return;
    }
    if (acc === "spikes") {
      c.fillStyle = skin.crest;
      for (let i = 0; i < 4; i++) {
        const ang = -0.9 + i * 0.45;
        c.save();
        c.rotate(ang);
        c.beginPath();
        c.moveTo(0, -r + 2);
        c.lineTo(3, -r - 8);
        c.lineTo(6, -r + 2);
        c.fill();
        c.restore();
      }
      return;
    }
    if (acc === "bones") {
      c.fillStyle = skin.crest;
      c.fillRect(-3, -r - 2, 6, 3);
      c.beginPath();
      c.arc(-4, -r - 1, 2.5, 0, Math.PI * 2);
      c.arc(4, -r - 1, 2.5, 0, Math.PI * 2);
      c.fill();
      // rib lines
      c.strokeStyle = "rgba(0,0,0,0.15)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-6, 2);
      c.lineTo(6, 2);
      c.moveTo(-5, 6);
      c.lineTo(5, 6);
      c.stroke();
      return;
    }
    if (acc === "stars") {
      c.fillStyle = skin.accent;
      const pts = [
        [-6, -r - 4],
        [4, -r - 8],
        [8, -r - 2],
      ];
      for (const [sx, sy] of pts) {
        c.beginPath();
        c.arc(sx, sy, 1.8, 0, Math.PI * 2);
        c.fill();
      }
      return;
    }
    if (acc === "flame") {
      c.fillStyle = skin.accent;
      c.beginPath();
      c.moveTo(-4, -r + 2);
      c.quadraticCurveTo(-2, -r - 12, 2, -r - 4);
      c.quadraticCurveTo(4, -r - 14, 6, -r);
      c.quadraticCurveTo(0, -r - 4, -4, -r + 2);
      c.fill();
      c.fillStyle = "#fde047";
      c.beginPath();
      c.moveTo(-1, -r);
      c.quadraticCurveTo(1, -r - 8, 3, -r + 1);
      c.fill();
      return;
    }
    if (acc === "ghost") {
      c.fillStyle = "rgba(255,255,255,0.5)";
      c.beginPath();
      c.ellipse(0, r + 2, r * 0.7, 5, 0, 0, Math.PI * 2);
      c.fill();
      return;
    }
    // default soft crest color tip
    c.fillStyle = skin.crest;
    c.beginPath();
    c.moveTo(-3, -r + 2);
    c.quadraticCurveTo(0, -r - 8, 5, -r);
    c.quadraticCurveTo(1, -r - 2, -1, -r + 3);
    c.fill();
  }

  function drawBird() {
    const skin = getEquippedSkin();
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rot);
    // idle trail particles for fiery skins
    if (
      (skin.trail || skin.glow) &&
      state === STATE.PLAYING &&
      frames % 3 === 0
    ) {
      particles.push({
        x: bird.x - 10,
        y: bird.y + (Math.random() - 0.5) * 8,
        vx: -1 - Math.random(),
        vy: (Math.random() - 0.5) * 1.5,
        life: 14,
        max: 14,
        size: 2 + Math.random() * 2,
        color: skin.trail || skin.glow,
      });
    }
    drawBirdOn(ctx, skin, bird.wing, true);
    ctx.restore();
  }

  function drawParticles() {
    for (const pt of particles) {
      const a = Math.max(0, pt.life / pt.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    // Coin balance is HTML HUD (top-right). Canvas keeps score / menus.
    if (state === STATE.PLAYING || state === STATE.OVER) {
      ctx.textAlign = "center";
      ctx.font = "bold 42px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = C.hudShadow;
      ctx.fillText(String(score), W / 2 + 2, 58 + 2);
      ctx.fillStyle = C.hud;
      ctx.fillText(String(score), W / 2, 58);
    }

    if (state === STATE.READY) {
      ctx.textAlign = "center";
      ctx.font = "bold 44px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = C.hudShadow;
      ctx.fillText("Sky Hop", W / 2 + 2, 120 + 2);
      ctx.fillStyle = C.accent;
      ctx.fillText("Sky Hop", W / 2, 120);
      ctx.font = "600 16px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText("Tap · Click · Space · ↑", W / 2, 158);

      const pw = 220;
      const ph = 70;
      const px = (W - pw) / 2;
      const py = H * 0.58;
      ctx.fillStyle = C.panel;
      roundRect(px, py, pw, ph, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(233,196,106,0.45)";
      ctx.lineWidth = 2;
      roundRect(px, py, pw, ph, 12);
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "600 18px Segoe UI, system-ui, sans-serif";
      ctx.fillText("Tap to start", W / 2, py + 30);
      ctx.font = "14px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(`Best: ${best}`, W / 2, py + 52);
    }

    if (state === STATE.OVER) {
      const pw = 240;
      const ph = 220;
      const px = (W - pw) / 2;
      const py = H * 0.26;
      ctx.fillStyle = C.panel;
      roundRect(px, py, pw, ph, 14);
      ctx.fill();
      ctx.strokeStyle = "rgba(233,196,106,0.5)";
      ctx.lineWidth = 2;
      roundRect(px, py, pw, ph, 14);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "bold 28px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = C.accent;
      ctx.fillText("Game Over", W / 2, py + 34);

      ctx.font = "16px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`Score  ${score}`, W / 2, py + 64);
      ctx.fillText(`Best   ${best}`, W / 2, py + 86);

      ctx.fillStyle = C.coin;
      ctx.fillText(`Coins +${coinsEarnedThisRun}`, W / 2, py + 112);
      ctx.fillStyle = C.stardust || C.gem;
      ctx.fillText(`Stardust +${stardustEarnedThisRun}`, W / 2, py + 134);

      ctx.font = "12px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(`Bag ${coins} · Stardust ${stardust}`, W / 2, py + 158);

      if (overTimer > 20) {
        const pulse = 0.7 + Math.sin(frames * 0.12) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.font = "600 15px Segoe UI, system-ui, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText("Tap to retry", W / 2, py + 190);
        ctx.globalAlpha = 1;
      }
    }
  }

  // --- Loop ---
  let last = 0;
  const STEP = 1000 / 60;

  function loop(ts) {
    if (!last) last = ts;
    let dt = ts - last;
    if (dt > 100) dt = STEP;
    while (dt >= STEP) {
      update();
      dt -= STEP;
      last += STEP;
    }
    if (ts - last > STEP * 3) last = ts;
    draw();
    requestAnimationFrame(loop);
  }

  syncCoinHUD();
  resetGame();
  requestAnimationFrame(loop);
})();
