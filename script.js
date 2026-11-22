(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  // content protection: disable right click, drag, and text selection
  document.addEventListener("contextmenu", (event) => event.preventDefault());
  document.addEventListener("dragstart", (event) => event.preventDefault());
  // end
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v === null ? d : JSON.parse(v);
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {}
    },
  };

  /* ---------- toast ---------- */
  const toast = $("#toast");
  let toastTimer;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  };

  /* ---------- intro ---------- */
  const intro = $("#intro");
  const introAudio = $("#introAudio");
  introAudio.volume = 0.45;
  const introAudioBtn = $("#introAudioBtn");
  let introAudioRequested = false;
  let introAudioRequestId = 0;
  const syncIntroAudioControl = () => {
    const isPlaying = !introAudio.paused;
    introAudioBtn.setAttribute("aria-pressed", String(isPlaying));
    introAudioBtn.setAttribute(
      "aria-label",
      `${isPlaying ? "Pause" : "Play"} wedding music`,
    );
  };
  const playWeddingAudio = (notifyOnFailure = false) => {
    introAudioRequested = true;
    const requestId = ++introAudioRequestId;
    introAudio.play().catch((error) => {
      if (requestId !== introAudioRequestId) return;
      introAudioRequested = false;
      syncIntroAudioControl();
      if (
        error.name !== "AbortError" &&
        (notifyOnFailure || error.name !== "NotAllowedError")
      ) {
        say("Wedding audio could not be played.");
      }
    });
  };
  const pauseWeddingAudio = () => {
    introAudioRequestId++;
    introAudioRequested = false;
    introAudio.pause();
    syncIntroAudioControl();
  };
  introAudio.addEventListener("playing", syncIntroAudioControl);
  introAudio.addEventListener("pause", syncIntroAudioControl);
  introAudioBtn.addEventListener("click", () => {
    if (introAudioRequested) pauseWeddingAudio();
    else playWeddingAudio(true);
  });
  const startAudioOnFirstInteraction = (event) => {
    document.removeEventListener("pointerdown", startAudioOnFirstInteraction);
    document.removeEventListener("keydown", startAudioOnFirstInteraction);
    if (
      event.target instanceof Element &&
      event.target.closest("#introAudioBtn")
    )
      return;
    playWeddingAudio();
  };
  document.addEventListener("pointerdown", startAudioOnFirstInteraction);
  document.addEventListener("keydown", startAudioOnFirstInteraction);

  const introFlowers = $("#introFlowers");
  if (introFlowers && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const styles = [
      { className: "rose", glyph: "❀" },
      { className: "jasmine", glyph: "✿" },
      { className: "nerium", glyph: "✾" },
    ];
    const spawnIntroFlowers = () => {
      const count = 6 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const flower = document.createElement("span");
        const style = styles[Math.floor(Math.random() * styles.length)];
        flower.className = `falling-flower ${style.className}`;
        flower.textContent = style.glyph;
        flower.style.left = `${Math.random() * 100}%`;
        flower.style.setProperty("--drift", `${Math.random() * 160 - 80}px`);
        flower.style.setProperty("--dur", `${7 + Math.random() * 6}s`);
        flower.style.fontSize = `${0.8 + Math.random() * 1.1}rem`;
        flower.style.animationDelay = `${Math.random() * 1.2}s`;
        introFlowers.appendChild(flower);
        setTimeout(() => flower.remove(), 15000);
      }
    };
    setTimeout(spawnIntroFlowers, 650);
    setInterval(spawnIntroFlowers, 1800);
  }

  const openInvitation = () => {
    intro.classList.add("gone");
    document.body.classList.remove("locked");
    window.scrollTo(0, 0);
    store.set("pa-opened", true);
    setTimeout(() => {
      intro.style.display = "none";
    }, 1200);
  };
  $("#openBtn").addEventListener("click", openInvitation);
  if (store.get("pa-opened", false) && location.hash) {
    // deep link: skip cover
    intro.style.display = "none";
    document.body.classList.remove("locked");
  }

  /* ---------- nav ---------- */
  const nav = $("#nav"),
    burger = $("#burger"),
    links = $("#navLinks");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 60);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
  };
  burger.addEventListener("click", () =>
    setMenu(!links.classList.contains("open")),
  );
  $$("a", links).forEach((a) =>
    a.addEventListener("click", () => setMenu(false)),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  /* ---------- venue carousel ---------- */
  const venueTrack = $("#venueTrack");
  const venueSlides = $$(".venue-slide", venueTrack);
  const venueSlideStatus = $("#venueSlideStatus");
  let activeVenueSlide = 0;
  const showVenueSlide = (index) => {
    activeVenueSlide = (index + venueSlides.length) % venueSlides.length;
    venueTrack.style.transform = `translateX(-${activeVenueSlide * 50}%)`;
    venueSlides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeVenueSlide;
      slide.setAttribute("aria-hidden", String(!isActive));
      slide.inert = !isActive;
    });
    const activeSlide = venueSlides[activeVenueSlide];
    const venueName = activeSlide.getAttribute("aria-label");
    const previousVenueName = venueSlides[
      (activeVenueSlide + venueSlides.length - 1) % venueSlides.length
    ]
      .getAttribute("aria-label")
      .toLowerCase();
    const nextVenueName = venueSlides[
      (activeVenueSlide + 1) % venueSlides.length
    ]
      .getAttribute("aria-label")
      .toLowerCase();
    venueSlideStatus.textContent =
      `${venueName} · ${activeVenueSlide + 1} of ${venueSlides.length}`;
    $("#venuePrevious").setAttribute(
      "aria-label",
      `Show ${previousVenueName}`,
    );
    $("#venueNext").setAttribute(
      "aria-label",
      `Show ${nextVenueName}`,
    );
  };
  $("#venuePrevious").addEventListener("click", () =>
    showVenueSlide(activeVenueSlide - 1),
  );
  $("#venueNext").addEventListener("click", () =>
    showVenueSlide(activeVenueSlide + 1),
  );
  showVenueSlide(0);

  /* ---------- scroll reveal ---------- */
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) =>
            entries.forEach((en) => {
              if (en.isIntersecting) {
                en.target.classList.add("in");
                io.unobserve(en.target);
              }
            }),
          { threshold: 0.15 },
        )
      : null;
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 90 + "ms";
    io ? io.observe(el) : el.classList.add("in");
  });

  /* ---------- gallery lightbox ---------- */
  const photoTiles = $$(".tile[data-gallery-src]");
  const photoViewer = $("#photoViewer");
  const lightboxImage = $("#lightboxImage");
  const lightboxTitle = $("#lightboxTitle");
  const lightboxCount = $("#lightboxCount");
  const closePhotoViewer = $(".lightbox-close", photoViewer);
  const lightboxZoom = $(".lightbox-zoom", photoViewer);
  const photoZoomScale = 1.8;
  let activePhoto = 0;
  let lastPhotoTrigger = null;
  let panX = 0;
  let panY = 0;
  let activePanPointer = null;
  let panStartX = 0;
  let panStartY = 0;
  let panOriginX = 0;
  let panOriginY = 0;
  let didPan = false;
  let suppressImageClick = false;
  const updatePhotoPan = () => {
    const width = lightboxImage.clientWidth;
    const height = lightboxImage.clientHeight;
    if (
      !width ||
      !height ||
      !lightboxImage.naturalWidth ||
      !lightboxImage.naturalHeight
    ) {
      lightboxImage.style.setProperty("--pan-x", "0px");
      lightboxImage.style.setProperty("--pan-y", "0px");
      return;
    }
    const fitScale = Math.min(
      width / lightboxImage.naturalWidth,
      height / lightboxImage.naturalHeight,
    );
    const maxX = Math.max(
      0,
      (lightboxImage.naturalWidth * fitScale * (photoZoomScale - 1)) / 2,
    );
    const maxY = Math.max(
      0,
      (lightboxImage.naturalHeight * fitScale * (photoZoomScale - 1)) / 2,
    );
    panX = Math.max(-maxX, Math.min(maxX, panX));
    panY = Math.max(-maxY, Math.min(maxY, panY));
    lightboxImage.style.setProperty("--pan-x", `${panX}px`);
    lightboxImage.style.setProperty("--pan-y", `${panY}px`);
  };
  const setPhotoZoom = (zoomed) => {
    lightboxImage.classList.toggle("zoomed", zoomed);
    panX = 0;
    panY = 0;
    updatePhotoPan();
    lightboxImage.classList.remove("panning");
    lightboxZoom.setAttribute("aria-pressed", String(zoomed));
    lightboxZoom.setAttribute(
      "aria-label",
      zoomed ? "Reset image zoom" : "Zoom in",
    );
    lightboxZoom.textContent = zoomed ? "−" : "+";
  };
  const showPhoto = (index) => {
    activePhoto = (index + photoTiles.length) % photoTiles.length;
    const tile = photoTiles[activePhoto];
    const title = $("figcaption", tile).textContent.trim();
    setPhotoZoom(false);
    lightboxImage.src = tile.dataset.gallerySrc;
    lightboxImage.alt = title;
    lightboxTitle.textContent = title;
    lightboxCount.textContent = `${activePhoto + 1} / ${photoTiles.length}`;
  };
  const openPhotoViewer = (index) => {
    lastPhotoTrigger = photoTiles[index];
    showPhoto(index);
    photoViewer.showModal();
    closePhotoViewer.focus();
  };
  photoTiles.forEach((tile, index) => {
    tile.addEventListener("click", () => openPhotoViewer(index));
    tile.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPhotoViewer(index);
      }
    });
  });
  $(".lightbox-prev", photoViewer).addEventListener("click", () =>
    showPhoto(activePhoto - 1),
  );
  $(".lightbox-next", photoViewer).addEventListener("click", () =>
    showPhoto(activePhoto + 1),
  );
  lightboxZoom.addEventListener("click", () =>
    setPhotoZoom(!lightboxImage.classList.contains("zoomed")),
  );
  lightboxImage.addEventListener("click", () => {
    if (suppressImageClick) {
      suppressImageClick = false;
      return;
    }
    setPhotoZoom(!lightboxImage.classList.contains("zoomed"));
  });
  lightboxImage.addEventListener("pointerdown", (event) => {
    if (!lightboxImage.classList.contains("zoomed") || !event.isPrimary) return;
    activePanPointer = event.pointerId;
    panStartX = event.clientX;
    panStartY = event.clientY;
    panOriginX = panX;
    panOriginY = panY;
    didPan = false;
    lightboxImage.classList.add("panning");
    lightboxImage.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  lightboxImage.addEventListener("pointermove", (event) => {
    if (activePanPointer !== event.pointerId) return;
    const deltaX = event.clientX - panStartX;
    const deltaY = event.clientY - panStartY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) didPan = true;
    panX = panOriginX + deltaX;
    panY = panOriginY + deltaY;
    updatePhotoPan();
  });
  lightboxImage.addEventListener("pointerup", (event) => {
    if (activePanPointer !== event.pointerId) return;
    activePanPointer = null;
    lightboxImage.classList.remove("panning");
    suppressImageClick = didPan;
  });
  lightboxImage.addEventListener("pointercancel", () => {
    activePanPointer = null;
    didPan = false;
    suppressImageClick = false;
    lightboxImage.classList.remove("panning");
  });
  closePhotoViewer.addEventListener("click", () => photoViewer.close());
  photoViewer.addEventListener("click", (event) => {
    if (event.target === photoViewer) photoViewer.close();
  });
  photoViewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(activePhoto - 1);
    if (event.key === "ArrowRight") showPhoto(activePhoto + 1);
  });
  photoViewer.addEventListener("close", () => lastPhotoTrigger?.focus());

  /* ---------- wedding gift QR popup ---------- */
  const giftBtn = $("#giftBtn");
  const giftDialog = $("#giftDialog");
  const giftClose = $(".gift-dialog-close", giftDialog);
  giftBtn.addEventListener("click", () => {
    giftDialog.showModal();
    giftClose.focus();
  });
  giftClose.addEventListener("click", () => giftDialog.close());
  giftDialog.addEventListener("click", (event) => {
    if (event.target === giftDialog) giftDialog.close();
  });
  giftDialog.addEventListener("close", () => giftBtn.focus());

  /* ---------- countdown (31 Jan 2027, 10:30 IST) ---------- */
  const target = new Date("2027-01-31T10:30:00+05:30").getTime();
  const cd = { d: $("#cd-d"), h: $("#cd-h"), m: $("#cd-m"), s: $("#cd-s") };
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5);
    diff %= 864e5;
    const h = Math.floor(diff / 36e5);
    diff %= 36e5;
    const m = Math.floor(diff / 6e4);
    const s = Math.floor((diff % 6e4) / 1e3);
    cd.d.textContent = pad(d);
    cd.h.textContent = pad(h);
    cd.m.textContent = pad(m);
    cd.s.textContent = pad(s);
  };
  tick();
  setInterval(tick, 1000);

  /* ---------- flowers ---------- */
  const petals = $("#petals");
  const countEl = $("#flowerCount");
  let flowers = store.get("pa-flowers", { Parvathy: 0, Anandu: 0 });
  const showCount = () => {
    const t = flowers.Parvathy + flowers.Anandu;
    countEl.textContent = t
      ? `You have sent ${t} flower${t > 1 ? "s" : ""} ❀`
      : "";
  };
  showCount();
  const rain = (n = 22) => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "petal";
      p.style.left = Math.random() * 100 + "vw";
      p.style.setProperty("--dx", Math.random() * 160 - 80 + "px");
      p.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
      p.style.animationDuration = 3 + Math.random() * 3 + "s";
      p.style.animationDelay = Math.random() * 0.8 + "s";
      p.style.transform = `scale(${0.6 + Math.random() * 0.9})`;
      petals.appendChild(p);
      setTimeout(() => p.remove(), 7500);
    }
  };
  $$(".flower-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      const who = btn.dataset.who;
      flowers[who]++;
      store.set("pa-flowers", flowers);
      showCount();
      rain();
      say(`A flower for ${who} — thank you! ❀`);
    }),
  );

  /* ---------- scratch celebration cards ---------- */
  $$(".scratch-canvas").forEach((canvas) => {
    const card = canvas.closest(".celebration-card");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let scratching = false;
    let lastPoint = null;

    const revealCard = () => {
      canvas.classList.add("revealed");
      canvas.setAttribute("aria-label", "Date and time revealed");
      card.classList.add("scratched");
      rain(12);
    };

    const paintCover = () => {
      const rect = card.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, card.classList.contains("reception") ? "#ad3030" : "#7f1c1c");
      gradient.addColorStop(0.5, card.classList.contains("reception") ? "#8e2424" : "#611515");
      gradient.addColorStop(1, card.classList.contains("reception") ? "#651616" : "#3f1010");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "#d9ae6a";
      ctx.lineWidth = 1;
      for (let x = -height; x < width + height; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height, height);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#d9ae6a";
      ctx.font = '400 13px "Jost", sans-serif';
      ctx.letterSpacing = "3px";
      const scratchLabel = card.classList.contains("reception")
        ? "SCRATCH TO REVEAL RECEPTION DAY"
        : "SCRATCH TO REVEAL WEDDING DAY";
      ctx.fillText(scratchLabel, width / 2, height / 2 - 18);
      ctx.font = '400 34px "Cormorant Garamond", Georgia, serif';
      ctx.fillText("✦", width / 2, height / 2 + 24);
    };

    const pointFromEvent = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const scratch = (from, to) => {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 28;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    };

    const checkRevealed = () => {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0;
      const step = 16 * Math.min(window.devicePixelRatio || 1, 2);
      for (let i = 3; i < pixels.length; i += step * 4) {
        if (pixels[i] < 20) cleared++;
      }
      const sampled = Math.ceil(pixels.length / (step * 4));
      if (cleared / sampled > 0.48) revealCard();
    };

    paintCover();
    canvas.addEventListener("pointerdown", (event) => {
      scratching = true;
      canvas.setPointerCapture(event.pointerId);
      lastPoint = pointFromEvent(event);
      scratch(lastPoint, lastPoint);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!scratching) return;
      const point = pointFromEvent(event);
      scratch(lastPoint, point);
      lastPoint = point;
    });
    canvas.addEventListener("pointerup", (event) => {
      if (!scratching) return;
      scratching = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      checkRevealed();
    });
    canvas.addEventListener("pointercancel", () => {
      scratching = false;
    });
    canvas.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        revealCard();
      }
    });
  });

  /* ---------- RSVP ---------- */
  const yes = $("#rsvpYes"),
    no = $("#rsvpNo"),
    rmsg = $("#rsvpMsg");
  const applyRsvp = (v) => {
    yes.setAttribute("aria-pressed", v === "yes");
    no.setAttribute("aria-pressed", v === "no");
    rmsg.textContent =
      v === "yes"
        ? "Wonderful — we can’t wait to celebrate with you!"
        : v === "no"
          ? "You will be missed. Thank you for your blessings."
          : "";
  };
  applyRsvp(store.get("pa-rsvp", null));
  const choose = (v) => {
    store.set("pa-rsvp", v);
    applyRsvp(v);
    if (v === "yes") rain(30);
  };
  yes.addEventListener("click", () => choose("yes"));
  no.addEventListener("click", () => choose("no"));

  /* ---------- message form ---------- */
  const form = $("#msgForm");
  const submitButton = $('button[type="submit"]', form);
  const emailJsServiceId = "service_bfjl9ed";
  const emailJsTemplateId = "template_bmeuqhu";
  const emailJsPublicKey = "AZiGPDpgobvB_N4hd";
  let isSending = false;
  try {
    localStorage.removeItem("pa-messages");
  } catch {}
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSending) return;
    const { name, phone, message, website, consent } = form.elements;
    if (website.value) return form.reset();
    let ok = true;
    [name, message].forEach((f) => {
      const bad = !f.value.trim();
      f.classList.toggle("err", bad);
      if (bad) ok = false;
    });
    const badPhone =
      phone.value.trim() && !/^[+\d][\d\s-]{6,}$/.test(phone.value.trim());
    phone.classList.toggle("err", !!badPhone);
    if (badPhone) ok = false;
    consent.classList.toggle("err", !consent.checked);
    if (!consent.checked) ok = false;
    if (!ok) return say("Please check the highlighted fields.");

    try {
      const lastSent = Number(
        sessionStorage.getItem("pa-message-sent-at") || 0,
      );
      if (lastSent && Date.now() - lastSent < 30000) {
        return say("Please wait a moment before sending another message.");
      }
    } catch {}

    const nameValue = name.value.trim();
    const phoneValue = phone.value.trim();
    const messageValue = message.value.trim();
    isSending = true;
    submitButton.disabled = true;
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = "Sending...";
    try {
      await emailjs.send(
        emailJsServiceId,
        emailJsTemplateId,
        {
          name: nameValue,
          phone: phoneValue,
          message: messageValue,
        },
        { publicKey: emailJsPublicKey },
      );
    } catch (error) {
      console.error("EmailJS message send failed:", error);
      say("Your message could not be sent. Please try again.");
      return;
    } finally {
      isSending = false;
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }

    try {
      sessionStorage.setItem("pa-message-sent-at", String(Date.now()));
    } catch {}
    try {
      localStorage.removeItem("pa-messages");
    } catch {}
    form.reset();
    say("Your message was sent. Thank you for your lovely message ❀");
  });
  $$("input,textarea", form).forEach((f) =>
    f.addEventListener("input", () => f.classList.remove("err")),
  );

  /* ---------- soft music (generated, no audio file needed) ---------- */
  const musicBtn = $("#musicBtn");
  if (musicBtn) {
    let ctx,
      master,
      playing = false,
      loop;
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C major pentatonic-ish
    const note = () => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = "sine";
      o.frequency.value =
        scale[Math.floor(Math.random() * scale.length)] /
        (Math.random() > 0.7 ? 2 : 1);
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 2.7);
    };
    musicBtn.addEventListener("click", () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return say("Audio is not supported on this browser.");
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.6;
        master.connect(ctx.destination);
      }
      playing = !playing;
      if (playing) {
        ctx.resume();
        note();
        loop = setInterval(note, 900);
        musicBtn.textContent = "❚❚ Pause the record";
      } else {
        clearInterval(loop);
        musicBtn.textContent = "▶ Play the record";
      }
      musicBtn.setAttribute("aria-pressed", playing);
    });
  }
})();
