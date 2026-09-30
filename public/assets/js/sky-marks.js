import { poissonDisk } from './poisson-disk.js';

(() => {
  const background = document.querySelector('.sky-marks');
  if (!background) return;

  const track = document.createElement('div');
  track.className = 'sky-marks-track';
  background.append(track);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let tileHeight = 1;
  let pending = false;

  function draw() {
    pending = false;
    const offset = reducedMotion.matches ? 0 : Math.max(0, window.scrollY) / 10;
    track.style.transform = `translate3d(0, ${-(offset % tileHeight)}px, 0)`;
  }

  function scheduleDraw() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(draw);
  }

  function resize() {
    const width = Math.max(1, background.clientWidth);
    tileHeight = Math.max(2000, background.clientHeight * 2);
    const maxSize = Math.min(width / 3, 260);
    // Circumscribed circles guarantee separation at every rotation and size.
    const distance = maxSize * Math.SQRT2 + 18;
    const points = poissonDisk(width, tileHeight, distance);
    const marks = document.createDocumentFragment();
    for (const point of points) {
      const size = maxSize * (0.72 + Math.random() * 0.28);
      const rotation = Math.random() * 120 - 60;
      const className = `sky-mark ${Math.random() < 0.5 ? 'moon' : 'star'}${Math.random() < 0.5 ? ' blue' : ''}`;
      // Copies continue clipped marks across both edges of the seamless tile.
      for (const dx of [-width, 0, width]) {
        if (point.x + dx + size / Math.SQRT2 < 0
          || point.x + dx - size / Math.SQRT2 > width) continue;
        for (const dy of [-tileHeight, 0, tileHeight]) {
          const mark = document.createElement('span');
          mark.className = className;
          mark.style.left = `${point.x + dx}px`;
          mark.style.top = `${point.y + dy}px`;
          mark.style.setProperty('--size', `${size}px`);
          mark.style.setProperty('--rotation', `${rotation}deg`);
          marks.append(mark);
        }
      }
    }
    track.replaceChildren(marks);
    scheduleDraw();
  }

  window.addEventListener('scroll', scheduleDraw, { passive: true });
  window.addEventListener('resize', resize);
  reducedMotion.addEventListener('change', scheduleDraw);
  resize();
})();
