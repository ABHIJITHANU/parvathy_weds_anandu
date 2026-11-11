(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  // content protection: disable right click, drag, and text selection
  document.addEventListener('contextmenu', event => event.preventDefault());
  document.addEventListener('dragstart', event => event.preventDefault());
  // end
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  /* ---------- toast ---------- */
  const toast = $('#toast');
  let toastTimer;
  const say = msg => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  };

  /* ---------- intro ---------- */
  const intro = $('#intro');
  const introAudio = $('#introAudio');
  introAudio.volume = .45;
  const introAudioBtn = $('#introAudioBtn');
  let introAudioRequested = false;
  let introAudioRequestId = 0;
  const syncIntroAudioControl = () => {
    const isPlaying = !introAudio.paused;
    introAudioBtn.setAttribute('aria-pressed', String(isPlaying));
    introAudioBtn.setAttribute('aria-label', `${isPlaying ? 'Pause' : 'Play'} wedding music`);
  };
  const playWeddingAudio = (notifyOnFailure = false) => {
    introAudioRequested = true;
    const requestId = ++introAudioRequestId;
    introAudio.play().catch(error => {
      if (requestId !== introAudioRequestId) return;
      introAudioRequested = false;
      syncIntroAudioControl();
      if (error.name !== 'AbortError' && (notifyOnFailure || error.name !== 'NotAllowedError')) {
        say('Wedding audio could not be played.');
      }
    });
  };
  const pauseWeddingAudio = () => {
    introAudioRequestId++;
    introAudioRequested = false;
    introAudio.pause();
    syncIntroAudioControl();
  };
  introAudio.addEventListener('playing', syncIntroAudioControl);
  introAudio.addEventListener('pause', syncIntroAudioControl);
  introAudioBtn.addEventListener('click', () => {
    if (introAudioRequested) pauseWeddingAudio();
    else playWeddingAudio(true);
  });
  const startAudioOnFirstInteraction = event => {
    document.removeEventListener('pointerdown', startAudioOnFirstInteraction);
    document.removeEventListener('keydown', startAudioOnFirstInteraction);
    if (event.target instanceof Element && event.target.closest('#introAudioBtn')) return;
    playWeddingAudio();
  };
  document.addEventListener('pointerdown', startAudioOnFirstInteraction);
  document.addEventListener('keydown', startAudioOnFirstInteraction);

  const introFlowers = $('#introFlowers');
  if (introFlowers && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const styles = [
      { className: 'rose', glyph: '❀' },
      { className: 'jasmine', glyph: '✿' },
      { className: 'nerium', glyph: '✾' }
    ];
    const spawnIntroFlowers = () => {
      const count = 6 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const flower = document.createElement('span');
        const style = styles[Math.floor(Math.random() * styles.length)];
        flower.className = `falling-flower ${style.className}`;
        flower.textContent = style.glyph;
        flower.style.left = `${Math.random() * 100}%`;
        flower.style.setProperty('--drift', `${(Math.random() * 160) - 80}px`);
        flower.style.setProperty('--dur', `${7 + Math.random() * 6}s`);
        flower.style.fontSize = `${.8 + Math.random() * 1.1}rem`;
        flower.style.animationDelay = `${Math.random() * 1.2}s`;
        introFlowers.appendChild(flower);
        setTimeout(() => flower.remove(), 15000);
      }
    };
    setTimeout(spawnIntroFlowers, 650);
    setInterval(spawnIntroFlowers, 1800);
  }

  const openInvitation = () => {
    intro.classList.add('gone');
    document.body.classList.remove('locked');
    window.scrollTo(0, 0);
    store.set('pa-opened', true);
    setTimeout(() => { intro.style.display = 'none'; }, 1200);
  };
  $('#openBtn').addEventListener('click', openInvitation);
  if (store.get('pa-opened', false) && location.hash) { // deep link: skip cover
    intro.style.display = 'none';
    document.body.classList.remove('locked');
  }

  /* ---------- nav ---------- */
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const setMenu = open => {
    links.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- scroll reveal ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }), { threshold: .15 })
    : null;
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 90 + 'ms';
    io ? io.observe(el) : el.classList.add('in');
  });

  /* ---------- countdown (31 Jan 2027, 10:30 IST) ---------- */
  const target = new Date('2027-01-31T10:30:00+05:30').getTime();
  const cd = { d: $('#cd-d'), h: $('#cd-h'), m: $('#cd-m'), s: $('#cd-s') };
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff %= 864e5;
    const h = Math.floor(diff / 36e5); diff %= 36e5;
    const m = Math.floor(diff / 6e4);
    const s = Math.floor((diff % 6e4) / 1e3);
    cd.d.textContent = pad(d); cd.h.textContent = pad(h);
    cd.m.textContent = pad(m); cd.s.textContent = pad(s);
  };
  tick();
  setInterval(tick, 1000);

  /* ---------- flowers ---------- */
  const petals = $('#petals');
  const countEl = $('#flowerCount');
  let flowers = store.get('pa-flowers', { Parvathy: 0, Anandu: 0 });
  const showCount = () => {
    const t = flowers.Parvathy + flowers.Anandu;
    countEl.textContent = t ? `You have sent ${t} flower${t > 1 ? 's' : ''} ❀` : '';
  };
  showCount();
  const rain = (n = 22) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'petal';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDuration = 3 + Math.random() * 3 + 's';
      p.style.animationDelay = Math.random() * .8 + 's';
      p.style.transform = `scale(${.6 + Math.random() * .9})`;
      petals.appendChild(p);
      setTimeout(() => p.remove(), 7500);
    }
  };
  $$('.flower-btn').forEach(btn => btn.addEventListener('click', () => {
    const who = btn.dataset.who;
    flowers[who]++; store.set('pa-flowers', flowers);
    showCount(); rain();
    say(`A flower for ${who} — thank you! ❀`);
  }));

  /* ---------- RSVP ---------- */
  const yes = $('#rsvpYes'), no = $('#rsvpNo'), rmsg = $('#rsvpMsg');
  const applyRsvp = v => {
    yes.setAttribute('aria-pressed', v === 'yes');
    no.setAttribute('aria-pressed', v === 'no');
    rmsg.textContent = v === 'yes' ? 'Wonderful — we can’t wait to celebrate with you!'
      : v === 'no' ? 'You will be missed. Thank you for your blessings.' : '';
  };
  applyRsvp(store.get('pa-rsvp', null));
  const choose = v => { store.set('pa-rsvp', v); applyRsvp(v); if (v === 'yes') rain(30); };
  yes.addEventListener('click', () => choose('yes'));
  no.addEventListener('click', () => choose('no'));

  /* ---------- message form ---------- */
  const form = $('#msgForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const { name, phone, message } = form.elements;
    let ok = true;
    [name, message].forEach(f => {
      const bad = !f.value.trim();
      f.classList.toggle('err', bad);
      if (bad) ok = false;
    });
    const badPhone = phone.value.trim() && !/^[+\d][\d\s-]{6,}$/.test(phone.value.trim());
    phone.classList.toggle('err', !!badPhone);
    if (badPhone) ok = false;
    if (!ok) return say('Please check the highlighted fields.');

    // Saved locally. Connect to your own backend / form service here.
    const all = store.get('pa-messages', []);
    all.push({ name: name.value.trim(), phone: phone.value.trim(), message: message.value.trim(), at: new Date().toISOString() });
    store.set('pa-messages', all);
    form.reset();
    say('Thank you for your lovely message ❀');
  });
  $$('input,textarea', form).forEach(f => f.addEventListener('input', () => f.classList.remove('err')));

  /* ---------- soft music (generated, no audio file needed) ---------- */
  const musicBtn = $('#musicBtn');
  let ctx, master, playing = false, loop;
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C major pentatonic-ish
  const note = () => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = scale[Math.floor(Math.random() * scale.length)] / (Math.random() > .7 ? 2 : 1);
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.12, t + .08);
    g.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 2.7);
  };
  musicBtn.addEventListener('click', () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return say('Audio is not supported on this browser.');
    if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = .6; master.connect(ctx.destination); }
    playing = !playing;
    if (playing) {
      ctx.resume();
      note(); loop = setInterval(note, 900);
      musicBtn.textContent = '❚❚ Pause the record';
    } else {
      clearInterval(loop);
      musicBtn.textContent = '▶ Play the record';
    }
    musicBtn.setAttribute('aria-pressed', playing);
  });
})();