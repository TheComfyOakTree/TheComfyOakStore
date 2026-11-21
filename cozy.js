/* The Comfy Oak Tree — cozy extras: fireflies, round doors, hearth sound */
document.addEventListener('DOMContentLoaded', () => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Fireflies over the hero */
  const ff = document.querySelector('.fireflies');
  if (ff && !reduce) {
    for (let i = 0; i < 22; i++) {
      const f = document.createElement('i');
      f.style.left = (8 + Math.random() * 88) + '%';
      f.style.top = (25 + Math.random() * 70) + '%';
      f.style.setProperty('--d', (7 + Math.random() * 8).toFixed(1) + 's');
      f.style.setProperty('--l', (-Math.random() * 10).toFixed(1) + 's');
      const s = 3 + Math.random() * 4; f.style.width = f.style.height = s + 'px';
      ff.appendChild(f);
    }
  }

  /* Round doors: swing open on their own; click/tap toggles them */
  const doors = document.querySelectorAll('.door-frame');
  // every door swings open by itself shortly after it scrolls into view
  if (doors.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { setTimeout(() => e.target.classList.add('is-open'), reduce ? 0 : 700); io.unobserve(e.target); }
    }), { threshold: .55 });
    doors.forEach(d => io.observe(d));
  }
  doors.forEach(d => d.addEventListener('click', () => d.classList.toggle('is-open')));

  /* Hearth: a crackling-fire sound made in the browser (no audio files) */
  const btns = document.querySelectorAll('[data-hearth]');
  let ctx, master, crackleTimer, on = false;
  function start() {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.2);
    // soft rumble: filtered brown noise
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const g = ctx.createGain(); g.gain.value = 0.35;
    src.connect(lp).connect(g).connect(master); src.start();
    master._src = src;
    // crackles & pops
    const pop = () => {
      if (!on) return;
      const n = 1 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) {
        const t = ctx.currentTime + k * (0.02 + Math.random() * 0.06);
        const l = Math.floor(ctx.sampleRate * (0.004 + Math.random() * 0.02));
        const b = ctx.createBuffer(1, l, ctx.sampleRate), c = b.getChannelData(0);
        for (let i = 0; i < l; i++) c[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / l, 3);
        const s = ctx.createBufferSource(); s.buffer = b;
        const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 1200 + Math.random() * 3500; hp.Q.value = 0.8;
        const v = ctx.createGain(); v.gain.value = 0.25 + Math.random() * 0.6;
        s.connect(hp).connect(v).connect(master); s.start(t);
      }
      crackleTimer = setTimeout(pop, 60 + Math.random() * (Math.random() < .2 ? 900 : 260));
    };
    pop();
  }
  function stop() {
    clearTimeout(crackleTimer);
    if (master) { const m = master; m.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6); setTimeout(() => { try { m._src.stop(); } catch (e) {} m.disconnect(); }, 700); }
  }
  btns.forEach(b => b.addEventListener('click', () => {
    on = !on;
    on ? start() : stop();
    btns.forEach(x => {
      x.setAttribute('aria-pressed', String(on));
      if (x.dataset.hearth === 'label') x.textContent = on ? 'Let the fire rest' : 'Light the hearth';
    });
    document.documentElement.classList.toggle('hearth-on', on);
  }));
});
