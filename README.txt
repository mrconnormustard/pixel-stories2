Retro 8-bit Web App - Starter Kit

What this is:
- A tiny web app that draws at 160x144 (Game Boy-ish) and scales pixel-perfect to fill your screen.
- Tap to play a square-wave beep. Animation runs at 12 fps for a retro feel.
- It's a PWA (installable). Works great on an Android tablet (Lenovo) in full screen.

Files:
- index.html                -> page shell + canvas
- script.js                 -> pixel demo, input, and WebAudio beep
- manifest.webmanifest      -> PWA manifest for "Add to Home screen"
- sw.js                     -> service worker for offline
- icons/icon-192.png        -> app icon
- icons/icon-512.png        -> app icon (large)

How to run locally on your Mac or Windows:
1) Open a terminal in this folder.
2) Start a simple web server:
   - Python 3:  python -m http.server 8000
   - Node (if installed):  npx http-server -p 8000
3) On your Lenovo tablet:
   - Make sure the tablet is on the same Wi‑Fi as your computer.
   - Find your computer's IP address.
     • Mac: System Settings -> Wi‑Fi -> Details -> IP Address
     • Windows: Command Prompt -> type: ipconfig  (look for IPv4 Address)
   - On the tablet, open Chrome and go to:  http://YOUR-IP:8000
4) Add to Home screen:
   - Chrome menu -> Add to Home screen (or Install App).
   - Launch it from the home icon. It will open full-screen.
5) Try it:
   - You'll see a pixel block moving. Tap the screen to hear a beep and flip its direction.

How to change base resolution:
- Open script.js and index.html. The canvas width/height are set to 160x144.
- You can change to 256x240 or 320x240, then keep your art tiny and blocky.
- The CSS ensures nearest-neighbor scaling with image-rendering: pixelated.

Next steps:
- Replace the colored rectangles with your own tiny PNG sprites.
- Keep all art at its native size; do not stretch except by integer factors.
- Add scenes and simple UI by drawing more rectangles, text, and images to the canvas.
- If you want short "video", draw preprocessed 160x120 frames at 12–15 fps.

Troubleshooting:
- If it looks blurry: check Chrome zoom is 100%, and ensure canvas is 160x144 in markup.
- If Add to Home screen does not appear, try reloading the page; the service worker may need one load.
- If sound doesn't play, be sure you tapped the canvas first (user gesture unlocks WebAudio).
