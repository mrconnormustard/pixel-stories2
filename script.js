// --- Base config ---
const BASE_W = 160, BASE_H = 144;
const FPS = 12;

window.addEventListener('load', () => {
  // Canvas
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  // Integer scaling: pick largest whole-number scale that fits window
  function applyIntegerScale() {
    const sw = Math.floor(window.innerWidth  / BASE_W);
    const sh = Math.floor(window.innerHeight / BASE_H);
    const scale = Math.max(1, Math.min(sw, sh));
    canvas.style.width  = (BASE_W * scale) + 'px';
    canvas.style.height = (BASE_H * scale) + 'px';
  }
  window.addEventListener('resize', applyIntegerScale);
  applyIntegerScale();

  // --- Load backgrounds (per scene) ---
  const backgrounds = [];
  for (let i = 1; i <= 10; i++) {
    const img = new Image();
    img.src = `background${i}.png`; // filenames: background1.png ... background10.png
    img.onload  = () => console.log(`Loaded: background${i}.png (${img.width}x${img.height})`);
    img.onerror = (e) => console.error(`Failed: background${i}.png`, e);
    backgrounds.push(img);
  }

  // --- Load princess sprite (shared across scenes) ---
  const princess = new Image();
  princess.onload  = () => console.log('princess.png loaded:', princess.width, 'x', princess.height);
  princess.onerror = (e) => console.error('princess.png failed to load', e);
  princess.src = 'princess.png'; // e.g., 16x24 in same folder

  // --- 10-scene story: princess in the valley of light ---
  // Each scene can nudge the sprite by px/py, and decide whether to show her.
  // Optional spriteX/spriteY to override default centered position.
  const SCENES = [
    { text: "In a quiet valley,",            showPrincess: true,  px: 0,  py: -2, spriteX: 60, spriteY: 90, },
    { text: "morning light gathered.",       showPrincess: true,  px: 1,  py: -1 },
    { text: "The princess listened",         showPrincess: true,  px: 0,  py: 0  },
    { text: "to rivers of silver wind.",     showPrincess: false, px: 0,  py: 0  }, // no sprite
    { text: "Mountains breathed slow.",      showPrincess: false, px: 0,  py: 0  },
    { text: "Flowers woke like lanterns.",   showPrincess: true,  px: 1,  py: 0  },
    { text: "A path opened softly.",         showPrincess: true,  px: 0,  py: 0,  spriteX: 20 }, // left side
    { text: "She stepped without hurry.",    showPrincess: true,  px: -1, py: 0,  spriteX: 110 }, // right side
    { text: "Light welcomed her home.",      showPrincess: true,  px: 0,  py: -1 },
    { text: "And the valley glowed.",        showPrincess: false, px: 0,  py: 0  }
  ];
  let scene = 0;

  // --- Palette ---
  const BOX = "rgb(16,36,16)";
  const TXT = "rgb(255,255,210)";
  const SHD = "rgb(10,10,10)";

  // --- Main draw loop ---
  let last = 0;
  function loop(ts) {
    if (!last) last = ts;
    const step = 1000 / FPS;
    if (ts - last >= step) {
      last += step;

      // Background for current scene (fallback fill if not ready)
      const bgImg = backgrounds[scene];
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0);
      } else {
        ctx.fillStyle = "rgb(30,30,30)";
        ctx.fillRect(0, 0, BASE_W, BASE_H);
      }

      // Princess - only on selected scenes
      const s = SCENES[scene];
      if (s.showPrincess && princess.complete && princess.naturalWidth > 0) {
        const pw = princess.width;
        const ph = princess.height;

        // Default centered near bottom, with optional overrides
        const baseX = typeof s.spriteX === 'number' ? s.spriteX : Math.floor((BASE_W - pw) / 2);
        const baseY = typeof s.spriteY === 'number' ? s.spriteY : Math.floor(BASE_H - ph - 20);

        const offsetX = s.px || 0;
        const offsetY = s.py || 0;

        ctx.drawImage(princess, baseX + offsetX, baseY + offsetY, princess.width * 0.8, princess.height * 0.5);
      }

      // Caption box
      const boxH = 40;
      ctx.fillStyle = BOX;
      ctx.fillRect(0, BASE_H - boxH, BASE_W, boxH);

      // Text
      ctx.textAlign = "center";
      ctx.font = "8px monospace";
      const cx = BASE_W / 2;
      const cy = BASE_H - boxH + 18;
      ctx.fillStyle = SHD;
      ctx.fillText(s.text, cx + 1, cy + 1);
      ctx.fillStyle = TXT;
      ctx.fillText(s.text, cx, cy);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // --- Tap/click to advance scene with 0.5s delay + beep ---
  let audioCtx = null;
  function beep() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 22050 });
      }
      const dur = 0.12;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch {}
  }

  // Prevent spamming while waiting for delayed advance
  let pendingAdvance = false;
  const ADVANCE_DELAY_MS = 500;

  function onTap(ev) {
    ev.preventDefault();
    if (pendingAdvance) return;
    pendingAdvance = true;
    beep();

    setTimeout(() => {
      scene = (scene + 1) % SCENES.length;
      pendingAdvance = false;
    }, ADVANCE_DELAY_MS);
  }

  // Pointer listeners
  canvas.addEventListener('mousedown', onTap, { passive: false });
  canvas.addEventListener('touchstart', onTap, { passive: false });
});
