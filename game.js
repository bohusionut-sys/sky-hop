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
    birdBody: "#e76f51",
    birdBelly: "#f4a261",
    birdWing: "#c44536",
    birdBeak: "#f4d35e",
    birdEye: "#1a1a2e",
    birdCrest: "#9b2226",
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
    // Thursday in current week decides the year
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
    // Deterministic-ish variety from period string
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
    // Keep player on board even if below cut if they had a best — already sliced
    // If player was cut, ensure their best still shows if it's top-worthy; otherwise drop
    const stillYou = data.entries.some((e) => e.isYou);
    if (!stillYou && playerScore > 0) {
      // Replace lowest if better
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

  // --- DOM: leaderboard / promo / ads ---
  const lbList = document.getElementById("lb-list");
  const lbPeriodLabel = document.getElementById("lb-period-label");
  const lbTabs = document.querySelectorAll(".lb-tab");
  const nameInput = document.getElementById("player-name");
  const promoOffer = document.getElementById("promo-offer");
  const promoThanks = document.getElementById("promo-thanks");
  const btnBuyAds = document.getElementById("btn-buy-ads");
  const adOverlay = document.getElementById("ad-overlay");
  const adCountdown = document.getElementById("ad-countdown");
  const adContinue = document.getElementById("ad-continue");
  const checkoutModal = document.getElementById("checkout-modal");
  const checkoutCancel = document.getElementById("checkout-cancel");
  const checkoutConfirm = document.getElementById("checkout-confirm");

  let activePeriod = "daily";

  function refreshLeaderboardUI() {
    // Rollover check happens in loadBoard
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
    } else {
      promoOffer.classList.remove("hidden");
      promoThanks.classList.add("hidden");
    }
  }

  function persistCoins() {
    localStorage.setItem(COINS_KEY, String(coins));
  }

  function persistRuns() {
    localStorage.setItem(RUNS_KEY, String(runsSinceAd));
  }

  function persistAdsRemoved() {
    localStorage.setItem(ADS_REMOVED_KEY, adsRemoved ? "1" : "0");
  }

  nameInput.value = playerName;
  nameInput.addEventListener("change", () => {
    playerName = (nameInput.value.trim() || "You").slice(0, 16);
    nameInput.value = playerName;
    localStorage.setItem(NAME_KEY, playerName);
    // Rename "you" entries on all boards for current periods
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

  btnBuyAds.addEventListener("click", () => {
    if (adsRemoved) return;
    checkoutModal.classList.remove("hidden");
    checkoutModal.setAttribute("aria-hidden", "false");
  });

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
        }
      });
      return;
    }
    state = STATE.PLAYING;
  }

  function flap() {
    if (adBlocking) return;
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
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: bird.x - 6,
        y: bird.y + 4,
        vx: -1.5 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 2.5,
        life: 18 + Math.random() * 10,
        max: 28,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? C.birdBelly : C.accent,
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

    // Distance traveled (horizontal scroll pixels)
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
    }

    if (!adsRemoved) {
      runsSinceAd += 1;
      persistRuns();
    }

    updateLeaderboardsOnScore(score);
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

  function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rot);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(2, BIRD_R + 4, BIRD_R * 0.9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.birdBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R + 2, BIRD_R, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.birdBelly;
    ctx.beginPath();
    ctx.ellipse(2, 4, BIRD_R * 0.7, BIRD_R * 0.65, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.birdCrest;
    ctx.beginPath();
    ctx.moveTo(-4, -BIRD_R + 2);
    ctx.quadraticCurveTo(-2, -BIRD_R - 10, 6, -BIRD_R - 2);
    ctx.quadraticCurveTo(2, -BIRD_R - 4, -2, -BIRD_R + 4);
    ctx.fill();

    const wingAngle = bird.wing > 0 ? -0.7 : 0.35 + Math.sin(frames * 0.35) * 0.08;
    ctx.save();
    ctx.translate(-2, 2);
    ctx.rotate(wingAngle);
    ctx.fillStyle = C.birdWing;
    ctx.beginPath();
    ctx.ellipse(-4, 0, 10, 7, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.ellipse(-5, -2, 5, 3, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(8, -4, 5.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.birdEye;
    ctx.beginPath();
    ctx.arc(10, -4, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(11, -5.2, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.birdBeak;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(22, 2);
    ctx.lineTo(12, 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, 2.5);
    ctx.lineTo(20, 2.5);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 150, 140, 0.45)";
    ctx.beginPath();
    ctx.ellipse(4, 2, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();

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

  function drawCoinIcon(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = C.coin;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHUD() {
    // Coin balance (always)
    ctx.textAlign = "left";
    ctx.font = "bold 16px Segoe UI, system-ui, sans-serif";
    drawCoinIcon(18, 22, 8);
    ctx.fillStyle = C.hudShadow;
    ctx.fillText(String(coins), 32 + 1, 27 + 1);
    ctx.fillStyle = C.coin;
    ctx.fillText(String(coins), 32, 27);

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
      const ph = 188;
      const px = (W - pw) / 2;
      const py = H * 0.30;
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

      if (overTimer > 20) {
        const pulse = 0.7 + Math.sin(frames * 0.12) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.font = "600 15px Segoe UI, system-ui, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText("Tap to retry", W / 2, py + 164);
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
