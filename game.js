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

  // Coins: 1 coin per this many pixels of horizontal travel
  const PIXELS_PER_COIN = 40;
  const AD_EVERY_N_RUNS = 3;
  const AD_COUNTDOWN_SEC = 5;
  const LB_MAX = 8;

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
      price: 40,
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
      price: 55,
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
      price: 90,
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
      price: 120,
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
      price: 70,
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
      price: 85,
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
      price: 65,
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
      price: 130,
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
      price: 75,
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
      price: 200,
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
      price: 80,
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
      price: 95,
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
      price: 150,
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
      price: 140,
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
      price: 100,
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
      price: 115,
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
      price: 60,
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
      price: 250,
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

  // --- State ---
  const STATE = { READY: 0, PLAYING: 1, OVER: 2 };
  let state = STATE.READY;
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  let frames = 0;
  let pipeSpeed = PIPE_SPEED_BASE;
  let pipeGap = PIPE_GAP_BASE;

  let coins = Number(localStorage.getItem(COINS_KEY) || 0) || 0;
  let runDistance = 0;
  let coinsEarnedThisRun = 0;
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

  function persistOwnedSkins() {
    localStorage.setItem(OWNED_SKINS_KEY, JSON.stringify(ownedSkins));
  }

  function persistEquippedSkin() {
    localStorage.setItem(EQUIPPED_SKIN_KEY, equippedSkinId);
  }

  function getEquippedSkin() {
    return SKIN_BY_ID[equippedSkinId] || SKIN_BY_ID[DEFAULT_SKIN_ID];
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
    hud: "#fff",
    hudShadow: "rgba(0,0,0,0.35)",
    panel: "rgba(15, 23, 42, 0.72)",
    accent: "#e9c46a",
    coin: "#f4d35e",
  };

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
  const btnBuyAdsBanner = document.getElementById("btn-buy-ads-banner");
  const promoBanner = document.getElementById("promo-banner");
  const promoBannerOffer = document.getElementById("promo-banner-offer");
  const promoBannerThanks = document.getElementById("promo-banner-thanks");
  const coinBalanceEl = document.getElementById("coin-balance");
  const shopCoinBalanceEl = document.getElementById("shop-coin-balance");
  const btnShop = document.getElementById("btn-shop");
  const shopModal = document.getElementById("shop-modal");
  const shopClose = document.getElementById("shop-close");
  const shopGrid = document.getElementById("shop-grid");
  const adOverlay = document.getElementById("ad-overlay");
  const adCountdown = document.getElementById("ad-countdown");
  const adContinue = document.getElementById("ad-continue");
  const checkoutModal = document.getElementById("checkout-modal");
  const checkoutCancel = document.getElementById("checkout-cancel");
  const checkoutConfirm = document.getElementById("checkout-confirm");

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
      promoBannerOffer.classList.add("hidden");
      promoBannerThanks.classList.remove("hidden");
    } else {
      promoOffer.classList.remove("hidden");
      promoThanks.classList.add("hidden");
      promoBannerOffer.classList.remove("hidden");
      promoBannerThanks.classList.add("hidden");
    }
  }

  function syncPromoVisibility() {
    // Offer clearly present on ready + game-over; dim/hide during play
    document.body.classList.toggle("ready", state === STATE.READY);
    document.body.classList.toggle("playing", state === STATE.PLAYING);
    document.body.classList.toggle("over", state === STATE.OVER);
    const showBanner = state === STATE.READY || state === STATE.OVER;
    promoBanner.classList.toggle("hidden", !showBanner);
  }

  function syncCoinHUD() {
    const text = String(coins);
    if (coinBalanceEl) coinBalanceEl.textContent = text;
    if (shopCoinBalanceEl) shopCoinBalanceEl.textContent = text;
  }

  function persistCoins() {
    localStorage.setItem(COINS_KEY, String(coins));
    syncCoinHUD();
  }

  function persistRuns() {
    localStorage.setItem(RUNS_KEY, String(runsSinceAd));
  }

  function persistAdsRemoved() {
    localStorage.setItem(ADS_REMOVED_KEY, adsRemoved ? "1" : "0");
  }

  function openCheckout() {
    if (adsRemoved) return;
    checkoutModal.classList.remove("hidden");
    checkoutModal.setAttribute("aria-hidden", "false");
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
  btnBuyAdsBanner.addEventListener("click", openCheckout);

  checkoutCancel.addEventListener("click", () => {
    checkoutModal.classList.add("hidden");
    checkoutModal.setAttribute("aria-hidden", "true");
  });

  checkoutConfirm.addEventListener("click", () => {
    adsRemoved = true;
    persistAdsRemoved();
    runsSinceAd = 0;
    persistRuns();
    checkoutModal.classList.add("hidden");
    checkoutModal.setAttribute("aria-hidden", "true");
    syncPromoUI();
  });

  // --- Shop UI ---
  function drawSkinPreview(c, skin) {
    const pctx = c.getContext("2d");
    const pw = c.width;
    const ph = c.height;
    pctx.clearRect(0, 0, pw, ph);
    const g = pctx.createLinearGradient(0, 0, 0, ph);
    g.addColorStop(0, "#4a9fd8");
    g.addColorStop(1, "#b8e4f8");
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, pw, ph);
    pctx.save();
    pctx.translate(pw / 2, ph / 2 + 2);
    pctx.scale(1.15, 1.15);
    drawBirdOn(pctx, skin, 0, false);
    pctx.restore();
  }

  function renderShop() {
    shopGrid.innerHTML = "";
    syncCoinHUD();
    for (const skin of SKINS) {
      const owned = ownedSkins.includes(skin.id);
      const equipped = equippedSkinId === skin.id;
      const card = document.createElement("article");
      card.className = "skin-card" + (equipped ? " equipped" : "") + (owned ? "" : " locked");
      card.dataset.skinId = skin.id;

      const preview = document.createElement("canvas");
      preview.className = "skin-preview";
      preview.width = 140;
      preview.height = 72;
      preview.setAttribute("aria-hidden", "true");

      const nameEl = document.createElement("div");
      nameEl.className = "skin-name";
      nameEl.textContent = skin.name;

      const meta = document.createElement("div");
      meta.className = "skin-meta";
      if (owned) {
        meta.innerHTML = equipped
          ? '<span class="skin-price">Equipped</span>'
          : "<span>Owned</span>";
      } else {
        meta.innerHTML = `<span class="skin-price">${skin.price} coins</span>`;
      }

      const actions = document.createElement("div");
      actions.className = "skin-actions";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "skin-btn";

      if (equipped) {
        btn.classList.add("equipped");
        btn.textContent = "Equipped";
        btn.disabled = true;
      } else if (owned) {
        btn.classList.add("equip");
        btn.textContent = "Equip";
        btn.addEventListener("click", () => {
          equippedSkinId = skin.id;
          persistEquippedSkin();
          renderShop();
        });
      } else {
        btn.classList.add("buy");
        const canAfford = coins >= skin.price;
        btn.textContent = canAfford ? "Buy" : "Need coins";
        btn.disabled = !canAfford;
        btn.addEventListener("click", () => {
          if (coins < skin.price || ownedSkins.includes(skin.id)) return;
          coins -= skin.price;
          persistCoins();
          ownedSkins.push(skin.id);
          persistOwnedSkins();
          equippedSkinId = skin.id;
          persistEquippedSkin();
          renderShop();
        });
      }

      actions.appendChild(btn);
      card.appendChild(preview);
      card.appendChild(nameEl);
      card.appendChild(meta);
      card.appendChild(actions);
      shopGrid.appendChild(card);
      drawSkinPreview(preview, skin);
    }
  }

  function openShop() {
    renderShop();
    shopModal.classList.remove("hidden");
    shopModal.setAttribute("aria-hidden", "false");
  }

  function closeShop() {
    shopModal.classList.add("hidden");
    shopModal.setAttribute("aria-hidden", "true");
  }

  btnShop.addEventListener("click", (e) => {
    e.stopPropagation();
    openShop();
  });
  shopClose.addEventListener("click", closeShop);
  shopModal.addEventListener("click", (e) => {
    if (e.target === shopModal) closeShop();
  });

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
    if (coinsEarnedThisRun > 0) {
      coins += coinsEarnedThisRun;
      persistCoins();
    } else {
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
    drawSky();
    drawHills();
    drawPipes();
    drawGround();
    drawParticles();
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
    ctx.fillStyle = "rgba(255, 236, 179, 0.85)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W - 70, 70, 52, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 220, 140, 0.2)";
    ctx.fill();

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
    ctx.fillStyle = "rgba(45, 120, 90, 0.35)";
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let x = 0; x <= W; x += 20) {
      const y = base - 40 - Math.sin((x + skyOffset * 0.2) * 0.02) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, base);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(35, 100, 75, 0.4)";
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
    gg.addColorStop(0, "#5cb87a");
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
      const ph = adsRemoved ? 188 : 210;
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
      ctx.fillText(`Coins +${coinsEarnedThisRun}`, W / 2, py + 116);
      ctx.font = "13px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(`Balance ${coins}`, W / 2, py + 136);

      if (!adsRemoved) {
        ctx.font = "12px Segoe UI, system-ui, sans-serif";
        ctx.fillStyle = "rgba(233,196,106,0.9)";
        ctx.fillText("Remove ads · £1.99 GBP", W / 2, py + 158);
      }

      if (overTimer > 20) {
        const pulse = 0.7 + Math.sin(frames * 0.12) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.font = "600 15px Segoe UI, system-ui, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText("Tap to retry", W / 2, py + (adsRemoved ? 164 : 186));
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

  resetGame();
  requestAnimationFrame(loop);
})();
