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
  const GEMS_KEY = "skyHopGems";
  const GEMS_KEY_LEGACY = "skyHopStarDust";
  const OWNED_MAPS_KEY = "skyHopOwnedMaps";
  const EQUIPPED_MAP_KEY = "skyHopEquippedMap";

  // Coins: 1 coin per this many pixels of horizontal travel
  const PIXELS_PER_COIN = 40;
  // Gems: 1 per this many pipes cleared in a run (slow free earn)
  const PIPES_PER_GEM = 25;
  const AD_EVERY_N_RUNS = 3;
  const AD_COUNTDOWN_SEC = 5;
  const LB_MAX = 8;
  const SPECIAL_CURRENCY_NAME = "Gems";
  const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const RARITY_SECTIONS = ["legendary", "epic", "rare", "common"];

  // Simulated gem packs (GBP)
  const GEM_PACKS = [
    { id: "pack5", gems: 5, priceGbp: "0.99", label: "5 Gems" },
    { id: "pack15", gems: 15, priceGbp: "1.99", label: "15 Gems" },
    { id: "pack40", gems: 40, priceGbp: "4.99", label: "40 Gems" },
  ];

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


  // --- State ---
  const STATE = { READY: 0, PLAYING: 1, OVER: 2 };
  let state = STATE.READY;
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  let frames = 0;
  let pipeSpeed = PIPE_SPEED_BASE;
  let pipeGap = PIPE_GAP_BASE;

  function loadGemsBalance() {
    const fresh = localStorage.getItem(GEMS_KEY);
    if (fresh !== null && fresh !== "") {
      return Number(fresh) || 0;
    }
    const legacy = localStorage.getItem(GEMS_KEY_LEGACY);
    if (legacy !== null && legacy !== "") {
      const migrated = Number(legacy) || 0;
      localStorage.setItem(GEMS_KEY, String(migrated));
      try {
        localStorage.removeItem(GEMS_KEY_LEGACY);
      } catch (_) {
        /* ignore */
      }
      return migrated;
    }
    return 0;
  }

  let coins = Number(localStorage.getItem(COINS_KEY) || 0) || 0;
  let gems = loadGemsBalance();
  let runDistance = 0;
  let coinsEarnedThisRun = 0;
  let gemsEarnedThisRun = 0;
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

  let shopTab = "skins"; // skins | maps
  let shopRarityFilter = "all";
  let shopPreviewSkinId = equippedSkinId;
  let shopPreviewMapId = equippedMapId;
  let trailParticles = [];
  let shopTrailParticles = [];
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
  const coinBalanceEl = document.getElementById("coin-balance");
  const gemsBalanceEl = document.getElementById("gems-balance") || document.getElementById("stardust-balance");
  const shopCoinBalanceEl = document.getElementById("shop-coin-balance");
  const shopGemsBalanceEl = document.getElementById("shop-gems-balance") || document.getElementById("shop-stardust-balance");
  const btnShop = document.getElementById("btn-shop");
  const btnBuyGems = document.getElementById("btn-buy-gems");
  const btnBuyGemsPromo = document.getElementById("btn-buy-gems-promo");
  const gemsPage = document.getElementById("gems-page");
  const gemsBack = document.getElementById("gems-back");
  const gemsPacksEl = document.getElementById("gems-packs");
  const shopModal = document.getElementById("shop-modal");
  const shopClose = document.getElementById("shop-close");
  const shopGrid = document.getElementById("shop-grid");
  const shopTabs = document.querySelectorAll(".shop-tab");
  const shopFilters = document.querySelectorAll(".shop-filter");
  const shopLivePreview = document.getElementById("shop-live-preview");
  const shopPreviewLabel = document.getElementById("shop-preview-label");
  const adOverlay = document.getElementById("ad-overlay");
  const adCountdown = document.getElementById("ad-countdown");
  const adContinue = document.getElementById("ad-continue");
  const checkoutModal = document.getElementById("checkout-modal");
  const checkoutItemEl = document.querySelector(".checkout-item");
  const checkoutPriceEl = document.querySelector(".checkout-price");
  const checkoutCancel = document.getElementById("checkout-cancel");
  const checkoutConfirm = document.getElementById("checkout-confirm");
  let checkoutKind = "ads"; // ads | gems
  let pendingGemPack = null;

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
  }

  function openRemoveAdsPage() {
    syncPromoUI();
    openPage(removeAdsPage);
  }

  function openRankPage() {
    refreshLeaderboardUI();
    openPage(rankPage);
  }

  function syncCoinHUD() {
    const text = String(coins);
    const gemText = String(gems);
    if (coinBalanceEl) coinBalanceEl.textContent = text;
    if (shopCoinBalanceEl) shopCoinBalanceEl.textContent = text;
    if (gemsBalanceEl) gemsBalanceEl.textContent = gemText;
    if (shopGemsBalanceEl) shopGemsBalanceEl.textContent = gemText;
  }

  function persistCoins() {
    localStorage.setItem(COINS_KEY, String(coins));
    syncCoinHUD();
  }

  function persistGems() {
    localStorage.setItem(GEMS_KEY, String(gems));
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

  function isGemsCurrency(item) {
    return item.currency === "gems" || item.currency === "stardust";
  }

  function canAfford(item) {
    if (item.price <= 0) return true;
    if (isGemsCurrency(item)) return gems >= item.price;
    return coins >= item.price;
  }

  function spendForItem(item) {
    if (item.price <= 0) return true;
    if (isGemsCurrency(item)) {
      if (gems < item.price) return false;
      gems -= item.price;
      persistGems();
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

  function trailBudget(rarity) {
    if (rarity === "legendary") return { rate: 2, life: 1.0, life: 28, max: 48 };
    if (rarity === "epic") return { rate: 2, size: 0.85, life: 22, max: 36 };
    if (rarity === "rare") return { rate: 1, size: 0.7, life: 18, max: 28 };
    return { rate: 1, size: 0.55, life: 12, max: 18 };
  }

  function spawnTrailParticle(list, x, y, skin, flapBoost) {
    const cfg = trailBudget(skin.rarity || "common");
    if (list.length > cfg.max) list.splice(0, list.length - cfg.max);
    const style = skin.trailStyle || "sparkle";
    const n = cfg.rate + (flapBoost ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const useAccent = Math.random() > 0.55;
      list.push({
        x: x - 10 - Math.random() * 8,
        y: y + (Math.random() - 0.5) * 10,
        vx: -0.6 - Math.random() * 1.2,
        vy: (Math.random() - 0.5) * 0.8,
        life: cfg.life + (Math.random() * 8) | 0,
        maxLife: cfg.life + 8,
        size: (1.5 + Math.random() * 2.5) * cfg.size,
        color: useAccent ? skin.trailAccent : skin.trailColor,
        style,
        spin: Math.random() * Math.PI * 2,
      });
    }
  }

  function updateTrailList(list) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.life--;
      p.spin += 0.12;
      if (p.style === "slime") p.vy += 0.04;
      if (p.style === "void" || p.style === "cosmic") {
        p.vx += Math.sin(p.spin) * 0.05;
        p.vy += Math.cos(p.spin) * 0.04;
      }
      if (p.life <= 0) list.splice(i, 1);
    }
  }

  function drawTrailList(c, list) {
    for (const p of list) {
      const a = Math.max(0, p.life / p.maxLife);
      c.save();
      c.globalAlpha = a * 0.85;
      c.translate(p.x, p.y);
      c.rotate(p.spin * 0.25);
      c.fillStyle = p.color;
      if (p.style === "pixel") {
        c.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
      } else if (p.style === "void" || p.style === "obsidian") {
        c.shadowColor = p.color;
        c.shadowBlur = 8;
        c.beginPath();
        c.moveTo(0, -p.size);
        c.lineTo(p.size, 0);
        c.lineTo(0, p.size);
        c.lineTo(-p.size, 0);
        c.closePath();
        c.fill();
      } else if (p.style === "cosmic" || p.style === "dust" || p.style === "candy") {
        c.shadowColor = p.color;
        c.shadowBlur = 6;
        c.beginPath();
        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 === 0 ? p.size : p.size * 0.45;
          const px = Math.cos(ang) * r;
          const py = Math.sin(ang) * r;
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        c.fill();
      } else if (p.style === "mist" || p.style === "wisp" || p.style === "slime") {
        c.beginPath();
        c.ellipse(0, 0, p.size * 1.4, p.size * 0.8, 0.3, 0, Math.PI * 2);
        c.fill();
      } else if (p.style === "neon" || p.style === "spark") {
        c.shadowColor = p.color;
        c.shadowBlur = 10;
        c.fillRect(-p.size * 1.6, -1, p.size * 3.2, 2);
        c.beginPath();
        c.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
        c.fill();
      } else {
        // sparkle / ember default
        c.beginPath();
        c.arc(0, 0, p.size, 0, Math.PI * 2);
        c.fill();
        if (p.style === "ember") {
          c.globalAlpha = a * 0.4;
          c.beginPath();
          c.arc(0, -p.size, p.size * 0.5, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
    }
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
    pendingGemPack = null;
    setCheckoutUI("Remove ads — Sky Hop", "£1.99 GBP", "Confirm £1.99");
    checkoutModal.classList.remove("hidden");
    checkoutModal.setAttribute("aria-hidden", "false");
  }

  function openCheckoutGemPack(pack) {
    checkoutKind = "gems";
    pendingGemPack = pack;
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

  function renderGemPacks() {
    if (!gemsPacksEl) return;
    gemsPacksEl.innerHTML = "";
    for (const pack of GEM_PACKS) {
      const card = document.createElement("div");
      card.className = "gem-pack-card";
      card.innerHTML =
        `<p class="gem-pack-amount">${pack.gems} Gems</p>` +
        `<p class="gem-pack-price">£${pack.priceGbp} <span>GBP</span></p>` +
        `<p class="gem-pack-note">Simulated purchase — no real payment.</p>`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "promo-btn gem-pack-btn";
      btn.textContent = `Buy · £${pack.priceGbp}`;
      btn.addEventListener("click", () => openCheckoutGemPack(pack));
      card.appendChild(btn);
      gemsPacksEl.appendChild(card);
    }
  }

  function openGemsPage() {
    renderGemPacks();
    syncCoinHUD();
    if (gemsPage) openPage(gemsPage);
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

  checkoutCancel.addEventListener("click", () => {
    pendingGemPack = null;
    checkoutKind = "ads";
    checkoutModal.classList.add("hidden");
    checkoutModal.setAttribute("aria-hidden", "true");
  });

  checkoutConfirm.addEventListener("click", () => {
    if (checkoutKind === "gems" && pendingGemPack) {
      gems += pendingGemPack.gems;
      persistGems();
      pendingGemPack = null;
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
  function drawSkinPreview(c, skin, map, trailList, wingPhase) {
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
    if (trailList && trailList.length) drawTrailList(pctx, trailList);
    pctx.save();
    pctx.translate(pw / 2 + 8, ph / 2);
    pctx.scale(1.05, 1.05);
    drawBirdOn(pctx, skin, wingPhase || 0, true);
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
    shopTabs.forEach((t) => {
      const on = t.dataset.tab === shopTab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      const kind = t.dataset.tab;
      const count = kind === "maps" ? MAPS.length : SKINS.length;
      const base = kind === "maps" ? "Maps" : "Skins";
      t.textContent = `${base} (${count})`;
    });
    shopFilters.forEach((f) => {
      f.classList.toggle("active", f.dataset.rarity === shopRarityFilter);
    });
  }

  function updateShopLivePreview() {
    if (!shopLivePreview) return;
    const skin = SKIN_BY_ID[shopPreviewSkinId] || getEquippedSkin();
    const map = MAP_BY_ID[shopPreviewMapId] || getEquippedMap();
    if (shopPreviewLabel) {
      shopPreviewLabel.textContent =
        shopTab === "maps"
          ? `Map: ${map.name} · ${rarityLabel(map.rarity)}`
          : `Skin: ${skin.name} · ${rarityLabel(skin.rarity)}`;
    }
    // animate trail for preview
    if (frames % 2 === 0) {
      spawnTrailParticle(shopTrailParticles, shopLivePreview.width / 2 - 4, shopLivePreview.height / 2, skin, frames % 20 < 4);
    }
    updateTrailList(shopTrailParticles);
    drawSkinPreview(shopLivePreview, skin, map, shopTrailParticles, Math.sin(frames * 0.25));
  }

  function appendShopCard(item, isMap) {
    const owned = isMap ? ownedMaps.includes(item.id) : ownedSkins.includes(item.id);
    const equipped = isMap ? equippedMapId === item.id : equippedSkinId === item.id;
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
      const curClass = isGemsCurrency(item) ? "skin-price gems" : "skin-price";
      meta.innerHTML = `<span class="${curClass}">${priceLabel(item)}</span>`;
    }

    const actions = document.createElement("div");
    actions.className = "skin-actions";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "skin-btn";

    const selectPreview = () => {
      if (isMap) shopPreviewMapId = item.id;
      else shopPreviewSkinId = item.id;
      updateShopLivePreview();
    };
    card.addEventListener("click", selectPreview);

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
        } else {
          equippedSkinId = item.id;
          persistEquippedSkin();
          shopPreviewSkinId = item.id;
          trailParticles = [];
        }
        renderShop();
      });
    } else {
      btn.classList.add("buy");
      if (isGemsCurrency(item)) btn.classList.add("buy-gems");
      const afford = canAfford(item);
      btn.textContent = afford
        ? "Buy"
        : isGemsCurrency(item)
          ? "Need Gems"
          : "Need coins";
      btn.disabled = !afford;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!canAfford(item)) return;
        if (isMap && ownedMaps.includes(item.id)) return;
        if (!isMap && ownedSkins.includes(item.id)) return;
        if (!spendForItem(item)) return;
        if (isMap) {
          ownedMaps.push(item.id);
          persistOwnedMaps();
          equippedMapId = item.id;
          persistEquippedMap();
          applyMapPalette(getEquippedMap());
          shopPreviewMapId = item.id;
        } else {
          ownedSkins.push(item.id);
          persistOwnedSkins();
          equippedSkinId = item.id;
          persistEquippedSkin();
          shopPreviewSkinId = item.id;
          trailParticles = [];
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
    else drawSkinPreview(preview, item, MAP_BY_ID[item.id] || getEquippedMap(), null, 0);
  }

  function renderShop() {
    shopGrid.innerHTML = "";
    syncCoinHUD();
    syncShopChrome();
    const catalog = shopTab === "maps" ? MAPS : SKINS;
    const isMap = shopTab === "maps";
    let items = sortByRarity(catalog);
    if (shopRarityFilter !== "all") {
      items = items.filter((it) => it.rarity === shopRarityFilter);
    }

    if (shopRarityFilter === "all") {
      for (const rarity of RARITY_SECTIONS) {
        const group = items.filter((it) => it.rarity === rarity);
        if (!group.length) continue;
        const header = document.createElement("div");
        header.className = "shop-section-header rarity-" + rarity;
        header.innerHTML =
          `<span class="shop-section-title">${rarityLabel(rarity)}</span>` +
          `<span class="shop-section-count">${group.length}</span>`;
        shopGrid.appendChild(header);
        for (const item of group) {
          appendShopCard(item, isMap);
        }
      }
    } else {
      for (const item of items) {
        appendShopCard(item, isMap);
      }
    }
    updateShopLivePreview();
  }

  function openShop() {
    shopPreviewSkinId = equippedSkinId;
    shopPreviewMapId = equippedMapId;
    shopTrailParticles = [];
    renderShop();
    shopModal.classList.remove("hidden");
    shopModal.setAttribute("aria-hidden", "false");
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
  }

  btnShop.addEventListener("click", (e) => {
    e.stopPropagation();
    openShop();
  });
  shopClose.addEventListener("click", closeShop);
  shopModal.addEventListener("click", (e) => {
    if (e.target === shopModal) closeShop();
  });
  shopTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      shopTab = tab.dataset.tab;
      shopTrailParticles = [];
      renderShop();
    });
  });
  shopFilters.forEach((btn) => {
    btn.addEventListener("click", () => {
      shopRarityFilter = btn.dataset.rarity;
      renderShop();
    });
  });

  if (btnBuyGems) {
    btnBuyGems.addEventListener("click", (e) => {
      e.stopPropagation();
      openGemsPage();
    });
  }
  if (btnBuyGemsPromo) {
    btnBuyGemsPromo.addEventListener("click", (e) => {
      e.stopPropagation();
      openGemsPage();
    });
  }
  if (gemsBack) {
    gemsBack.addEventListener("click", () => closePage(gemsPage));
  }
  if (gemsPage) {
    gemsPage.addEventListener("click", (e) => {
      if (e.target === gemsPage) closePage(gemsPage);
    });
  }
  renderGemPacks();

  function showAdThen(callback) {
    adBlocking = true;
    pendingStartAfterAd = true;
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
      pendingStartAfterAd = false;
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

  function resetGame() {
    state = STATE.READY;
    score = 0;
    frames = 0;
    pipeSpeed = PIPE_SPEED_BASE;
    pipeGap = PIPE_GAP_BASE;
    runDistance = 0;
    coinsEarnedThisRun = 0;
    gemsEarnedThisRun = 0;
    trailParticles = [];
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
    if (needsAdGate()) {
      showAdThen(() => {
        if (state === STATE.READY) {
          state = STATE.PLAYING;
          bird.vy = FLAP;
          bird.wing = 8;
          syncPromoVisibility();
        }
      });
      return;
    }
    state = STATE.PLAYING;
    syncPromoVisibility();
  }

  function flap() {
    if (adBlocking) return;
    if (!shopModal.classList.contains("hidden")) return;
    if (removeAdsPage && !removeAdsPage.classList.contains("hidden")) return;
    if (rankPage && !rankPage.classList.contains("hidden")) return;
    if (gemsPage && !gemsPage.classList.contains("hidden")) return;
    if (!checkoutModal.classList.contains("hidden")) return;
    if (state === STATE.OVER) {
      if (overTimer > 20) {
        if (needsAdGate()) {
          showAdThen(() => {
            resetGame();
          });
        } else {
          resetGame();
        }
      }
      return;
    }
    if (state === STATE.READY) {
      tryStartPlay();
      if (state !== STATE.PLAYING) return;
    }
    bird.vy = FLAP;
    bird.wing = 8;
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
      return;
    }

    if (state === STATE.OVER) {
      overTimer++;
      bird.vy = Math.min(bird.vy + GRAVITY, MAX_FALL);
      bird.y += bird.vy;
      bird.rot = Math.min(Math.PI / 2, bird.rot + 0.08);
      const floor = H - GROUND_H - BIRD_R;
      if (bird.y > floor) bird.y = floor;
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

    // Fairy trail behind equipped skin
    const skin = getEquippedSkin();
    if (frames % 2 === 0) {
      spawnTrailParticle(trailParticles, bird.x, bird.y, skin, bird.wing > 0);
    }
    updateTrailList(trailParticles);
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

    coinsEarnedThisRun = Math.floor(runDistance / PIXELS_PER_COIN);
    gemsEarnedThisRun = Math.floor(score / PIPES_PER_GEM);
    if (coinsEarnedThisRun > 0) {
      coins += coinsEarnedThisRun;
      persistCoins();
    }
    if (gemsEarnedThisRun > 0) {
      gems += gemsEarnedThisRun;
      persistGems();
    }
    if (coinsEarnedThisRun <= 0 && gemsEarnedThisRun <= 0) {
      syncCoinHUD();
    }

    if (!adsRemoved) {
      runsSinceAd += 1;
      persistRuns();
    }

    updateLeaderboardsOnScore(score);
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
    drawTrailList(ctx, trailParticles);
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
      const ph = adsRemoved ? 210 : 232;
      const px = (W - pw) / 2;
      const py = H * 0.28;
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
      ctx.fillText("Game Over", W / 2, py + 36);

      ctx.font = "16px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`Score  ${score}`, W / 2, py + 68);
      ctx.fillText(`Best   ${best}`, W / 2, py + 90);

      ctx.fillStyle = C.coin;
      ctx.fillText(`Coins +${coinsEarnedThisRun}`, W / 2, py + 112);
      ctx.fillStyle = C.gem;
      ctx.fillText(`Gems +${gemsEarnedThisRun}`, W / 2, py + 132);
      ctx.font = "12px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(`Bag ${coins} · Gems ${gems}`, W / 2, py + 152);

      if (!adsRemoved) {
        ctx.font = "12px Segoe UI, system-ui, sans-serif";
        ctx.fillStyle = "rgba(233,196,106,0.9)";
        ctx.fillText("Remove ads · £1.99 GBP", W / 2, py + 172);
      }

      if (overTimer > 20) {
        const pulse = 0.7 + Math.sin(frames * 0.12) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.font = "600 15px Segoe UI, system-ui, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText("Tap to retry", W / 2, py + (adsRemoved ? 176 : 196));
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
