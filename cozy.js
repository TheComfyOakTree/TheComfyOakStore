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
  const OPEN_MS = 5200;   // how long the whole opening takes, in ms: higher = slower
  const CLOSE_RATE = 1.35; // closing is this many times faster than opening
  const canAnimate = typeof Element.prototype.animate === 'function';

  // A heavy oak door: the latch gives (small pop), it settles back a touch,
  // then it swings slowly and evenly open, easing to a stop, and rocks back to rest.
  const DOOR_KEYS = [
    { offset: 0,    transform: 'rotateY(0deg)',    filter: 'brightness(1)',    easing: 'ease-out' },
    { offset: .06,  transform: 'rotateY(-9deg)',   filter: 'brightness(.97)',  easing: 'ease-in-out' },
    { offset: .14,  transform: 'rotateY(-5deg)',   filter: 'brightness(.97)',  easing: 'cubic-bezier(.36,0,.3,1)' },
    { offset: .92,  transform: 'rotateY(-103deg)', filter: 'brightness(.5)',   easing: 'ease-in-out' },
    { offset: 1,    transform: 'rotateY(-100deg)', filter: 'brightness(.52)' }
  ];
  // the room behind starts dark and slowly warms up as lantern light spills in
  const DARK_KEYS   = [{ offset: 0, opacity: 1 }, { offset: .2, opacity: 1 }, { offset: .6, opacity: .55 }, { offset: 1, opacity: 0 }];
  const SHADOW_KEYS = [{ offset: 0, opacity: 0 }, { offset: .4, opacity: .3 }, { offset: 1, opacity: 1 }];

  doors.forEach(frame => {
    const door = frame.querySelector('.door');
    if (!door) return;
    const dark = document.createElement('div'); dark.className = 'door-dark'; dark.setAttribute('aria-hidden', 'true');
    const shade = document.createElement('div'); shade.className = 'door-shadow'; shade.setAttribute('aria-hidden', 'true');
    frame.insertBefore(shade, door); frame.insertBefore(dark, shade);
    let anims = null, open = false;
    frame._setDoor = want => {
      if (want === open) return;
      open = want;
      frame.classList.toggle('is-open', open);
      frame.setAttribute('aria-label', open ? 'Round door, open. Click to close' : 'Round door, closed. Click to open');
      if (!canAnimate) { door.style.transform = open ? 'rotateY(-100deg)' : ''; dark.style.opacity = open ? 0 : 1; shade.style.opacity = open ? 1 : 0; return; }
      // how far through the swing the door is right now (0 = shut, 1 = fully open)
      const p = anims ? Math.min(1, Math.max(0, (anims[0].currentTime || 0) / OPEN_MS)) : 0;
      if (!anims) {
        const opts = { duration: reduce ? 1 : OPEN_MS, fill: 'both' };
        anims = [door.animate(DOOR_KEYS, opts), dark.animate(DARK_KEYS, opts), shade.animate(SHADOW_KEYS, opts)];
      }
      // closing plays the same swing backwards, a little quicker, so it can be interrupted mid-way
      anims.forEach(a => { a.playbackRate = open ? 1 : -CLOSE_RATE; a.play(); });
      doorSound(frame, open, p);
    };
    frame.addEventListener('click', () => frame._setDoor(!open));
    frame.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); frame._setDoor(!open); } });
  });

  // every door swings open by itself once it is well into view; doors in a row open one after another
  if (doors.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const row = e.target.closest('.tiers-grid');
      const i = row ? [...row.querySelectorAll('.door-frame')].indexOf(e.target) : 0;
      setTimeout(() => e.target._setDoor && e.target._setDoor(true), reduce ? 0 : 600 + i * 700);
      io.unobserve(e.target);
    }), { threshold: .6 });
    doors.forEach(d => io.observe(d));
  }

  /* Door sounds: a latch clunk, a slow wooden creak, and a soft thud when it shuts.
     Made in the browser (no audio files) and only heard while the hearth sound is on. */
  function noiseBuf(sec) {
    const n = Math.max(1, Math.floor(ctx.sampleRate * sec)), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  // a heavy wooden knock: low "body" tone plus a short muffled click
  function knock(out, t, vol, pitch) {
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(pitch, t); o.frequency.exponentialRampToValueAtTime(pitch * .55, t + .18);
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(vol, t + .006); og.gain.exponentialRampToValueAtTime(0.0001, t + .25);
    o.connect(og).connect(out); o.start(t); o.stop(t + .3);
    const s = ctx.createBufferSource(); s.buffer = noiseBuf(.06);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
    const sg = ctx.createGain(); sg.gain.setValueAtTime(vol * .7, t); sg.gain.exponentialRampToValueAtTime(0.0001, t + .06);
    s.connect(f).connect(sg).connect(out); s.start(t);
  }
  // a small brass latch: a bright, short "click" with a tiny metallic ring
  function latch(out, t, vol) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf(.03);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 2.5;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .03);
    s.connect(bp).connect(g).connect(out); s.start(t);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 2150;
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(vol * .18, t + .003); og.gain.exponentialRampToValueAtTime(0.0001, t + .12);
    o.connect(og).connect(out); o.start(t); o.stop(t + .15);
  }
  // the swing: no squeak, just a soft breath of air moving with the door
  function swoosh(out, t, sec, vol) {
    if (sec < .2) return;
    const src = ctx.createBufferSource(), n = noiseBuf(sec + .1), d = n.getChannelData(0);
    let last = 0; for (let i = 0; i < d.length; i++) { last = (last + .04 * d[i]) / 1.04; d[i] = last * 6; }   // soften into a warm, brown-ish noise
    src.buffer = n;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .9;
    bp.frequency.setValueAtTime(260, t); bp.frequency.linearRampToValueAtTime(620, t + sec * .55); bp.frequency.linearRampToValueAtTime(340, t + sec);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + sec * .45); g.gain.linearRampToValueAtTime(vol * .6, t + sec * .75); g.gain.linearRampToValueAtTime(0.0001, t + sec);
    src.connect(bp).connect(lp).connect(g).connect(out); src.start(t); src.stop(t + sec + .1);
  }
  // a real recording of a door opening: "Open closet door" by Gravity Sound (gravitysound.studio), CC BY 4.0, via Wikimedia Commons
  const doorRec = typeof Audio === 'function' ? new Audio('door-open.mp3') : null;
  if (doorRec) doorRec.preload = 'auto';
  // play it (optionally after a delay); everything started goes into `bag` so it can be stopped
  function playDoorRec(vol, delayMs, bag) {
    if (!doorRec) return;
    const go = () => { const a = doorRec.cloneNode(); a.volume = vol; bag.push(a); a.play().catch(() => {}); };
    if (delayMs) { const id = setTimeout(go, delayMs); bag.push({ pause: () => clearTimeout(id) }); } else go();
  }
  const stopRecs = bag => { if (bag) bag.forEach(a => a.pause()); };

  function doorSound(frame, opening, p) {
    // stop whatever this door was already playing (e.g. clicked mid-swing)
    stopRecs(frame._rec); frame._rec = [];
    if (frame._snd) { const old = frame._snd; old.gain.setTargetAtTime(0, ctx.currentTime, .05); setTimeout(() => old.disconnect(), 400); frame._snd = null; }
    if (!on || !ctx) return;
    const out = ctx.createGain(); out.gain.value = .9; out.connect(ctx.destination); frame._snd = out;
    const now = ctx.currentTime + .02, T = OPEN_MS / 1000;
    if (reduce) { knock(out, now, opening ? .35 : .5, opening ? 150 : 95); return; }
    if (opening) {
      if (p < .05) {
        playDoorRec(.75, 0, frame._rec);                              // the real door: latch, swing, settle
        swoosh(out, now + 1.6, (.9 - .14) * T - 1.6, .18);           // a faint breath of air while it keeps swinging
      } else {
        const from = Math.max(p, .12);
        swoosh(out, now + (from - p) * T, (.9 - from) * T, .35);     // resumed mid-swing: just the soft air
      }
    } else {
      const sec = p / CLOSE_RATE * T;                                // time until it is shut
      swoosh(out, now, Math.max(0, p - .16) / CLOSE_RATE * T, .4);
      if (p > .1) { knock(out, now + sec - .02, .45, 110); latch(out, now + sec + .05, .22); }   // soft thud, latch clicks shut
    }
  }

  /* Hearth: a crackling-fire sound made in the browser (no audio files) */
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
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-hearth]')) return;
    on = !on;
    on ? start() : stop();
    document.querySelectorAll('[data-hearth]').forEach(x => {
      x.setAttribute('aria-pressed', String(on));
      if (x.dataset.hearth === 'label') x.textContent = on ? 'Let the fire rest' : 'Light the hearth';
    });
    document.documentElement.classList.toggle('hearth-on', on);
  });

  /* =====================================================================
     Walk into the shop (home page): the arched door in the storefront photo
     is clickable. You walk up to it, it swings open, you step through the
     lantern light and arrive inside the shop.
     ===================================================================== */
  const hero = document.querySelector('.hero');
  const FRONT = { src: 'hollow-storefront.jpg', w: 1800, h: 1005, posY: .4 };   // matches .hero background (center 40% / cover)
  const DOOR = { x: 785, y: 435, w: 243, h: 420 };                              // the wooden door, in photo pixels
  const pct = (v, of) => (v / of * 100) + '%';

  if (hero) {
    const hot = document.createElement('button');
    hot.type = 'button'; hot.className = 'store-door';
    hot.setAttribute('aria-label', 'Open the shop door and step inside');
    hot.innerHTML = '<span class="store-door-tag">Step inside</span>';
    hero.insertBefore(hot, hero.querySelector('.hero-content'));

    // where the photo (and its door) sits on screen right now
    const frontRect = () => {
      const r = hero.getBoundingClientRect(), s = Math.max(r.width / FRONT.w, r.height / FRONT.h);
      const w = FRONT.w * s, h = FRONT.h * s;
      return { r, s, w, h, x: r.left + (r.width - w) * .5, y: r.top + (r.height - h) * FRONT.posY };
    };
    const placeHot = () => {
      const m = frontRect();
      Object.assign(hot.style, { left: (m.x - m.r.left + DOOR.x * m.s) + 'px', top: (m.y - m.r.top + DOOR.y * m.s) + 'px', width: DOOR.w * m.s + 'px', height: DOOR.h * m.s + 'px' });
    };
    placeHot(); addEventListener('resize', placeHot);

    let walk = null, busy = false, returnFocus = null;
    const build = () => {
      walk = document.createElement('div');
      walk.className = 'walkin'; walk.hidden = true;
      walk.setAttribute('role', 'dialog'); walk.setAttribute('aria-modal', 'true'); walk.setAttribute('aria-labelledby', 'walkinTitle');
      walk.innerHTML =
        '<div class="walkin-bg"></div>' +
        '<div class="walkin-stage" aria-hidden="true"><img class="walkin-front" src="' + FRONT.src + '" alt="">' +
          '<div class="walkin-doorway"><img src="hollow-shop-inside.jpg" alt=""><i class="walkin-doorglow"></i></div>' +
          '<div class="walkin-door"></div></div>' +
        '<div class="walkin-flash" aria-hidden="true"></div>' +
        '<div class="walkin-inside"><img src="hollow-shop-inside.jpg" alt="Inside The Comfy Oak Tree: an old oak grows through the room, lanterns glow and tables are stacked with wrapped treasures"><div class="fireflies walkin-motes" aria-hidden="true"></div></div>' +
        '<div class="tour" hidden></div>' +
        '<button type="button" class="walkin-hearth" data-hearth aria-pressed="' + on + '" aria-label="Crackling fire sound" title="Light the hearth (sound)">🔥</button>' +
        '<button type="button" class="walkin-close" data-walk-out aria-label="Leave the shop">×</button>';
      document.body.appendChild(walk);
      // door panel = the exact piece of the photo where the door is
      const door = walk.querySelector('.walkin-door'), way = walk.querySelector('.walkin-doorway');
      [door, way].forEach(el => Object.assign(el.style, { left: pct(DOOR.x, FRONT.w), top: pct(DOOR.y, FRONT.h), width: pct(DOOR.w, FRONT.w), height: pct(DOOR.h, FRONT.h) }));
      Object.assign(door.style, {
        backgroundImage: 'url("' + FRONT.src + '")',
        backgroundSize: pct(FRONT.w, DOOR.w) + ' ' + pct(FRONT.h, DOOR.h),
        backgroundPosition: pct(DOOR.x, FRONT.w - DOOR.w) + ' ' + pct(DOOR.y, FRONT.h - DOOR.h)
      });
      const motes = walk.querySelector('.walkin-motes');
      for (let i = 0; i < 26; i++) {
        const f = document.createElement('i');
        f.style.left = (5 + Math.random() * 90) + '%'; f.style.top = (10 + Math.random() * 85) + '%';
        f.style.setProperty('--d', (8 + Math.random() * 9).toFixed(1) + 's'); f.style.setProperty('--l', (-Math.random() * 10).toFixed(1) + 's');
        const s = 2 + Math.random() * 3.5; f.style.width = f.style.height = s + 'px';
        motes.appendChild(f);
      }
      walk.addEventListener('click', e => { const b = e.target.closest('[data-walk-out]'); if (!b) return; if (b.classList.contains('walkin-close') && tourBack()) return; walkOut(b.dataset.walkOut === 'look'); });
      walk.addEventListener('keydown', e => {
        if (e.key === 'Escape') { if (!tourCardClose() && !tourBack()) walkOut(false); }
        if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && tourOn && !e.target.closest('select')) { e.preventDefault(); tourWalk(e.key === 'ArrowRight' ? 1 : -1); }
        if (e.key === 'Tab') {   // keep keyboard focus inside the shop while it is open
          const f = [...walk.querySelectorAll('a,button')].filter(x => x.offsetParent !== null);
          if (!f.length) return;
          if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        }
      });
    };

    // sounds for the walk (only while the hearth sound is on)
    function bell(out, t) {
      [0, .11, .2].forEach((d, j) => [1568, 2349, 3951].forEach((fq, k) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = fq * (1 + (Math.random() - .5) * .004);
        const v = [.07, .035, .018][k] * (1 - j * .25);
        g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(v, t + d + .004); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 1.4 - k * .35);
        o.connect(g).connect(out); o.start(t + d); o.stop(t + d + 1.5);
      }));
    }
    function walkSounds() {
      if (!on || !ctx || reduce) return;
      const out = ctx.createGain(); out.gain.value = .9; out.connect(ctx.destination);
      const t = ctx.currentTime + .05;
      [.25, .8, 1.35, 1.85].forEach((d, i) => knock(out, t + d, .09 + i * .015, 68));   // footsteps on the path
      walk._rec = []; playDoorRec(.85, 2050, walk._rec);                                // the real door opening
      bell(out, t + 2.5);                                                               // the shop bell
      [3.7, 4.2].forEach(d => knock(out, t + d, .12, 74));                              // stepping over the threshold
      walk._snd = out;
    }

    const anims = [];
    const play = (el, keys, o) => { const a = el.animate(keys, Object.assign({ fill: 'both', easing: 'linear' }, o)); anims.push(a); return a; };

    function walkIn() {
      if (busy) return;
      if (!walk) build();
      busy = true; returnFocus = document.activeElement;
      anims.splice(0).forEach(a => a.cancel());
      const m = frontRect(), vw = innerWidth, vh = innerHeight;
      const stage = walk.querySelector('.walkin-stage');
      Object.assign(stage.style, { left: m.x + 'px', top: m.y + 'px', width: m.w + 'px', height: m.h + 'px' });
      walk.hidden = false; walk.classList.remove('is-in');
      document.body.classList.add('no-scroll');
      walkSounds();

      const q = sel => walk.querySelector(sel);
      if (reduce || !canAnimate) {
        play(q('.walkin-bg'), [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
        play(q('.walkin-inside'), [{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
        q('.walkin-stage').style.opacity = 0;
        setTimeout(arrived, 600);
        return;
      }
      const cx = (DOOR.x + DOOR.w / 2) * m.s, cy = (DOOR.y + DOOR.h / 2) * m.s, dh = DOOR.h * m.s, dw = DOOR.w * m.s;
      const lerp = (a, b, u) => a + (b - a) * u;
      // camera: zoom k, and how far (u: 0..1) the door has moved from where it is now to the middle of the screen.
      // The photo is kept covering the screen (no dark gaps) whenever it is big enough to.
      const cam = (k, u, bob = 0) => {
        let left = lerp(m.x + cx, vw / 2, u) - k * cx, top = lerp(m.y + cy, vh * .5, u) - k * cy + bob;
        if (k * m.w >= vw) left = Math.min(0, Math.max(vw - k * m.w, left));
        if (k * m.h >= vh) top = Math.min(0, Math.max(vh - k * m.h, top));
        return 'translate(' + (left - m.x) + 'px,' + (top - m.y) + 'px) scale(' + k + ')';
      };
      const k1 = Math.max(1, .66 * vh / dh), k2 = Math.max(1.35 * vw / dw, 1.35 * vh / dh);
      // walking up the path (with a gentle step bob), pausing at the door, leaning in, stepping through
      play(stage, [
        { offset: 0,   transform: cam(1, 0), easing: 'ease-in-out' },
        { offset: .08, transform: cam(lerp(1, k1, .12), .12, -3) },
        { offset: .16, transform: cam(lerp(1, k1, .32), .32, 3) },
        { offset: .24, transform: cam(lerp(1, k1, .55), .55, -3) },
        { offset: .32, transform: cam(lerp(1, k1, .8), .8, 2), easing: 'ease-out' },
        { offset: .4,  transform: cam(k1, 1), easing: 'ease-in-out' },
        { offset: .6,  transform: cam(k1 * 1.08, 1), easing: 'cubic-bezier(.55,0,.75,.2)' },
        { offset: 1,   transform: cam(k2, 1) }
      ], { duration: 5000 });
      play(q('.walkin-bg'), [{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-out' });
      // the door: latch gives, then it swings inward
      play(q('.walkin-door'), [
        { offset: 0,   transform: 'perspective(900px) rotateY(0deg)', filter: 'brightness(1)' },
        { offset: .42, transform: 'perspective(900px) rotateY(0deg)', filter: 'brightness(1)', easing: 'ease-out' },
        { offset: .46, transform: 'perspective(900px) rotateY(7deg)', filter: 'brightness(.96)', easing: 'ease-in-out' },
        { offset: .5,  transform: 'perspective(900px) rotateY(4deg)', filter: 'brightness(.96)', easing: 'cubic-bezier(.4,0,.25,1)' },
        { offset: .78, transform: 'perspective(900px) rotateY(82deg)', filter: 'brightness(.55)' },
        { offset: 1,   transform: 'perspective(900px) rotateY(86deg)', filter: 'brightness(.5)' }
      ], { duration: 5000 });
      play(q('.walkin-doorglow'), [{ offset: 0, opacity: 0 }, { offset: .46, opacity: .2 }, { offset: .75, opacity: 1 }, { offset: 1, opacity: 1 }], { duration: 5000 });
      play(q('.walkin-doorway img'), [{ offset: 0, filter: 'brightness(.25)' }, { offset: .5, filter: 'brightness(.35)' }, { offset: 1, filter: 'brightness(1.05)' }], { duration: 5000 });
      // warm light as we cross the threshold, then the shop
      play(q('.walkin-flash'), [{ offset: 0, opacity: 0 }, { offset: .5, opacity: 1 }, { offset: 1, opacity: 0 }], { duration: 1700, delay: 4200, easing: 'ease-in-out' });
      play(q('.walkin-inside'), [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 4900, easing: 'ease-out' });
      play(q('.walkin-inside img'), [{ transform: 'scale(1.22)' }, { transform: 'scale(1.04)' }], { duration: 9000, delay: 4900, easing: 'cubic-bezier(.2,.6,.3,1)' });
      setTimeout(arrived, 5900);
    }
    function arrived() {
      if (!walk || walk.hidden) return;
      walk.classList.add('is-in'); busy = false;
      startTour();
    }
    function walkOut(look) {
      if (!walk || walk.hidden) return;
      stopRecs(walk._rec); walk._rec = null;
      if (walk._snd) { const s = walk._snd; s.gain.setTargetAtTime(0, ctx.currentTime, .08); setTimeout(() => s.disconnect(), 600); walk._snd = null; }
      let gone = false;
      const done = () => {
        if (gone) return; gone = true;
        anims.splice(0).forEach(a => a.cancel());
        stopTour();
        walk.hidden = true; walk.classList.remove('is-in'); busy = false;
        walk.querySelector('.walkin-stage').style.opacity = '';
        document.body.classList.remove('no-scroll');
        if (look) { const next = hero.parentElement.querySelector('.hero ~ .section'); next && next.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
        else if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
      };
      if (reduce || !canAnimate) return done();
      const fade = walk.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease-in', fill: 'forwards' });
      const end = () => { done(); fade.cancel(); };
      fade.onfinish = end; setTimeout(end, 760);
    }

    /* ---------- Walking around inside the shop ---------- */
    const money = n => '£' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0);
    const PRODUCTS = {
      'acorn-box':   { kind: 'Mystery box', name: 'Acorn Box', price: 25, img: 'box-acorn.jpg', worth: '£45+', link: 'mystery-boxes.html#acorn', box: true,
                       desc: 'A small, cozy beginning: 3 surprise pieces in a silver and gold-plated mix, with woodland gift wrap and a story card.' },
      'sprout-box':  { kind: 'Mystery box · most popular', name: 'Sprout Box', price: 45, img: 'box-sprout.jpg', worth: '£85+', link: 'mystery-boxes.html#sprout', box: true,
                       desc: '5 surprise pieces with at least one sterling silver treasure, a carved-look keepsake box and free UK shipping.' },
      'old-oak-box': { kind: 'Mystery box', name: 'Old Oak Box', price: 85, img: 'box-old-oak.jpg', worth: '£170+', link: 'mystery-boxes.html#old-oak', box: true,
                       desc: '8 surprise pieces including a matching set, mostly sterling silver and 18k gold plate, in a wooden treasure chest. Free tracked UK shipping.' },
      'silver-oak-leaf-ring':  { kind: 'Ring · bestseller', name: 'Silver Oak Leaf Ring', price: 28, img: '2.jpg', desc: 'Sterling silver oak leaf that wraps the finger.', link: 'collections.html#rings' },
      'green-leaf-ring':       { kind: 'Ring', name: 'Green Leaf Ring', price: 24, img: '9.jpg', desc: 'Silver band with a hand-enamelled green leaf.', link: 'collections.html#rings' },
      'sprout-ring':           { kind: 'Ring · new', name: 'Sprout Ring', price: 26, img: '14.jpg', desc: 'Gold-plated band with a tiny growing sprout.', link: 'collections.html#rings' },
      'leaf-signet-ring':      { kind: 'Ring · new', name: 'Leaf Signet Ring', price: 32, img: '18.jpg', desc: 'Gold-plated signet with a pressed silver leaf.', link: 'collections.html#rings' },
      'silver-leaf-band':      { kind: 'Ring', name: 'Silver Leaf Band', price: 26, img: '30.jpg', desc: 'Wide sterling band engraved with leaf vines.', link: 'collections.html#rings' },
      'golden-trio':           { kind: 'Rings', name: 'Golden Trio', price: 24, img: '22.jpg', desc: 'Three slim gold-plated stacking rings.', link: 'collections.html#rings' },
      'sunbeam-pendant':       { kind: 'Necklace · bestseller', name: 'Sunbeam Pendant', price: 32, img: '3.jpg', desc: 'Gold-plated filigree flower on a fine chain.', link: 'collections.html#necklaces' },
      'whispering-branch':     { kind: 'Necklace · new', name: 'Whispering Branch', price: 36, img: '13.jpg', desc: 'Silver tree-of-life pendant with green leaves.', link: 'collections.html#necklaces' },
      'little-sprout-necklace':{ kind: 'Necklace', name: 'Little Sprout Necklace', price: 29, img: '10.jpg', desc: 'Sterling silver seedling on a delicate chain.', link: 'collections.html#necklaces' },
      'oak-leaf-pendant':      { kind: 'Necklace', name: 'Oak Leaf Pendant', price: 31, img: '21.jpg', desc: 'Textured gold-plated leaf, 18" chain.', link: 'collections.html#necklaces' },
      'emerald-forest-pendant':{ kind: 'Necklace', name: 'Emerald Forest Pendant', price: 36, img: '32.jpg', desc: 'Green crystal drop on a gold-plated chain.', link: 'collections.html#necklaces' },
      'sage-drop-earrings':    { kind: 'Earrings · new', name: 'Sage Drop Earrings', price: 22, img: '20.jpg', desc: 'Soft sage enamel discs on gold-plated hooks.', link: 'collections.html#bracelets' },
      'forest-path-cuff':      { kind: 'Bracelet', name: 'Forest Path Cuff', price: 34, img: '4.jpg', desc: 'Open sterling silver cuff with pebble details.', link: 'collections.html#bracelets' },
      'oak-ringlet-stack':     { kind: 'Bracelets', name: 'Oak Ringlet Stack', price: 27, img: '12.jpg', desc: 'Five fine gold-plated bangles to mix and stack.', link: 'collections.html#bracelets' },
      'triple-charm-bracelet': { kind: 'Bracelet', name: 'Triple Charm Bracelet', price: 34, img: '31.jpg', desc: 'Three linked bangles with tiny crystal studs.', link: 'collections.html#bracelets' },
      'golden-oak-bracelet':   { kind: 'Bracelet · bestseller', name: 'Golden Oak Bracelet', price: 38, img: '19.jpg', desc: 'A chain of gold-plated leaves around the wrist.', link: 'collections.html#bracelets' },
      'forest-floor-set':      { kind: 'Gift set', name: 'Forest Floor Gift Set', price: 64, img: '8.jpg', desc: 'Necklace, two rings and earrings, gift boxed.', link: 'collections.html' }
    };
    const CABINET = [
      ['Rings', ['silver-oak-leaf-ring', 'green-leaf-ring', 'sprout-ring', 'leaf-signet-ring', 'silver-leaf-band', 'golden-trio']],
      ['Necklaces', ['sunbeam-pendant', 'whispering-branch', 'little-sprout-necklace', 'oak-leaf-pendant', 'emerald-forest-pendant']],
      ['Earrings, bracelets & gifts', ['sage-drop-earrings', 'forest-path-cuff', 'oak-ringlet-stack', 'triple-charm-bracelet', 'golden-oak-bracelet', 'forest-floor-set']]
    ];
    // spots are placed in % of each photo, on the real things in it
    const STATIONS = [
      { key: 'floor', name: 'The shop floor', img: 'hollow-shop-inside.jpg', w: 1800, h: 1005, spots: [
        { x: 34.6, y: 74, label: 'Pendants on the table', product: 'sunbeam-pendant' },
        { x: 49.5, y: 76.5, label: 'Kraft mystery boxes', go: 'boxes', text: 'Little boxes tied with twine and lavender. The whole range waits on the mystery box shelf.' },
        { x: 63.5, y: 79, label: 'Gift sets', product: 'forest-floor-set' },
        { x: 50.5, y: 43, label: 'The jewellery cabinet', go: 'cabinet', text: 'At the back of the shop: shelves of rings, necklaces, earrings and bracelets, all lit by lanterns.' },
        { x: 85, y: 63, label: 'The wrapping counter', go: 'counter', text: 'Where every order is wrapped by hand before it leaves the Hollow.' }
      ] },
      { key: 'boxes', name: 'The mystery box shelf', img: 'hollow-box-trio.jpg', w: 1800, h: 752, spots: [
        { x: 28.4, y: 60, label: 'Acorn Box · £25', product: 'acorn-box' },
        { x: 50.2, y: 58, label: 'Sprout Box · £45', product: 'sprout-box' },
        { x: 73.8, y: 55, label: 'Old Oak Box · £85', product: 'old-oak-box' }
      ] },
      { key: 'chests', name: 'The treasure chests', img: 'hollow-carved-boxes.jpg', w: 1800, h: 1005, spots: [
        { x: 50.5, y: 72, label: 'Wooden treasure chests', product: 'old-oak-box', text: 'Every Old Oak Box arrives in a wooden treasure chest like these: 8 surprise pieces, including a matching set.' },
        { x: 82, y: 72, label: 'Ribbons & wax seals', text: 'Velvet ribbon, a kraft tag and an acorn wax seal. Opening it is half the magic.' }
      ] },
      { key: 'cabinet', name: 'The jewellery cabinet', cabinet: true },
      { key: 'counter', name: 'The wrapping counter', img: 'hollow-parcels.jpg', w: 1800, h: 1005, spots: [
        { x: 25, y: 69, label: 'Hand-wrapped parcels', text: 'Every order is wrapped by hand in kraft paper, tied with twine and finished with lavender and an acorn.' },
        { x: 64.5, y: 64, label: 'A story card', text: 'A little handwritten story card is tucked into every box.' },
        { x: 65, y: 52, label: 'Pay at the counter', checkout: true }
      ] }
    ];

    let tour = null, tourOn = false, cur = 0, walking = false, hintTimer = 0, trail = [];   // trail = the places you walked from, for ×
    const T$ = sel => tour.querySelector(sel);
    const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function buildTour() {
      tour = walk.querySelector('.tour');
      tour.innerHTML =
        '<div class="tour-scenes"></div>' +
        '<div class="tour-top"><div class="tour-where"><span>You are at</span><strong id="walkinTitle" tabindex="-1"></strong></div>' +
          '<a class="tour-basket" href="checkout.html" aria-label="Your basket"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><span data-tour-basket>Basket empty</span></a></div>' +
        '<p class="tour-hint">Tap the glowing lanterns to look closer. <span class="tour-hint-look"></span> Walk on with the arrows.</p>' +
        '<div class="tour-nav"><button type="button" class="tour-step" data-walk="-1"><span aria-hidden="true">←</span> <em></em></button>' +
          '<div class="tour-dots" role="group" aria-label="Places in the shop"></div>' +
          '<button type="button" class="tour-step" data-walk="1"><em></em> <span aria-hidden="true">→</span></button></div>' +
        '<div class="tour-card" role="dialog" aria-modal="false" aria-label="A closer look" hidden></div>';
      T$('.tour-hint-look').textContent = matchMedia('(hover: none)').matches ? 'Drag to look around.' : 'Move your mouse to look around.';
      const dots = T$('.tour-dots');
      STATIONS.forEach((st, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'tour-dot'; b.dataset.goto = i; b.setAttribute('aria-label', 'Walk to ' + st.name);
        dots.appendChild(b);
      });
      const scenes = T$('.tour-scenes');
      STATIONS.forEach((st, i) => {
        const sc = document.createElement('div');
        sc.className = 'tour-scene'; sc.dataset.i = i; sc.setAttribute('aria-hidden', 'true');
        if (st.cabinet) {
          sc.classList.add('is-cabinet');
          sc.innerHTML = '<div class="cab-back"></div><div class="cabinet"><div class="cab-plaque">The Jewellery Cabinet</div>' +
            CABINET.map(([title, ids]) => '<div class="cab-shelf"><div class="cab-label">' + esc(title) + '</div><div class="cab-row">' +
              ids.map(id => { const p = PRODUCTS[id]; return '<button type="button" class="gem" data-product="' + id + '" aria-label="' + esc(p.name + ', ' + money(p.price)) + '">' +
                '<span class="gem-dome"><img src="' + esc(p.img) + '" alt="" loading="lazy"></span><span class="gem-tag">' + money(p.price) + '</span></button>'; }).join('') +
              '</div><div class="cab-board"></div></div>').join('') + '</div>';
        } else {
          sc.innerHTML = '<div class="tour-pic"><img src="' + st.img + '" alt="" draggable="false">' +
            st.spots.map((sp, k) => '<button type="button" class="tour-spot' + (sp.x > 60 ? ' flip' : '') + '" style="left:' + sp.x + '%;top:' + sp.y + '%" data-spot="' + k + '">' +
              '<i aria-hidden="true"></i><span>' + esc(sp.label) + '</span></button>').join('') + '</div>';
        }
        scenes.appendChild(sc);
      });

      tour.addEventListener('click', e => {
        const w = e.target.closest('[data-walk]'); if (w) return tourWalk(+w.dataset.walk);
        const d = e.target.closest('[data-goto]'); if (d) return tourGo(+d.dataset.goto);
        const g = e.target.closest('[data-go]'); if (g) return tourGo(STATIONS.findIndex(s => s.key === g.dataset.go));
        const pr = e.target.closest('[data-product]'); if (pr) return openCard({ product: pr.dataset.product }, pr);
        const sp = e.target.closest('.tour-spot');
        if (sp) { const spot = STATIONS[cur].spots[+sp.dataset.spot]; return spot.go ? tourGo(STATIONS.findIndex(s => s.key === spot.go)) : openCard(spot, sp); }
        if (e.target.closest('[data-card-close]')) return tourCardClose();
        if (e.target.closest('[data-add-to-cart]')) setTimeout(updateBasket, 60);   // script.js adds it; refresh the counter
        if (!e.target.closest('.tour-card') && !T$('.tour-card').hidden) tourCardClose();
        hideHint();
      });
      // looking around: mouse = turn your head a little; touch/drag = pan the room
      let drag = null;
      tour.addEventListener('pointermove', e => {
        const pic = activePic(); if (!pic) return;
        if (drag && drag.id === e.pointerId) { setPan(pic, drag.px + (e.clientX - drag.x), drag.py + (e.clientY - drag.y), false); return; }
        if (e.pointerType === 'mouse') {
          const r = pic._fit; if (!r) return;
          setPan(pic, r.cx - (e.clientX / innerWidth - .5) * (r.w - innerWidth) * .9, r.cy - (e.clientY / innerHeight - .5) * (r.h - innerHeight) * .9, true);
        }
      });
      tour.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' || e.target.closest('button,a,select,.tour-card')) return;
        const pic = activePic(); if (!pic) return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, px: pic._pan.x, py: pic._pan.y }; hideHint();
      });
      ['pointerup', 'pointercancel'].forEach(ev => tour.addEventListener(ev, () => { drag = null; }));
      addEventListener('resize', () => { if (tourOn) tour.querySelectorAll('.tour-scene').forEach(fitScene); });
      addEventListener('storage', updateBasket);
    }

    // size a photo so it covers the screen (with room to look around), centred
    function fitScene(sc) {
      const st = STATIONS[+sc.dataset.i], pic = sc.querySelector('.tour-pic');
      if (!pic) return;
      const vw = innerWidth, vh = innerHeight, s = Math.max(vw / st.w, vh / st.h) * 1.1, w = st.w * s, h = st.h * s;
      pic.style.width = w + 'px'; pic.style.height = h + 'px';
      pic._fit = { w, h, cx: (vw - w) / 2, cy: (vh - h) / 2 };
      setPan(pic, pic._fit.cx, pic._fit.cy, false);
    }
    function setPan(pic, x, y, smooth) {
      const r = pic._fit, vw = innerWidth, vh = innerHeight;
      x = Math.min(0, Math.max(vw - r.w, x)); y = Math.min(0, Math.max(vh - r.h, y));
      pic._pan = { x, y };
      pic.style.transition = smooth && !reduce ? 'transform 1.1s cubic-bezier(.2,.7,.3,1)' : 'none';
      pic.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }
    const activePic = () => { const sc = tour && tour.querySelector('.tour-scene.is-active'); return sc && sc.querySelector('.tour-pic'); };

    function setStation(i) {
      cur = i;
      const st = STATIONS[i], prev = STATIONS[i - 1], next = STATIONS[i + 1];
      T$('#walkinTitle').textContent = st.name;
      const [pb, nb] = tour.querySelectorAll('.tour-step');
      pb.hidden = !prev; nb.hidden = !next;
      if (prev) { pb.querySelector('em').textContent = prev.name; pb.setAttribute('aria-label', 'Walk back to ' + prev.name); }
      if (next) { nb.querySelector('em').textContent = next.name; nb.setAttribute('aria-label', 'Walk on to ' + next.name); }
      tour.querySelectorAll('.tour-dot').forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
      const x = walk.querySelector('.walkin-close'), backTo = trail.length ? STATIONS[trail[trail.length - 1]].name : '';
      x.setAttribute('aria-label', backTo ? 'Go back to ' + backTo : 'Leave the shop'); x.title = backTo ? 'Back to ' + backTo : 'Leave the shop';
      tour.querySelectorAll('.tour-scene').forEach((sc, k) => { sc.classList.toggle('is-active', k === i); sc.setAttribute('aria-hidden', k === i ? 'false' : 'true'); sc.inert = k !== i; });
    }

    function footsteps(n) {
      if (!on || !ctx || reduce) return;
      const out = ctx.createGain(); out.gain.value = .9; out.connect(ctx.destination);
      const t = ctx.currentTime + .03;
      for (let k = 0; k < n; k++) knock(out, t + k * .42, .08 + (k % 2) * .02, 64 + (k % 2) * 8);
      setTimeout(() => out.disconnect(), n * 420 + 800);
    }

    function tourGo(i, back) {
      if (!tourOn || walking || i === cur || i < 0 || i >= STATIONS.length) return;
      tourCardClose(); hideHint();
      if (!back) trail.push(cur);
      const dir = back ? -1 : (i > cur ? 1 : -1), from = tour.querySelector('.tour-scene.is-active'), to = tour.querySelector('.tour-scene[data-i="' + i + '"]');
      fitScene(to);
      footsteps(Math.min(5, 2 + Math.abs(i - cur)));
      if (reduce || !canAnimate) { setStation(i); T$('#walkinTitle').focus({ preventScroll: true }); return; }
      walking = true;
      to.classList.add('is-entering');
      // walking forward: the room rushes past, the next spot comes into view; a gentle step bob throughout
      from.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(1.32) translateX(' + (-dir * 5) + '%)', opacity: 0 }],
        { duration: 1150, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' });
      const inA = to.animate([{ transform: 'scale(1.16) translateX(' + (dir * 6) + '%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 1350, delay: 480, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'backwards' });
      T$('.tour-scenes').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(1px)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(1px)' }, { transform: 'translateY(0)' }],
        { duration: 1700, easing: 'ease-in-out' });
      setTimeout(() => setStation(i), 600);
      // finish the walk when the animation ends, or after its full length at the latest (so the shop can never get stuck)
      let arrivedAt = false;
      const land = () => { if (arrivedAt) return; arrivedAt = true; from.getAnimations().forEach(a => a.cancel()); inA.cancel(); to.classList.remove('is-entering'); walking = false; };
      inA.onfinish = land; setTimeout(land, 480 + 1350 + 150);
    }
    const tourWalk = d => tourGo(cur + d);
    // × / Esc: walk back to the previous place. Returns false when there is nowhere to go back to (then the shop is left).
    function tourBack() {
      if (!tourOn) return false;
      if (walking) return true;
      if (!trail.length) return false;
      tourGo(trail.pop(), true);
      return true;
    }

    function cardHTML(spot) {
      const p = spot.product && PRODUCTS[spot.product];
      let h = '<button type="button" class="tour-card-x" data-card-close aria-label="Close">×</button>';
      if (p) {
        h += '<img class="tour-card-img" src="' + esc(p.img) + '" alt="' + esc(p.name) + '"><div class="tour-card-body">' +
          '<div class="eyebrow">' + esc(p.kind) + '</div><h3>' + esc(p.name) + '</h3>' +
          '<p>' + esc(spot.text || p.desc) + '</p>' +
          '<div class="tour-card-price">' + money(p.price) + (p.worth ? ' <small>worth ' + esc(p.worth) + '</small>' : '') + '</div>' +
          (p.box ? '<label class="pref"><span>Metal preference</span><select data-option-for="' + spot.product + '"><option>Surprise me</option><option>Mostly silver</option><option>Mostly gold</option></select></label>' : '') +
          '<div class="tour-card-actions"><button type="button" class="btn btn-primary" data-add-to-cart data-id="' + spot.product + '" data-name="' + esc(p.name) + '" data-price="' + p.price + '" data-img="' + esc(p.img) + '">Add to basket</button>' +
          '<a class="tour-card-more" href="' + esc(p.link) + '">More details</a></div></div>';
      } else {
        h += '<div class="tour-card-body"><div class="eyebrow">A closer look</div><h3>' + esc(spot.label) + '</h3>' +
          (spot.text ? '<p>' + esc(spot.text) + '</p>' : '');
        if (spot.go) h += '<button type="button" class="btn btn-primary" data-go="' + spot.go + '">Walk over there <span aria-hidden="true">→</span></button>';
        if (spot.checkout) h += '<p data-tour-summary></p><a class="btn btn-primary" href="checkout.html">Pay at the counter</a> <a class="tour-card-more" href="collections.html">Keep browsing the shop</a>';
        h += '</div>';
      }
      return h;
    }
    let cardFrom = null;
    function openCard(spot, fromEl) {
      const card = T$('.tour-card');
      card.innerHTML = cardHTML(spot);
      card.classList.toggle('has-img', !!spot.product);
      card.hidden = false; cardFrom = fromEl || null;
      if (spot.checkout) updateBasket();
      if (canAnimate && !reduce) card.animate([{ opacity: 0, transform: 'translateY(14px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'ease-out' });
      const f = card.querySelector('[data-add-to-cart],[data-go],a.btn'); (f || card.querySelector('[data-card-close]')).focus({ preventScroll: true });
      hideHint();
    }
    function tourCardClose() {
      if (!tour) return false;
      const card = T$('.tour-card'); if (card.hidden) return false;
      card.hidden = true; card.innerHTML = '';
      if (cardFrom && cardFrom.isConnected) cardFrom.focus({ preventScroll: true });
      cardFrom = null; return true;
    }

    function readBasket() {
      try { const c = JSON.parse(localStorage.getItem('comfyOakBasket')) || []; return { n: c.reduce((a, i) => a + i.qty, 0), sum: c.reduce((a, i) => a + i.qty * i.price, 0) }; }
      catch (e) { return { n: 0, sum: 0 }; }
    }
    function updateBasket() {
      if (!tour) return;
      const b = readBasket(), txt = b.n ? b.n + ' item' + (b.n === 1 ? '' : 's') + ' · ' + money(b.sum) : 'Basket empty';
      T$('[data-tour-basket]').textContent = txt;
      T$('.tour-basket').classList.toggle('has-items', b.n > 0);
      T$('.tour-basket').dataset.count = b.n;
      const s = tour.querySelector('[data-tour-summary]');
      if (s) s.textContent = b.n ? 'In your basket: ' + txt + '.' : 'Your basket is still empty. Pick something from the shelves first!';
    }
    function hideHint() { clearTimeout(hintTimer); const h = tour && T$('.tour-hint'); if (h) h.classList.add('is-gone'); }

    function startTour() {
      if (!tour) buildTour();
      tourOn = true; walking = false;
      tour.hidden = false; tour.querySelectorAll('.tour-scene').forEach(sc => { sc.getAnimations().forEach(a => a.cancel()); sc.classList.remove('is-entering'); fitScene(sc); });
      trail = []; setStation(0); updateBasket(); tourCardClose();
      const hint = T$('.tour-hint'); hint.classList.remove('is-gone'); hintTimer = setTimeout(hideHint, 9000);
      if (canAnimate && !reduce) {
        tour.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-out' });
        // the lanterns light up one by one
        tour.querySelectorAll('.tour-scene.is-active .tour-spot').forEach((s, k) => s.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.4)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { duration: 600, delay: 700 + k * 220, easing: 'ease-out', fill: 'backwards' }));
      }
      walk.querySelector('.walkin-inside').style.visibility = 'hidden';
      const nb = tour.querySelector('.tour-step[data-walk="1"]'); nb && nb.focus({ preventScroll: true });
    }
    function stopTour() {
      tourOn = false;
      if (!walk) return;
      walk.querySelector('.walkin-inside').style.visibility = '';
      if (tour) { tourCardClose(); tour.hidden = true; }
      trail = []; const x = walk.querySelector('.walkin-close'); x.setAttribute('aria-label', 'Leave the shop'); x.title = 'Leave the shop';
    }

    hot.addEventListener('click', walkIn);
    document.querySelectorAll('[data-walkin]').forEach(b => b.addEventListener('click', walkIn));
  }
});
