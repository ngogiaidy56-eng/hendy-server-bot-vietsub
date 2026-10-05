/**
 * apps/vietsub-wasm-studio/src/web-builder/player-template.js
 * Module 3: Interactive Subtitle Web Landing Page Builder Generator
 */

export function generateInteractivePlayerHtml({ title, r2VideoUrl, r2AssUrl }) {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${title} — Vietsub WASM Player</title>
</head>
<body style="margin:0;background:#0B0F17;color:#F8FAFC;">
  <video id="cyber-player" src="${r2VideoUrl}" controls style="width:100%;max-width:1280px;"></video>
  <script type="module">
    import { SubtitlesOctopusWASM } from '@cyber/vietsub-sdk';
    const player = new SubtitlesOctopusWASM({
      videoElement: document.getElementById('cyber-player'),
      subUrl: '${r2AssUrl}'
    });
    player.mountAndRender();
  </script>
</body>
</html>`;
}
