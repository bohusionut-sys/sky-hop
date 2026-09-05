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
  const BEST_KEY = "skyHopBest";

  // --- State ---
  const STATE = { READY: 0, PLAYING: 1, OVER: 2 };
  let state = STATE.READY;
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  let frames = 0;
  let pipeSpeed = PIPE_SPEED_BASE;
  let pipeGap = PIPE_GAP_BASE;

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
  };

  function resetGame() {
    state = STATE.READY;
    score = 0;
    frames = 0;
    pipeSpeed = PIPE_SPEED_BASE;
    pipeGap = PIPE_GAP_BASE;
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

  function flap() {
    if (state === STATE.OVER) {
      if (overTimer > 20) resetGame();
      return;
    }
    if (state === STATE.READY) state = STATE.PLAYING;
    bird.vy = FLAP;
    bird.wing = 8;
    // flap particles
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

    // idle bob in ready
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

    // difficulty ramp
    pipeSpeed = PIPE_SPEED_BASE + Math.min(1.6, score * 0.04);
    pipeGap = Math.max(100, PIPE_GAP_BASE - Math.min(28, score * 0.6));

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

    // recycle pipes
    while (pipes.length && pipes[0].x + PIPE_WIDTH < -10) {
      pipes.shift();
      const lastX = pipes[pipes.length - 1].x;
      spawnPipe(lastX + PIPE_SPACING);
    }

    // collisions
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

    // soft sun
    ctx.beginPath();
    ctx.arc(W - 70, 70, 36, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 236, 179, 0.85)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W - 70, 70, 52, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 220, 140, 0.2)";
    ctx.fill();

    // clouds
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

    // top pipe (from top down to gapTop)
    drawPipeSegment(p.x, 0, PIPE_WIDTH, gapTop, true);
    // bottom pipe
    drawPipeSegment(p.x, gapBot, PIPE_WIDTH, floorY - gapBot, false);
  }

  function drawPipeSegment(x, y, w, h, isTop) {
    if (h <= 0) return;
    // body
    const bodyG = ctx.createLinearGradient(x, 0, x + w, 0);
    bodyG.addColorStop(0, C.pipeDark);
    bodyG.addColorStop(0.25, C.pipeHighlight);
    bodyG.addColorStop(0.55, C.pipe);
    bodyG.addColorStop(1, C.pipeDark);
    ctx.fillStyle = bodyG;
    ctx.fillRect(x + 4, y, w - 8, h);

    // rim (cap)
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

    // gold band on rim
    ctx.fillStyle = C.pipeRim;
    ctx.fillRect(x - rimExpand + 2, rimY + 4, w + rimExpand * 2 - 4, 4);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(x - rimExpand + 2, rimY + 4, w + rimExpand * 2 - 4, 1.5);

    // subtle edge lines on body
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
    // dirt
    ctx.fillStyle = C.dirt;
    ctx.fillRect(0, y + 22, W, GROUND_H - 22);
    // grass strip
    const gg = ctx.createLinearGradient(0, y, 0, y + 28);
    gg.addColorStop(0, "#5cb87a");
    gg.addColorStop(1, C.groundDark);
    ctx.fillStyle = gg;
    ctx.fillRect(0, y, W, 28);

    // scrolling grass tufts
    ctx.fillStyle = C.ground;
    for (let x = -groundOffset; x < W + 48; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, y + 14);
      ctx.lineTo(x + 8, y + 2);
      ctx.lineTo(x + 16, y + 14);
      ctx.fill();
    }

    // dirt speckles
    ctx.fillStyle = C.dirtDark;
    for (let x = -groundOffset * 0.5; x < W + 40; x += 40) {
      ctx.fillRect(x + 6, y + 40, 6, 4);
      ctx.fillRect(x + 22, y + 58, 8, 3);
      ctx.fillRect(x + 10, y + 72, 5, 4);
    }

    // top edge line
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(0, y, W, 2);
  }

  function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rot);

    // soft shadow
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(2, BIRD_R + 4, BIRD_R * 0.9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // body
    ctx.fillStyle = C.birdBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R + 2, BIRD_R, 0, 0, Math.PI * 2);
    ctx.fill();

    // belly
    ctx.fillStyle = C.birdBelly;
    ctx.beginPath();
    ctx.ellipse(2, 4, BIRD_R * 0.7, BIRD_R * 0.65, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // crest
    ctx.fillStyle = C.birdCrest;
    ctx.beginPath();
    ctx.moveTo(-4, -BIRD_R + 2);
    ctx.quadraticCurveTo(-2, -BIRD_R - 10, 6, -BIRD_R - 2);
    ctx.quadraticCurveTo(2, -BIRD_R - 4, -2, -BIRD_R + 4);
    ctx.fill();

    // wing
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

    // eye white
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(8, -4, 5.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // pupil
    ctx.fillStyle = C.birdEye;
    ctx.beginPath();
    ctx.arc(10, -4, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(11, -5.2, 1, 0, Math.PI * 2);
    ctx.fill();

    // beak
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

    // cheek blush
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

  function drawHUD() {
    // score during play
    if (state === STATE.PLAYING || state === STATE.OVER) {
      ctx.textAlign = "center";
      ctx.font = "bold 42px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = C.hudShadow;
      ctx.fillText(String(score), W / 2 + 2, 58 + 2);
      ctx.fillStyle = C.hud;
      ctx.fillText(String(score), W / 2, 58);
    }

    if (state === STATE.READY) {
      // title
      ctx.textAlign = "center";
      ctx.font = "bold 44px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = C.hudShadow;
      ctx.fillText("Sky Hop", W / 2 + 2, 120 + 2);
      ctx.fillStyle = C.accent;
      ctx.fillText("Sky Hop", W / 2, 120);
      ctx.font = "600 16px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText("Tap · Click · Space · ↑", W / 2, 158);

      // panel
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
      const ph = 160;
      const px = (W - pw) / 2;
      const py = H * 0.32;
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
      ctx.fillText("Game Over", W / 2, py + 38);

      ctx.font = "16px Segoe UI, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`Score  ${score}`, W / 2, py + 72);
      ctx.fillText(`Best   ${best}`, W / 2, py + 96);

      if (overTimer > 20) {
        const pulse = 0.7 + Math.sin(frames * 0.12) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.font = "600 15px Segoe UI, system-ui, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText("Tap to retry", W / 2, py + 132);
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
    // catch up at ~60fps steps without spiral
    if (dt > 100) dt = STEP;
    while (dt >= STEP) {
      update();
      dt -= STEP;
      last += STEP;
    }
    // if we fell behind, resync
    if (ts - last > STEP * 3) last = ts;
    draw();
    requestAnimationFrame(loop);
  }

  resetGame();
  requestAnimationFrame(loop);
})();
