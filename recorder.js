// R-52 chart recorder: draws the sound trace on the chart paper and drives the panel gauges.
const box = document.querySelector('.r52');
const video = box.querySelector('video');
const chart = box.querySelector('.r52-chart');
const canvas = box.querySelector('.r52-ink');
const pen = box.querySelector('.r52-pen');
const stateLabel = box.querySelector('.r52-state');
const rateLabel = box.querySelector('[data-rate-label]');
const gauge = n => box.querySelector(`[data-gauge="${n}"]`);
const ctx = canvas.getContext('2d');
const calm = matchMedia('(prefers-reduced-motion: reduce)');

let env = null, rate = 100;
fetch('trace.json').then(r => r.json()).then(d => { env = d.env; rate = d.rate; draw(); }).catch(() => {});

const level = t => {
  if (!env) return 0;
  const i = Math.max(0, Math.min(env.length - 1, Math.floor(t * rate)));
  return env[i];
};
// The pen swings around the centre line; the swing grows with loudness.
// Deterministic per pixel, so the same moment always draws the same mark.
const swing = (x, t) => {
  const a = level(t);
  const w = Math.sin(x * 1.37) * 0.6 + Math.sin(x * 0.53 + 1.1) * 0.4;
  return a * w;
};

function size() {
  const r = chart.getBoundingClientRect();
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function draw() {
  const w = canvas.width / Math.min(2, devicePixelRatio || 1);
  const h = canvas.height / Math.min(2, devicePixelRatio || 1);
  ctx.clearRect(0, 0, w, h);
  const dur = video.duration || 0;
  if (!w || !dur) return;
  const mid = h * 0.48, amp = h * 0.38;

  // time scale along the top edge
  ctx.fillStyle = 'rgba(29,35,38,.55)';
  ctx.font = '600 10px "IBM Plex Mono", monospace';
  const stepS = w < 420 ? 4 : 2;
  for (let s = stepS; s < dur; s += stepS) {
    const x = s / dur * w;
    ctx.fillRect(x, 0, 1, 6);
    ctx.fillText(s + 's', x + 3, 11);
  }

  const now = video.currentTime;
  const xNow = now / dur * w;
  const path = (x0, x1) => {
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 1) {
      const y = mid - swing(x, x / w * dur) * amp;
      x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
  };
  // pencil: the rest of the recording, ahead of the pen
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  path(Math.max(0, Math.floor(xNow)), Math.ceil(w));
  ctx.strokeStyle = 'rgba(29,35,38,.22)'; ctx.lineWidth = 1; ctx.stroke();
  // ink: what has played
  if (xNow > 1) {
    path(0, Math.floor(xNow));
    ctx.strokeStyle = '#b8261e'; ctx.lineWidth = 1.6; ctx.stroke();
  }
  // pen tip height
  const y = mid - swing(Math.floor(xNow), now) * amp;
  pen.style.setProperty('--pen-y', y.toFixed(1) + 'px');
}

function gauges() {
  const t = video.currentTime;
  let ahead = 0;
  for (let i = 0; i < video.buffered.length; i++) {
    if (video.buffered.start(i) <= t + 0.05 && video.buffered.end(i) >= t) ahead = video.buffered.end(i) - t;
  }
  gauge('buf').textContent = ahead.toFixed(1) + 's';
  const q = video.getVideoPlaybackQuality ? video.getVideoPlaybackQuality() : null;
  gauge('drop').textContent = q ? String(q.droppedVideoFrames) : '–';
  const l = video.muted || video.paused ? 0 : level(t) * video.volume;
  gauge('lvl').textContent = l > 0.01 ? (20 * Math.log10(l)).toFixed(0) + ' dB' : '-∞';
}

function setState(s, label) {
  box.dataset.state = s;
  stateLabel.textContent = label;
}
const syncState = () => {
  if (video.error) return setState('fault', 'Fault');
  if (video.ended) return setState('hold', 'End');
  if (video.paused) return setState('hold', 'Hold');
  setState(video.readyState < 3 ? 'wait' : 'run', video.readyState < 3 ? 'Load' : 'Run');
};
['play', 'playing', 'pause', 'ended', 'waiting', 'stalled', 'canplay', 'error', 'emptied'].forEach(e => video.addEventListener(e, syncState));
video.addEventListener('ratechange', () => { rateLabel.textContent = video.playbackRate + '×'; });

let raf = 0;
function loop() {
  draw(); gauges();
  raf = video.paused ? 0 : requestAnimationFrame(loop);
}
const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
['play', 'seeking', 'seeked', 'timeupdate', 'loadedmetadata', 'progress', 'volumechange'].forEach(e => video.addEventListener(e, () => { draw(); gauges(); if (!video.paused) kick(); }));
new ResizeObserver(size).observe(chart);
document.fonts && document.fonts.ready.then(size);
calm.addEventListener('change', draw);
size(); syncState();
