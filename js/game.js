// =========================
// GAME MODULE
// =========================

import LEVEL_CONFIG, { LEVELS } from "./levels.js";
import { beep, continuousClaps } from "./audio.js";

// DOM Elements
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const uiLevel = document.getElementById("uiLevel");
const uiHearts = document.getElementById("uiHearts");
const uiHeartsTotal = document.getElementById("uiHeartsTotal");
const uiTime = document.getElementById("uiTime");
const uiBest = document.getElementById("uiBest");

const overlay = document.getElementById("overlay");
const ovTitle = document.getElementById("ovTitle");
const ovText = document.getElementById("ovText");

const btnStart = document.getElementById("btnStart");
const btnHow = document.getElementById("btnHow");
const btnRestart = document.getElementById("btnRestart");
const btnMute = document.getElementById("btnMute");

// Canvas dimensions
const W = canvas.width;
const H = canvas.height;

// Game state
const keys = new Set();
let running = false;
let last = 0;
let elapsed = 0;
let heartsCollected = 0;

let winning = false;
let winFxTimer = 0;
let winFxBurst = [];

let currentLevel = 1;
let levelConfig = LEVELS[currentLevel];

let bestTime = Number(localStorage.getItem("vd_best") || "0");
uiBest.textContent = bestTime ? bestTime.toFixed(1) + "s" : "—";

const player = {
  x: W * 0.2,
  y: H * 0.55,
  r: 18,
  vx: 0,
  vy: 0,
  hitTimer: 0,
};

let hearts = [];
let thorns = [];

// =========================
// UTILITY FUNCTIONS
// =========================

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

// =========================
// SPAWN LOGIC
// =========================

function nonOverlappingSpawn(r, avoidList, tries = 500) {
  for (let i = 0; i < tries; i++) {
    const x = rand(40, W - 40);
    const y = rand(60, H - 40);
    let ok = true;
    for (const a of avoidList) {
      const rr = (a.r ?? 18) + r + 10;
      if (dist2(x, y, a.x, a.y) < rr * rr) {
        ok = false;
        break;
      }
    }
    if (ok) return { x, y };
  }
  return { x: rand(40, W - 40), y: rand(60, H - 40) };
}

function resetWorld() {
  elapsed = 0;
  heartsCollected = 0;
  player.x = W * 0.2;
  player.y = H * 0.55;
  player.hitTimer = 0;

  hearts = [];
  thorns = [];

  // spawn hearts
  const avoid = [{ x: player.x, y: player.y, r: player.r }];
  for (let i = 0; i < levelConfig.hearts; i++) {
    const p = nonOverlappingSpawn(14, avoid);
    hearts.push({
      x: p.x,
      y: p.y,
      r: 14,
      taken: false,
      bob: rand(0, Math.PI * 2),
    });
    avoid.push({ x: p.x, y: p.y, r: 18 });
  }

  // spawn thorns
  for (let i = 0; i < levelConfig.thorns; i++) {
    const p = nonOverlappingSpawn(18, avoid);
    const a = rand(0, Math.PI * 2);
    thorns.push({
      x: p.x,
      y: p.y,
      r: 18,
      vx:
        Math.cos(a) *
        rand(levelConfig.thornSpeed * 0.7, levelConfig.thornSpeed * 1.2),
      vy:
        Math.sin(a) *
        rand(levelConfig.thornSpeed * 0.7, levelConfig.thornSpeed * 1.2),
    });
    avoid.push({ x: p.x, y: p.y, r: 28 });
  }

  uiLevel.textContent = currentLevel.toString();
  uiHeartsTotal.textContent = levelConfig.hearts;
  uiHearts.textContent = "0";
  uiTime.textContent = levelConfig.timeLimit.toString();
}

// =========================
// INPUT HANDLING
// =========================

window.addEventListener(
  "keydown",
  (e) => {
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "w",
        "a",
        "s",
        "d",
        "W",
        "A",
        "S",
        "D",
        " ",
      ].includes(e.key)
    )
      e.preventDefault();
    keys.add(e.key);
    if (e.key === " " && !running) start();
  },
  { passive: false }
);

window.addEventListener("keyup", (e) => keys.delete(e.key));

// Mobile pad handling
const pad = document.getElementById("pad");
const padState = { up: false, down: false, left: false, right: false };

function setPad(dir, v) {
  padState[dir] = v;
}

function bindPadButton(btn) {
  const dir = btn.dataset.dir;
  const down = (e) => {
    e.preventDefault();
    setPad(dir, true);
  };
  const up = (e) => {
    e.preventDefault();
    setPad(dir, false);
  };
  btn.addEventListener("pointerdown", down);
  btn.addEventListener("pointerup", up);
  btn.addEventListener("pointercancel", up);
  btn.addEventListener("pointerleave", up);
}
[...pad.querySelectorAll("button[data-dir]")].forEach(bindPadButton);

// Button handlers
btnStart.onclick = () => {
  // Check if we're progressing to next level or starting game
  if (btnStart.textContent === "Next Level") {
    currentLevel++;
    levelConfig = LEVELS[currentLevel];
  } else {
    // Starting fresh game, reset to level 1
    currentLevel = 1;
    levelConfig = LEVELS[currentLevel];
  }
  start();
};
btnRestart.onclick = () => {
  // Restart the current level
  endOverlay();
  start();
};
btnHow.onclick = () => {
  ovTitle.textContent = "How to play";
  ovText.textContent =
    "Move with WASD/Arrow Keys. Collect all hearts before the timer hits zero. Touch controls appear on phones. Avoid thorny roses — they cost time!";
};
btnMute.onclick = () => {
  import("./audio.js").then((audioModule) => {
    const enabled = audioModule.toggleSound();
    btnMute.textContent = "Sound: " + (enabled ? "On" : "Off");
    if (enabled) beep(660, 0.06, "sine", 0.04);
  });
};

// =========================
// UI FUNCTIONS
// =========================

function showOverlay(title, text, startLabel = "Start") {
  overlay.classList.add("show");
  ovTitle.textContent = title;
  ovText.textContent = text;
  btnStart.textContent = startLabel;
}

function endOverlay() {
  overlay.classList.remove("show");
}

// =========================
// GAME FLOW
// =========================

function start() {
  resetWorld();
  endOverlay();
  running = true;
  last = performance.now();
  beep(523.25, 0.05, "triangle", 0.05);
  requestAnimationFrame(loop);
}

function startWinCelebration() {
  winning = true;
  winFxTimer = LEVEL_CONFIG.winFxTimer;
  winFxBurst = [];

  // Falling flowers/petals from the top
  const count = 60;
  for (let i = 0; i < count; i++) {
    winFxBurst.push({
      x: rand(20, W - 20),
      y: rand(-H * 0.6, -20),
      vx: rand(-35, 35),
      vy: rand(60, 160),
      life: rand(0.9, 1.6),
      r: rand(4, 9),
      rot: rand(0, Math.PI * 2),
      vr: rand(-4, 4),
      wob: rand(0, Math.PI * 2),
      hue: rand(325, 355),
    });
  }

  continuousClaps(1.2);
}

function updateWinCelebration(dt) {
  if (!winning) return;

  winFxTimer -= dt;

  for (const p of winFxBurst) {
    p.life -= dt;
    p.wob += dt * rand(2.0, 3.2);

    // gentle side-to-side drift + gravity
    p.vx += Math.sin(p.wob) * 8 * dt;
    p.vy += 120 * dt;

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;

    // wrap horizontally
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;
  }

  // remove dead or off-screen particles
  winFxBurst = winFxBurst.filter((p) => p.life > 0 && p.y < H + 40);

  if (winFxTimer <= 0) winning = false;
}

function drawWinCelebration() {
  if (!winning) return;

  // Title card
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(ctx, W / 2 - 190, H / 2 - 78, 380, 156, 18);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "900 46px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("YOU WIN!", W / 2, H / 2 - 10);

  ctx.font = "700 16px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillStyle = "rgba(255,255,255,0.80)";
  ctx.fillText("🌸 petals for you 🌸", W / 2, H / 2 + 22);
  ctx.restore();

  // Falling flowers on top of everything
  for (const p of winFxBurst) {
    const a = Math.max(0, Math.min(1, p.life / 1.6));
    ctx.globalAlpha = 0.9 * a;
    drawFlower(p.x, p.y, p.r, p.rot, p.hue);
  }
  ctx.globalAlpha = 1;
}

function finishWin() {
  running = false;
  const timeUsed = elapsed;
  if (!bestTime || timeUsed < bestTime) {
    bestTime = timeUsed;
    localStorage.setItem("vd_best", bestTime.toString());
    uiBest.textContent = bestTime.toFixed(1) + "s";
  }

  beep(784, 0.06, "sine", 0.06);
  beep(988, 0.08, "sine", 0.06);

  // Check if there's a next level
  const hasNextLevel = LEVELS[currentLevel + 1] !== undefined;
  
  let msg = "";
  let buttonLabel = "Play again";
  
  if (hasNextLevel) {
    // Level complete, but there's more to play
    msg = `${levelConfig.levelTitle} Complete! 💘\n\nReady for the next challenge?`;
    buttonLabel = "Next Level";
  } else {
    // Final level completed
    msg = `${LEVEL_CONFIG.WIN_MESSAGE}\n\n${LEVEL_CONFIG.SIGNATURE}`;
    buttonLabel = "Play again";
  }
  
  const shareHint = navigator.share
    ? "\n\nTip: Use your browser's share button to send this link."
    : "\n\nTip: Copy the page link and send it.";

  showOverlay("You did it! 💘", msg + (hasNextLevel ? "" : shareHint), buttonLabel);
  document.title = "Valentine Dash 💘 (Winner!)";
}

function finishLose() {
  running = false;
  beep(220, 0.1, "sawtooth", 0.05);
  showOverlay(
    "Time's up 💔",
    "One more try — the hearts are waiting!",
    "Try again"
  );
}

// =========================
// MAIN GAME LOOP
// =========================

function loop(t) {
  if (!running) return;
  const dt = Math.min(0.033, (t - last) / 1000);
  last = t;
  elapsed += dt;

  // timer
  const timeLeft = Math.max(0, levelConfig.timeLimit - elapsed);
  uiTime.textContent = Math.ceil(timeLeft).toString();
  if (timeLeft <= 0) {
    finishLose();
    return;
  }

  // player input
  let ix = 0,
    iy = 0;
  const up = keys.has("ArrowUp") || keys.has("w") || keys.has("W") || padState.up;
  const down =
    keys.has("ArrowDown") || keys.has("s") || keys.has("S") || padState.down;
  const left =
    keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || padState.left;
  const right =
    keys.has("ArrowRight") || keys.has("d") || keys.has("D") || padState.right;

  if (up) iy -= 1;
  if (down) iy += 1;
  if (left) ix -= 1;
  if (right) ix += 1;

  const len = Math.hypot(ix, iy) || 1;
  ix /= len;
  iy /= len;

  player.vx = ix * levelConfig.playerSpeed;
  player.vy = iy * levelConfig.playerSpeed;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // bounds
  player.x = clamp(player.x, player.r + 10, W - player.r - 10);
  player.y = clamp(player.y, player.r + 10, H - player.r - 10);

  // thorns movement + bounce
  for (const th of thorns) {
    th.x += th.vx * dt;
    th.y += th.vy * dt;
    if (th.x < th.r + 10) {
      th.x = th.r + 10;
      th.vx *= -1;
    }
    if (th.x > W - th.r - 10) {
      th.x = W - th.r - 10;
      th.vx *= -1;
    }
    if (th.y < th.r + 10) {
      th.y = th.r + 10;
      th.vy *= -1;
    }
    if (th.y > H - th.r - 10) {
      th.y = H - th.r - 10;
      th.vy *= -1;
    }
  }

  // collisions
  if (player.hitTimer > 0) player.hitTimer -= dt;

  // hearts
  for (const h of hearts) {
    h.bob += dt * 2.2;
    if (h.taken) continue;
    const rr = player.r + h.r;
    if (dist2(player.x, player.y, h.x, h.y) < rr * rr) {
      h.taken = true;
      heartsCollected++;
      uiHearts.textContent = heartsCollected.toString();
      beep(880, 0.05, "triangle", 0.05);
      if (heartsCollected >= levelConfig.hearts) {
        running = false;
        setTimeout(() => {
          startWinCelebration();
          const startT = performance.now();
          function fxLoop(now) {
            const dt = Math.min(0.033, (now - (fxLoop._last || now)) / 1000);
            fxLoop._last = now;

            draw(Math.max(0, levelConfig.timeLimit - elapsed));
            updateWinCelebration(dt);
            drawWinCelebration();

            if (winning) {
              requestAnimationFrame(fxLoop);
            } else {
              finishWin();
            }
          }
          requestAnimationFrame(fxLoop);
        }, LEVEL_CONFIG.winFxDelayMs);

        return;
      }
    }
  }

  // thorns hit: subtract time (punishment)
  if (player.hitTimer <= 0) {
    for (const th of thorns) {
      const rr = player.r + th.r;
      if (dist2(player.x, player.y, th.x, th.y) < rr * rr) {
        player.hitTimer = levelConfig.invuln;
        elapsed += 3.0;
        beep(180, 0.08, "square", 0.06);
        break;
      }
    }
  }

  draw(timeLeft);
  requestAnimationFrame(loop);
}

// =========================
// RENDERING
// =========================

function draw(timeLeft) {
  ctx.clearRect(0, 0, W, H);

  // subtle sparkles background
  for (let i = 0; i < 18; i++) {
    const x = ((i * 97 + elapsed * 40) % (W + 120)) - 60;
    const y = ((i * 53 + elapsed * 28) % (H + 120)) - 60;
    const a = 0.1 + 0.08 * Math.sin(elapsed * 1.5 + i);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawWinCelebration();

  // arena frame
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 3;
  roundRect(ctx, 10, 10, W - 20, H - 20, 18);
  ctx.stroke();

  // hearts
  for (const h of hearts) {
    if (h.taken) continue;
    const bobY = Math.sin(h.bob) * 4;
    drawHeart(h.x, h.y + bobY, h.r, "#ff4d9a", "#ffd1e8");
  }

  // thorns
  for (const th of thorns) {
    drawThorn(th.x, th.y, th.r);
  }

  // player (a cute circle with a tiny heart)
  const inv =
    player.hitTimer > 0 ? 0.45 + 0.35 * Math.sin(elapsed * 18) : 1;
  ctx.globalAlpha = inv;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // eyes
  ctx.fillStyle = "rgba(20,10,18,0.85)";
  ctx.beginPath();
  ctx.arc(player.x - 6, player.y - 3, 2.2, 0, Math.PI * 2);
  ctx.arc(player.x + 6, player.y - 3, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // tiny heart on chest
  drawHeart(player.x, player.y + 10, 6, "#ff4d9a", "#ffd1e8");

  // HUD bar (time pressure)
  const barW = W - 44,
    barH = 10;
  const x = 22,
    y = 26;
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  roundRect(ctx, x, y, barW, barH, 999);
  ctx.fill();
  const ratio = clamp(timeLeft / levelConfig.timeLimit, 0, 1);
  ctx.fillStyle =
    ratio > 0.35 ? "rgba(86,255,154,0.75)" : "rgba(255,55,95,0.80)";
  roundRect(ctx, x, y, barW * ratio, barH, 999);
  ctx.fill();
}

// =========================
// DRAWING HELPERS
// =========================

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawHeart(cx, cy, size, fill, shine) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const s = size;
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(s * 0.9, -s * 0.2, s * 0.8, -s * 1.25, 0, -s * 0.65);
  ctx.bezierCurveTo(
    -s * 0.8,
    -s * 1.25,
    -s * 0.9,
    -s * 0.2,
    0,
    s * 0.35
  );
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  // highlight
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(-s * 0.25, -s * 0.35, s * 0.28, s * 0.18, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = shine;
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawThorn(x, y, r) {
  ctx.save();
  ctx.translate(x, y);

  // base
  ctx.fillStyle = "rgba(255,55,95,0.22)";
  ctx.beginPath();
  ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
  ctx.fill();

  // petals/spikes
  ctx.fillStyle = "rgba(255,55,95,0.75)";
  for (let i = 0; i < 8; i++) {
    const a = (i * (Math.PI * 2)) / 8 + elapsed * 0.25;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35);
    ctx.lineTo(Math.cos(a + 0.18) * r * 1.2, Math.sin(a + 0.18) * r * 1.2);
    ctx.lineTo(Math.cos(a - 0.18) * r * 1.2, Math.sin(a - 0.18) * r * 1.2);
    ctx.closePath();
    ctx.fill();
  }

  // center
  ctx.fillStyle = "rgba(20,10,18,0.65)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFlower(x, y, r, rot, hue) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  // petals
  for (let i = 0; i < 5; i++) {
    ctx.rotate((Math.PI * 2) / 5);
    ctx.fillStyle = `hsla(${hue}, 85%, 70%, 0.95)`;
    ctx.beginPath();
    ctx.ellipse(r * 1.2, 0, r * 0.9, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // center
  ctx.fillStyle = "rgba(255, 244, 180, 0.95)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// =========================
// INITIALIZATION
// =========================

showOverlay(
  levelConfig.levelTitle,
  "Collect all hearts before time runs out. Avoid thorny roses — they cost time!",
  "Start"
);
