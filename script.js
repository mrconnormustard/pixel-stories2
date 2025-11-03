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
  // spriteX/spriteY override default centered near bottom
  // scale optional per scene (1 = original size)
  const SCENES = [
    { text: "In a quiet valley,",            showPrincess: true,  px: 0,  py: -2 },
    { text: "morning light gathered.",       showPrincess: true,  px: 1,  py: -1 },
    { text: "The princess listened",         showPrincess: true,  px: 0,  py: 0  },
    { text: "to rivers of silver wind.",     showPrincess: false, px: 0,  py: 0  },
    { text: "Mountains breathed slow.",      showPrincess: false, px: 0,  py: 0  },
    { text: "Flowers woke like lanterns.",   showPrincess: true,  px: 1,  py: 0  },
    { text: "A path opened softly.",         showPrincess: true,  px: 0,  py: 0,  spriteX: 20 },
    { text: "She stepped without hurry.",    showPrincess: true,  px: -1, py: 0,  spriteX: 110 },
    { text: "Light welcomed her home.",      showPrincess: true,  px: 0,  py: -1 },
    { text: "And the valley glowed.",        showPrincess: false, px: 0,  py: 0  }
  ];
  let scene = 0;

  // --- Load saved per-scene overrides from localStorage (if any) ---
  const OV_KEY = 'pixelstories_scene_overrides_v1';
  function loadOverrides() {
    try {
      const raw = localStorage.getItem(OV_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      data.forEach((ov, i) => {
        if (!ov) return;
        SCENES[i] = { ...SCENES[i], ...ov };
      });
      console.log('Loaded scene overrides from localStorage');
    } catch (e) {
      console.warn('Failed to load overrides', e);
    }
  }
  function saveOverrides() {
    try {
      const compact = SCENES.map(s => {
        const out = {};
        if ('spriteX' in s) out.spriteX = s.spriteX;
        if ('spriteY' in s) out.spriteY = s.spriteY;
        if ('scale'   in s) out.scale   = s.scale;
        if ('showPrincess' in s) out.showPrincess = s.showPrincess;
        return Object.keys(out).length ? out : null;
      });
      localStorage.setItem(OV_KEY, JSON.stringify(compact));
    } catch (e) {
      console.warn('Failed to save overrides', e);
    }
  }
  loadOverrides();

  // --- Palette ---
  const BOX = "rgb(16,36,16)";
  const TXT = "rgb(255,255,210)";
  const SHD = "rgb(10,10,10)";

  // --- Editor state for live adjustments ---
  let editMode = false;
  let showGrid = false;

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

      // Optional editor grid
      if (showGrid) {
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = "#ffffff";
        for (let x = 0; x <= BASE_W; x += 8) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BASE_H); ctx.stroke();
        }
        for (let y = 0; y <= BASE_H; y += 8) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BASE_W, y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Princess - only on selected scenes
      const s = SCENES[scene];
      if (s.showPrincess && princess.complete && princess.naturalWidth > 0) {
        const pw = princess.width;
        const ph = princess.height;

        const defaultX = Math.floor((BASE_W - pw) / 2);
        const defaultY = Math.floor(BASE_H - ph - 20);

        const baseX = typeof s.spriteX === 'number' ? s.spriteX : defaultX;
        const baseY = typeof s.spriteY === 'number' ? s.spriteY : defaultY;

        const offsetX = s.px || 0;
        const offsetY = s.py || 0;

        const scale = typeof s.scale === 'number' ? s.scale : 1;
        const dw = Math.max(1, Math.round(pw * scale));
        const dh = Math.max(1, Math.round(ph * scale));

        ctx.drawImage(princess, baseX + offsetX, baseY + offsetY, dw, dh);
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

      // Editor HUD
      if (editMode) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, BASE_W, 18);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.font = "8px monospace";
        const sx = (typeof s.spriteX === 'number') ? s.spriteX : Math.floor((BASE_W - (princess.width||0)) / 2);
        const sy = (typeof s.spriteY === 'number') ? s.spriteY : Math.floor(BASE_H - (princess.height||0) - 20);
        const sc = (typeof s.scale === 'number') ? s.scale.toFixed(2) : '1.00';
        const hud = `EDIT s:${scene+1}/10  X:${sx}  Y:${sy}  scale:${sc}  [Arrows] move  Shift=5px  +/- scale  0 reset  [ ] scene  G grid  Enter exit  C copy`;
        ctx.fillText(hud, 4, 12);
      }
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

  let pendingAdvance = false;
  const ADVANCE_DELAY_MS = 500;

  function onTap(ev) {
    ev.preventDefault();
    if (pendingAdvance || editMode) return; // do not advance while editing
    pendingAdvance = true;
    beep();
    setTimeout(() => {
      scene = (scene + 1) % SCENES.length;
      pendingAdvance = false;
    }, ADVANCE_DELAY_MS);
  }

  canvas.addEventListener('mousedown', onTap, { passive: false });
  canvas.addEventListener('touchstart', onTap, { passive: false });

  // --- Keyboard controls for live positioning ---
  // Enter - toggle edit mode
  // Arrows - move spriteX/Y (Shift = 5px steps)
  // + / - - scale up or down
  // 0 - reset scale to 1
  // [ and ] - prev or next scene
  // G - toggle grid
  // C - copy SCENES JSON to console
  window.addEventListener('keydown', (ev) => {
    const s = SCENES[scene];
    if (ev.key === 'Enter') {
      editMode = !editMode;
      return;
    }
    if (!editMode) return;

    const step = ev.shiftKey ? 5 : 1;
    // Ensure spriteX/Y exist so moves are deterministic
    if (s.showPrincess) {
      if (typeof s.spriteX !== 'number') s.spriteX = Math.floor((BASE_W - (princess.width||0)) / 2);
      if (typeof s.spriteY !== 'number') s.spriteY = Math.floor(BASE_H - (princess.height||0) - 20);
    }

    let changed = false;

    switch (ev.key) {
      case 'ArrowLeft':
        if (s.showPrincess) { s.spriteX = Math.max(-64, s.spriteX - step); changed = true; }
        break;
      case 'ArrowRight':
        if (s.showPrincess) { s.spriteX = Math.min(BASE_W + 64, s.spriteX + step); changed = true; }
        break;
      case 'ArrowUp':
        if (s.showPrincess) { s.spriteY = Math.max(-64, s.spriteY - step); changed = true; }
        break;
      case 'ArrowDown':
        if (s.showPrincess) { s.spriteY = Math.min(BASE_H + 64, s.spriteY + step); changed = true; }
        break;
      case '+':
      case '=': {
        if (s.showPrincess) {
          s.scale = typeof s.scale === 'number' ? s.scale : 1;
          s.scale = Math.min(3, s.scale + 0.05);
          changed = true;
        }
        break;
      }
      case '-': {
        if (s.showPrincess) {
          s.scale = typeof s.scale === 'number' ? s.scale : 1;
          s.scale = Math.max(0.2, s.scale - 0.05);
          changed = true;
        }
        break;
      }
      case '0': {
        if (s.showPrincess) {
          s.scale = 1;
          changed = true;
        }
        break;
      }
      case '[':
        scene = (scene - 1 + SCENES.length) % SCENES.length;
        break;
      case ']':
        scene = (scene + 1) % SCENES.length;
        break;
      case 'g':
      case 'G':
        showGrid = !showGrid;
        break;
      case 'c':
      case 'C':
        console.log('--- Copy SCENES JSON below ---');
        console.log(JSON.stringify(SCENES, null, 2));
        break;
      case 'h':
      case 'H':
        // Toggle princess visibility for current scene
        s.showPrincess = !s.showPrincess;
        changed = true;
        break;
    }

    if (changed) saveOverrides();
  });
});
