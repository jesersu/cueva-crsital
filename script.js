(() => {
  'use strict';

  /* ---------- Motion preference ---------- */
  // Every motion effect below is gated on this flag. If the visitor switches
  // to reduced motion mid-session, CSS neutralises the visual state and
  // `stopMotion` settles anything JS still owns (counters, header, slider);
  // `onMotionStart` lets timed effects (the hero slider) resume when it is
  // switched back off.
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;
  const onMotionStop = [];
  const onMotionStart = [];
  const stopMotion = () => onMotionStop.forEach((fn) => fn());
  const onMotionChange = (e) => {
    reducedMotion = e.matches;
    if (reducedMotion) stopMotion();
    else onMotionStart.forEach((fn) => fn());
  };
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
  else if (motionQuery.addListener) motionQuery.addListener(onMotionChange); // Safari < 14

  const hasIO = 'IntersectionObserver' in window;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  /* ---------- Frame scheduler ---------- */
  // One passive scroll/resize listener and one rAF per frame for every
  // scroll-linked effect; each task early-exits when its element is off-screen.
  const frameTasks = [];
  const measureTasks = [];
  let ticking = false;
  const runFrame = () => {
    ticking = false;
    frameTasks.forEach((task) => task());
  };
  const requestFrame = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(runFrame);
  };
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', () => {
    measureTasks.forEach((task) => task());
    requestFrame();
  }, { passive: true });

  /* ---------- Press feedback on touch ---------- */
  // iOS Safari only applies :active styles (the scale-on-press feedback in
  // styles.css) once the page listens for touchstart; a passive no-op is enough.
  document.addEventListener('touchstart', () => {}, { passive: true });

  /* ---------- Mobile menu: close on link click, Esc, or outside click ---------- */
  const toggle = document.getElementById('menu-toggle');
  const toggleLabel = document.querySelector('.boton-menu');
  if (toggle) {
    const sync = () => toggleLabel && toggleLabel.setAttribute('aria-expanded', String(toggle.checked));
    const close = () => { toggle.checked = false; sync(); };
    sync();
    toggle.addEventListener('change', () => { sync(); requestFrame(); });
    document.querySelectorAll('.menu a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', (e) => {
      if (toggle.checked && !e.target.closest('nav') && !e.target.closest('.boton-menu')) close();
    });
  }

  /* ---------- Header: hairline on scroll, hide on scroll down ---------- */
  // The hairline is state, not motion, so it always runs. Hiding waits until
  // the visitor is past the top area and never happens while the mobile menu
  // is open or focus is inside the header.
  const header = document.querySelector('.cabecera');
  if (header) {
    const HIDE_AFTER = 320;
    const DELTA = 8;
    let lastY = Math.max(0, window.scrollY);
    const show = () => header.classList.remove('oculta');

    frameTasks.push(() => {
      const y = Math.max(0, window.scrollY);
      header.classList.toggle('con-sombra', y > 10);
      if (reducedMotion) { show(); lastY = y; return; }

      const pinned = y < HIDE_AFTER
        || (toggle && toggle.checked)
        || header.contains(document.activeElement);
      if (pinned) { show(); lastY = y; return; }

      const dy = y - lastY;
      if (Math.abs(dy) < DELTA) return; // ignore jitter; keep the reference point
      header.classList.toggle('oculta', dy > 0);
      lastY = y;
    });
    header.addEventListener('focusin', show);
    onMotionStop.push(show);
  }

  /* ---------- Scroll reveal (staggered) ---------- */
  // .revelar, .revelar-mascara and .revelar-marca are only ever added here,
  // so content stays visible if JS fails. Elements entering the viewport in
  // the same batch get an increasing --i, which styles.css turns into a delay.
  const revealTargets = document.querySelectorAll([
    '.titulo-seccion > :not(h2)', '.tarjeta-dato', '.tarjeta-tour',
    '.seccion > .banda-oscura', '.banda-cta .contenedor > *',
    '.bloque:not(.legal)', '.galeria a', '.bloque.legal > *',
    '.contacto-portada .contenedor > *', '.dato-contacto', '.tarjeta-whatsapp',
    '.contacto-formulario-intro', 'form.contacto',
  ].join(', '));
  const maskTargets = document.querySelectorAll('.titulo-seccion h2');
  const brandTargets = document.querySelectorAll('.pie-copy');
  const timelines = document.querySelectorAll('.itinerario');
  if (!reducedMotion && hasIO) {
    const MAX_STEP = 8;
    const byDocumentOrder = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    // threshold 0 + bottom margin: tall blocks (long legal texts) still reveal.
    const io = new IntersectionObserver((entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target)
        .sort(byDocumentOrder)
        .forEach((el, i) => {
          el.style.setProperty('--i', String(Math.min(i, MAX_STEP)));
          el.classList.add('visible');
          io.unobserve(el);
        });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

    const watch = (list, className) => list.forEach((el) => { el.classList.add(className); io.observe(el); });
    watch(revealTargets, 'revelar');
    watch(maskTargets, 'revelar-mascara');
    watch(brandTargets, 'revelar-marca');
    // Itinerary: one group; each item keeps its own index so dots pop in order.
    timelines.forEach((list) => {
      Array.from(list.children).forEach((li, i) => li.style.setProperty('--i', String(i)));
      list.classList.add('revelar-grupo');
      io.observe(list);
    });
  }

  /* ---------- Scroll-linked hero ---------- */
  // --progreso (0–1) is the hero's own scroll range; styles.css maps it to the
  // photo zoom/dim and the text drift. Only a custom property is written, so
  // the CSS entrance animations never fight inline styles.
  const hero = document.querySelector('.hero');
  if (hero && !reducedMotion) {
    let lastProgress = -1;
    frameTasks.push(() => {
      if (reducedMotion) return;
      const rect = hero.getBoundingClientRect();
      const progress = clamp01(-rect.top / (rect.height || 1));
      if (progress === lastProgress) return; // also covers "scrolled far past"
      lastProgress = progress;
      hero.style.setProperty('--progreso', progress.toFixed(3));
    });
  }

  /* ---------- Hero slider (crossfade) ---------- */
  // Slides are stacked; the new .activa fades in on top while the previous
  // one stays opaque beneath it as .saliente until the fade ends, so the photo
  // never dips to black. Auto-rotation waits while the visitor paused it, the
  // tab is hidden, the hero is off-screen, the pointer or keyboard focus is on
  // the pause button, or reduced motion is on (the button then stays hidden,
  // as without JS). Inactive slides are aria-hidden and there is no aria-live,
  // so automatic changes are never announced.
  const sliderRoot = document.querySelector('.hero-medio');
  const pauseButton = sliderRoot && sliderRoot.querySelector('.hero-pausa');
  let slides = sliderRoot ? Array.from(sliderRoot.querySelectorAll('.hero-diapositiva')) : [];
  if (slides.length > 1 && pauseButton) {
    const INTERVAL = 5500;
    const FADE = 1000; // matches the .hero-diapositiva.activa transition
    let current = Math.max(0, slides.findIndex((s) => s.classList.contains('activa')));
    let timer = null;
    let fadeTimer = null;
    let userPaused = false;
    let hovering = false;
    let keyboardFocus = false;
    let onScreen = true;

    const canRotate = () => !reducedMotion && !userPaused && !document.hidden
      && onScreen && !hovering && !keyboardFocus && slides.length > 1;

    const goTo = (next) => {
      const outgoing = slides[current];
      const incoming = slides[next];
      window.clearTimeout(fadeTimer);
      slides.forEach((s) => s.classList.remove('saliente'));
      outgoing.classList.replace('activa', 'saliente');
      outgoing.setAttribute('aria-hidden', 'true');
      incoming.classList.add('activa');
      incoming.removeAttribute('aria-hidden');
      current = next;
      fadeTimer = window.setTimeout(() => outgoing.classList.remove('saliente'), FADE);
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = canRotate() ? window.setTimeout(advance, INTERVAL) : null;
    };

    // Never fade to a photo that hasn't loaded yet (they are lazy): load it
    // first and try again on the next interval; a broken image is dropped.
    function advance() {
      const next = (current + 1) % slides.length;
      const img = slides[next];
      if (img.complete && img.naturalWidth) {
        goTo(next);
        schedule();
        return;
      }
      const drop = () => {
        img.remove();
        slides = slides.filter((s) => s !== img);
        current = slides.findIndex((s) => s.classList.contains('activa'));
        syncButton();
        schedule();
      };
      // An image that already failed never fires 'error' again.
      if (img.complete) { drop(); return; }
      img.loading = 'eager';
      img.addEventListener('load', schedule, { once: true });
      img.addEventListener('error', drop, { once: true });
    }

    const syncButton = () => {
      pauseButton.hidden = reducedMotion || slides.length < 2;
      pauseButton.classList.toggle('pausado', userPaused);
      pauseButton.setAttribute('aria-label', userPaused ? 'Reanudar fotos' : 'Pausar fotos');
    };

    pauseButton.addEventListener('click', () => {
      userPaused = !userPaused;
      syncButton();
      // Resuming shows the next photo right away as feedback.
      if (!userPaused && !reducedMotion) advance();
      else schedule();
    });
    pauseButton.addEventListener('pointerenter', () => { hovering = true; schedule(); });
    pauseButton.addEventListener('pointerleave', () => { hovering = false; schedule(); });
    // Only keyboard focus holds the slider: a mouse click also focuses the
    // button in some browsers, and that alone shouldn't freeze it.
    pauseButton.addEventListener('focus', () => {
      try { keyboardFocus = pauseButton.matches(':focus-visible'); } catch (err) { keyboardFocus = true; }
      schedule();
    });
    pauseButton.addEventListener('blur', () => { keyboardFocus = false; schedule(); });
    document.addEventListener('visibilitychange', schedule);
    if (hasIO) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        schedule();
      }).observe(sliderRoot);
    }

    const refresh = () => { syncButton(); schedule(); };
    onMotionStop.push(refresh);
    onMotionStart.push(refresh);
    refresh();
  }

  /* ---------- Horizontal photo slider (Próximamente) ---------- */
  // The track is a native scroll-snap scroller, so touch, trackpad and arrow
  // keys (once the track has focus) work without JS. Here we only reveal the
  // prev/next buttons: each one moves to the neighbouring card's snap point
  // (cards differ in width) and is disabled at its end of the track. State is
  // refreshed on the track's own passive scroll listener, once per frame.
  document.querySelectorAll('.carrusel').forEach((root) => {
    const track = root.querySelector('.carrusel-pista');
    const controls = root.querySelector('.carrusel-controles');
    const prev = root.querySelector('.carrusel-anterior');
    const next = root.querySelector('.carrusel-siguiente');
    const cards = Array.from(root.querySelectorAll('.carrusel-tarjeta'));
    if (!track || !controls || !prev || !next || cards.length < 2) return;

    const EDGE = 2; // px tolerance for fractional scroll positions
    let pending = false;

    // Scroll position at which each card sits on the snap line. The first
    // card's offset is the gutter (list padding = scroll-padding).
    const snapPoints = () => {
      const left = track.getBoundingClientRect().left - track.scrollLeft;
      const offsets = cards.map((card) => card.getBoundingClientRect().left - left);
      const max = track.scrollWidth - track.clientWidth;
      return offsets.map((x) => Math.min(max, Math.max(0, x - offsets[0])));
    };

    const update = () => {
      pending = false;
      const max = track.scrollWidth - track.clientWidth;
      controls.hidden = max <= EDGE; // nothing to scroll (very wide screens)
      prev.disabled = track.scrollLeft <= EDGE;
      next.disabled = track.scrollLeft >= max - EDGE;
    };
    const requestUpdate = () => {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(update);
    };

    const go = (direction) => {
      const x = track.scrollLeft;
      const points = snapPoints();
      const target = direction > 0
        ? points.find((p) => p > x + EDGE)
        : points.slice().reverse().find((p) => p < x - EDGE);
      if (target === undefined) return;
      // 'auto' is instant here: the track sets no CSS scroll-behavior.
      track.scrollBy({ left: target - x, behavior: reducedMotion ? 'auto' : 'smooth' });
    };

    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('scroll', requestUpdate, { passive: true });
    measureTasks.push(requestUpdate);
    controls.hidden = false;
    update();
  });

  /* ---------- Word-by-word highlight ---------- */
  // Each statement keeps a visually hidden copy for screen readers; the word
  // spans are aria-hidden. --luz (0–1 per word) defaults to 1 in CSS, so the
  // text is fully lit without JS or under reduced motion.
  const statements = reducedMotion ? [] : Array.from(document.querySelectorAll('.declaracion'));
  const highlightGroups = statements.map((el) => {
    const text = el.textContent.trim();
    const copy = document.createElement('span');
    copy.className = 'sr-only';
    copy.textContent = text;
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    const words = [];
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { visual.append(part); return; }
      const word = document.createElement('span');
      word.className = 'palabra';
      word.textContent = part;
      word.style.setProperty('--luz', '0');
      visual.append(word);
      words.push(word);
    });
    el.replaceChildren(copy, visual);
    return { el, words };
  });
  if (highlightGroups.length) {
    frameTasks.push(() => {
      if (reducedMotion) return;
      const vh = window.innerHeight;
      highlightGroups.forEach(({ el, words }) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        // Lighting starts when the block's top reaches 85% of the viewport
        // and completes when its bottom passes 45%: done by the centre line.
        const progress = clamp01((vh * 0.85 - rect.top) / (vh * 0.4 + rect.height));
        const lit = progress * words.length;
        words.forEach((word, i) => word.style.setProperty('--luz', clamp01(lit - i).toFixed(2)));
      });
    });
  }

  /* ---------- Scroll-linked image zoom ---------- */
  // Card and gallery photos settle from 1.12 to 1 as their frame travels into
  // view; the 28px/18px frames clip the overflow. Writes --zoom only.
  const zoomImages = reducedMotion ? [] : Array.from(document.querySelectorAll('.tarjeta-tour .marco img, .galeria img'));
  if (zoomImages.length) {
    const ZOOM = 0.12;
    const vhNow = () => window.innerHeight;
    // Start images below the fold zoomed in, so they don't jump on entry.
    // Read every rect before writing, so the writes don't force a layout per image.
    const initialTops = zoomImages.map((img) => img.parentElement.getBoundingClientRect().top);
    zoomImages.forEach((img, i) => {
      if (initialTops[i] > vhNow()) img.style.setProperty('--zoom', String(1 + ZOOM));
    });
    frameTasks.push(() => {
      if (reducedMotion) return;
      const vh = vhNow();
      // Batch reads, then writes (avoids layout thrash on long galleries).
      const rects = zoomImages.map((img) => img.parentElement.getBoundingClientRect());
      zoomImages.forEach((img, i) => {
        const rect = rects[i];
        if (rect.bottom < 0 || rect.top > vh) return;
        const progress = clamp01((vh - rect.top) / (vh * 0.7));
        img.style.setProperty('--zoom', (1 + ZOOM * (1 - progress)).toFixed(3));
      });
    });
  }

  /* ---------- Tour cover parallax ---------- */
  // The cover image layer (::after) extends 10% above the section; it drifts
  // slower than the page and zooms slightly as the cover scrolls away.
  const tourCover = document.querySelector('.portada-tour');
  if (tourCover && !reducedMotion) {
    let coverHeight = tourCover.offsetHeight;
    measureTasks.push(() => { coverHeight = tourCover.offsetHeight; });
    frameTasks.push(() => {
      if (reducedMotion) return;
      if (tourCover.getBoundingClientRect().bottom < 0) return;
      const y = Math.max(0, window.scrollY);
      tourCover.style.setProperty('--desplazar', `${Math.min(y * 0.12, coverHeight * 0.1).toFixed(1)}px`);
      tourCover.style.setProperty('--zoom-portada', (1 + 0.08 * clamp01(y / (coverHeight || 1))).toFixed(3));
    });
  }

  /* ---------- Forms: send to enviar.php without leaving the page ---------- */
  // Without JS the forms post normally and enviar.php redirects back to
  // #enviado / #error (shown by CSS :target). With JS the same endpoint is
  // called with fetch and answers JSON; a network failure falls back to the
  // normal submit. The hidden "tiempo" field carries the time spent on the
  // page, which enviar.php uses to reject instant (bot) submissions.
  const pageLoadedAt = Date.now();
  document.querySelectorAll('form.contacto, form.reclamo').forEach((form) => {
    const status = form.querySelector('.estado-formulario');
    const button = form.querySelector('button[type="submit"]');
    const elapsed = form.querySelector('input[name="tiempo"]');
    const buttonText = button ? button.textContent : '';
    let sending = false;

    const report = (message, isError) => {
      if (!status) return;
      status.textContent = message;
      status.classList.toggle('es-error', Boolean(isError));
    };
    const setSending = (on) => {
      sending = on;
      form.setAttribute('aria-busy', String(on));
      if (!button) return;
      button.disabled = on;
      button.textContent = on ? 'Enviando…' : buttonText;
    };

    form.addEventListener('submit', (e) => {
      if (elapsed) elapsed.value = String(Date.now() - pageLoadedAt);
      if (!window.fetch || !window.FormData) return; // let the browser post it
      e.preventDefault();
      if (sending || !form.reportValidity()) return;

      // A previous no-JS result (#enviado / #error) must not linger: removing
      // the hash alone doesn't re-evaluate :target, so hide the notices.
      document.querySelectorAll('.aviso-envio').forEach((el) => { el.hidden = true; });
      if ((location.hash === '#enviado' || location.hash === '#error') && history.replaceState) {
        history.replaceState(null, '', location.pathname + location.search);
      }
      report('');
      setSending(true);

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
        .then((res) => res.json()
          .catch(() => null)
          .then((data) => {
            setSending(false);
            const ok = Boolean(res.ok && data && data.ok);
            const message = data && typeof data.message === 'string' && data.message
              ? data.message
              : 'No pudimos enviar el formulario. Inténtalo más tarde.';
            report(message, !ok);
            if (ok) form.reset();
          }))
        .catch(() => {
          // Don't resubmit natively: the request may already have reached
          // enviar.php (a retry would send a duplicate message or claim), and
          // an offline native post would lose everything typed in the form.
          setSending(false);
          report('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.', true);
        });
    });
  });

  /* ---------- Gallery lightbox ---------- */
  const links = Array.from(document.querySelectorAll('.galeria a'));
  if (links.length) {
    const items = links.map((a) => ({ src: a.href, alt: a.querySelector('img')?.alt || '' }));
    let index = 0;
    let lastFocus = null;
    let hideTimer = null;
    const fadeMs = () => (reducedMotion ? 0 : 200); // matches the .lightbox exit (fade-out) transition

    const box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Galería de fotos');
    box.innerHTML = `
      <button class="lb-cerrar" type="button" aria-label="Cerrar">×</button>
      <button class="lb-prev" type="button" aria-label="Foto anterior">‹</button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="lb-next" type="button" aria-label="Foto siguiente">›</button>`;
    document.body.appendChild(box);

    const img = box.querySelector('img');
    const caption = box.querySelector('figcaption');
    const closeBtn = box.querySelector('.lb-cerrar');

    const show = (i) => {
      index = (i + items.length) % items.length;
      img.src = items[index].src;
      img.alt = items[index].alt;
      caption.textContent = `${items[index].alt} (${index + 1}/${items.length})`;
    };
    const isOpen = () => box.classList.contains('abierto');
    const open = (i) => {
      window.clearTimeout(hideTimer);
      lastFocus = document.activeElement;
      show(i);
      box.hidden = false;
      document.body.classList.add('lb-abierto');
      void box.offsetWidth; // commit display before fading in
      box.classList.add('abierto');
      closeBtn.focus();
    };
    const close = () => {
      if (!isOpen()) return;
      box.classList.remove('abierto');
      document.body.classList.remove('lb-abierto');
      if (lastFocus) lastFocus.focus();
      // Restore `hidden` once the fade-out has finished.
      hideTimer = window.setTimeout(() => { box.hidden = true; }, fadeMs());
    };

    links.forEach((a, i) => a.addEventListener('click', (e) => { e.preventDefault(); open(i); }));
    closeBtn.addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
    box.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });

    document.addEventListener('keydown', (e) => {
      if (!isOpen()) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'Tab') {
        const f = box.querySelectorAll('button');
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Swipe on touch devices
    let startX = null;
    box.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  /* ---------- First frame ---------- */
  // All tasks are registered: paint the initial scroll-linked state once.
  requestFrame();
})();
