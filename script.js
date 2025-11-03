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

  // --- Load images (with logging) ---
  const bg = new Image();
  bg.onload = () => console.log('background.png loaded:', bg.width, 'x', bg.height);
  bg.onerror = (e) => console.error('background.png failed to load', e);
  bg.src = 'background.png';   // must be 160x144 and in same folder as index.html

  const princess = new Image();
  princess.onload = () => console.log('princess.png loaded:', princess.width, 'x', princess.height);
  princess.onerror = (e) => console.error('princess.png failed to load', e);
  princess.src = 'princess.png'; // e.g., 16x24, same folder

  // --- Story text ---
  const story = [
    "In a quiet valley,",
    "the princess waited,",
    "as dawn painted the sky."
  ];
  let line = 0;

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

      // Background (fallback if not loaded yet)
      if (bg.complete && bg.naturalWidth > 0) {
        ctx.drawImage(bg, 0, 0);
      } else {
        ctx.fillStyle = "rgb(30,30,30)";
        ctx.fillRect(0, 0, BASE_W, BASE_H);
      }

      // Princess (centered near bottom)
      if (princess.complete && princess.naturalWidth > 0) {
        const pw = princess.width;
        const ph = princess.height;
        ctx.drawImage(princess, (BASE_W - pw) / 2, BASE_H - ph - 20);
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
      ctx.fillText(story[line], cx + 1, cy + 1);
      ctx.fillStyle = TXT;
      ctx.fillText(story[line], cx, cy);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // --- Tap/click to advance line + beep ---
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

  function onTap(ev) {
    ev.preventDefault();
    beep();
    line = (line + 1) % story.length;
  }
  canvas.addEventListener('mousedown', onTap, { passive: false });
  canvas.addEventListener('touchstart', onTap, { passive: false });
});
