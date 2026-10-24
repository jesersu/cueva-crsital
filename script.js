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

  /* ---------- Theme (light default / dark) ---------- */
  // The inline <head> script already set data-theme (saved choice or light)
  // before the first paint. Here the header button switches it, persists the
  // choice in localStorage ("tema") and keeps the browser's theme-color in
  // sync. Without JS the site stays light and the button stays invisible
  // (styles.css only shows it once .tema-listo is on <html>).
  const root = document.documentElement;
  const themeButtons = document.querySelectorAll('.tema-toggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const THEME_COLOR = { dark: '#2D3436', light: '#FFFFFF' };
  const currentTheme = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  const syncTheme = () => {
    const theme = currentTheme();
    if (themeColorMeta) themeColorMeta.setAttribute('content', THEME_COLOR[theme]);
    themeButtons.forEach((button) => {
      // Fixed accessible name ("Tema claro" in the HTML); aria-pressed carries the state.
      button.setAttribute('aria-pressed', String(theme === 'light'));
    });
  };
  const applyTheme = (theme) => {
    // Every colour switches in the same frame: transitions are suspended
    // until the new styles have been computed, so links and buttons don't
    // fade on their own while the rest of the page snaps.
    root.classList.add('cambiando-tema');
    root.setAttribute('data-theme', theme);
    syncTheme();
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => root.classList.remove('cambiando-tema')));
  };
  themeButtons.forEach((button) => button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('tema', next); } catch (err) { /* storage blocked: this page view only */ }
  }));
  // Another tab changed the theme: follow it.
  window.addEventListener('storage', (e) => {
    if (e.key === 'tema') applyTheme(e.newValue === 'dark' ? 'dark' : 'light');
  });
  syncTheme();
  root.classList.add('tema-listo');

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
      // A click on the label also dispatches a synthetic click on the
      // checkbox itself (already checked by then): that one isn't "outside".
      if (toggle.checked && e.target !== toggle && !e.target.closest('nav') && !e.target.closest('.boton-menu')) close();
    });
  }

  /* ---------- Header: solid on scroll, hide on scroll down ---------- */
  // .solida (solid background + hairline) is state, not motion, so it always
  // runs: on the home page the header is transparent over the hero only
  // while it sits at the top with the mobile menu closed (.dinamica opts in,
  // so without JS the header simply stays solid). Hiding waits until the
  // visitor is past the top area and never happens while the mobile menu is
  // open or focus is inside the header.
  const header = document.querySelector('.cabecera');
  if (header) {
    const HIDE_AFTER = 320;
    const DELTA = 8;
    let lastY = Math.max(0, window.scrollY);
    const show = () => header.classList.remove('oculta');
    const syncSolid = (y) => header.classList.toggle('solida', y > 10 || Boolean(toggle && toggle.checked));
    syncSolid(lastY);
    header.classList.add('dinamica');

    frameTasks.push(() => {
      const y = Math.max(0, window.scrollY);
      syncSolid(y);
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
    '.contacto-portada .contenedor > *', '.contacto-canales', '.contacto-mensaje',
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
  // The four "Próximamente" photos are stacked; the new .activa fades in on
  // top while the previous one stays opaque beneath it as .saliente until the
  // fade ends, so the photo never dips to black (CSS adds a slow Ken Burns
  // zoom to both). Auto-rotation waits while the visitor paused it, the tab
  // is hidden, the hero is off-screen, the pointer or keyboard focus is on the
  // controls, or reduced motion is on. Under reduced motion the pause button
  // stays hidden and nothing advances, but the indicators still pick a photo.
  // Inactive slides are aria-hidden and there is no aria-live, so automatic
  // changes are never announced. The active indicator's bar (.corre) fills
  // over one interval and is restarted with every timer.
  const sliderRoot = document.querySelector('.hero-medio');
  const controlsBox = sliderRoot && sliderRoot.querySelector('.hero-controles');
  const pauseButton = sliderRoot && sliderRoot.querySelector('.hero-pausa');
  const dots = sliderRoot ? Array.from(sliderRoot.querySelectorAll('.hero-punto')) : [];
  let slides = sliderRoot ? Array.from(sliderRoot.querySelectorAll('.hero-diapositiva')) : [];
  if (slides.length > 1 && pauseButton && controlsBox && dots.length === slides.length) {
    const INTERVAL = 5500;
    const FADE = 1000; // matches the .hero-diapositiva.activa transition
    sliderRoot.style.setProperty('--intervalo', INTERVAL + 'ms');
    const photos = slides.slice(); // original order, matches the indicators
    let current = Math.max(0, slides.findIndex((s) => s.classList.contains('activa')));
    let timer = null;
    let fadeTimer = null;
    let userPaused = false;
    let hovering = false;
    let keyboardFocus = false;
    let onScreen = true;
    let wanted = -1; // photo chosen by an indicator that is still loading

    const canRotate = () => !reducedMotion && !userPaused && !document.hidden
      && onScreen && !hovering && !keyboardFocus && slides.length > 1;

    const syncDots = () => {
      const active = photos.indexOf(slides[current]);
      dots.forEach((dot, i) => {
        const on = i === active;
        dot.classList.toggle('activo', on);
        if (on) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    };

    // Restart the bar's fill animation in step with the timer
    const syncBar = (running) => {
      dots.forEach((dot) => dot.classList.remove('corre'));
      sliderRoot.classList.toggle('en-pausa', !running);
      if (!running) return;
      const dot = dots[photos.indexOf(slides[current])];
      if (!dot) return;
      void dot.offsetWidth; // reflow so the animation restarts
      dot.classList.add('corre');
    };

    const goTo = (next) => {
      if (next === current) return;
      const outgoing = slides[current];
      const incoming = slides[next];
      window.clearTimeout(fadeTimer);
      slides.forEach((s) => s.classList.remove('saliente'));
      outgoing.classList.replace('activa', 'saliente');
      outgoing.setAttribute('aria-hidden', 'true');
      incoming.classList.add('activa');
      incoming.removeAttribute('aria-hidden');
      current = next;
      syncDots();
      fadeTimer = window.setTimeout(() => outgoing.classList.remove('saliente'), FADE);
    };

    const schedule = () => {
      window.clearTimeout(timer);
      const running = canRotate();
      timer = running ? window.setTimeout(advance, INTERVAL) : null;
      syncBar(running);
    };

    // Never fade to a photo that hasn't loaded yet (they are lazy): load it
    // first and try again; a broken image is dropped (with its indicator).
    const whenReady = (index, then) => {
      const img = slides[index];
      if (img.complete && img.naturalWidth) { then(); return; }
      const drop = () => {
        const at = photos.indexOf(img);
        img.remove();
        slides = slides.filter((s) => s !== img);
        if (at > -1) { photos.splice(at, 1); dots.splice(at, 1)[0].remove(); }
        current = Math.max(0, slides.findIndex((s) => s.classList.contains('activa')));
        if (slides.length < 2) controlsBox.hidden = true;
        syncDots();
        schedule();
      };
      // An image that already failed never fires 'error' again.
      if (img.complete) { drop(); return; }
      img.loading = 'eager';
      img.addEventListener('load', () => then(), { once: true });
      img.addEventListener('error', drop, { once: true });
    };

    function advance() {
      const next = (current + 1) % slides.length;
      whenReady(next, () => { goTo(next); schedule(); });
    }

    const syncButton = () => {
      pauseButton.hidden = reducedMotion;
      pauseButton.classList.toggle('pausado', userPaused);
      pauseButton.setAttribute('aria-label', userPaused ? 'Reanudar fotos' : 'Pausar fotos');
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const next = slides.indexOf(photos[dots.indexOf(dot)]);
        if (next < 0 || next === current) return;
        wanted = next;
        whenReady(next, () => {
          if (wanted !== next) return; // a later click replaced this one
          goTo(next);
          schedule();
        });
      });
    });

    pauseButton.addEventListener('click', () => {
      userPaused = !userPaused;
      syncButton();
      // Resuming shows the next photo right away as feedback.
      if (!userPaused && !reducedMotion) advance();
      else schedule();
    });
    // Hover / keyboard focus on the controls holds the slider. Only keyboard
    // focus counts: a mouse click also focuses the button in some browsers,
    // and that alone shouldn't freeze it.
    controlsBox.addEventListener('pointerenter', () => { hovering = true; schedule(); });
    controlsBox.addEventListener('pointerleave', () => { hovering = false; schedule(); });
    controlsBox.addEventListener('focusin', (e) => {
      try { keyboardFocus = e.target.matches(':focus-visible'); } catch (err) { keyboardFocus = true; }
      schedule();
    });
    controlsBox.addEventListener('focusout', () => { keyboardFocus = false; schedule(); });
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
    controlsBox.hidden = false;
    syncDots();
    refresh();
  }

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

  /* ---------- Forms: live validation ---------- */
  // With JS the forms take over validation (noValidate) so every problem is
  // shown the same way: a red border, aria-invalid and a short text hint
  // linked with aria-describedby (never colour alone); a valid filled field
  // turns green. A field is judged once it has been left (blur), and on every
  // keystroke after the first submit attempt. Without JS the browser's own
  // validation runs as before.
  const fieldMessage = (field) => {
    const v = field.validity;
    if (v.valueMissing) {
      if (field.type === 'checkbox') return 'Marca esta casilla para continuar.';
      if (field.tagName === 'SELECT') return 'Selecciona una opción.';
      return 'Este campo es obligatorio.';
    }
    if (v.typeMismatch && field.type === 'email') return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
    if (v.rangeUnderflow || v.rangeOverflow || v.stepMismatch || v.badInput) {
      if (field.type === 'number') return `Escribe un número entre ${field.min || 1} y ${field.max || 9999}.`;
    }
    return field.validationMessage || 'Revisa este campo.';
  };

  let hintCount = 0;
  const setUpValidation = (form) => {
    const fields = Array.from(form.querySelectorAll('input, select, textarea')).filter((field) => (
      !['hidden', 'radio', 'submit', 'button'].includes(field.type)
      && !field.closest('.campo-trampa')
      && field.willValidate
    ));
    const touched = new WeakSet();
    let attempted = false;
    const hints = new Map();

    const hintFor = (field) => {
      if (hints.has(field)) return hints.get(field);
      const hint = document.createElement('p');
      hintCount += 1;
      hint.id = `${field.id || 'campo'}-pista-${hintCount}`;
      hint.className = 'pista-error';
      hint.hidden = true;
      // Checkboxes sit inside (or next to) their .aceptacion label: the hint goes after it.
      const anchor = field.type === 'checkbox' ? (field.closest('.aceptacion') || field) : field;
      anchor.insertAdjacentElement('afterend', hint);
      const described = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      field.setAttribute('aria-describedby', described.concat(hint.id).join(' '));
      hints.set(field, hint);
      return hint;
    };

    const judge = (field) => {
      const invalid = !field.checkValidity();
      const filled = field.type === 'checkbox' ? field.checked : field.value.trim() !== '';
      field.classList.toggle('es-invalido', invalid);
      field.classList.toggle('es-valido', !invalid && filled);
      if (invalid) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
      const hint = invalid ? hintFor(field) : hints.get(field);
      if (hint) {
        hint.textContent = invalid ? fieldMessage(field) : '';
        hint.hidden = !invalid;
      }
      return !invalid;
    };

    const clear = () => {
      attempted = false;
      fields.forEach((field) => {
        touched.delete(field);
        field.classList.remove('es-invalido', 'es-valido');
        field.removeAttribute('aria-invalid');
        const hint = hints.get(field);
        if (hint) { hint.hidden = true; hint.textContent = ''; }
      });
    };

    fields.forEach((field) => {
      field.addEventListener('blur', () => { touched.add(field); judge(field); });
      const onEdit = () => { if (attempted || touched.has(field)) judge(field); };
      field.addEventListener('input', onEdit);
      field.addEventListener('change', onEdit);
    });

    form.noValidate = true;
    form.classList.add('validacion-viva');

    // Returns true when the whole form is valid; otherwise focuses the first
    // invalid field (its hint is read through aria-describedby).
    const validateAll = () => {
      attempted = true;
      const invalid = fields.filter((field) => !judge(field));
      if (invalid.length) invalid[0].focus();
      return invalid.length === 0;
    };
    return { validateAll, clear };
  };

  /* ---------- Forms: send to enviar.php without leaving the page ---------- */
  // Without JS the forms post normally and enviar.php redirects back to
  // #enviado / #error (shown by CSS :target). With JS the same endpoint is
  // called with fetch and answers JSON; a network failure falls back to the
  // normal submit. The hidden "tiempo" field carries the time spent on the
  // page, which enviar.php uses to reject instant (bot) submissions. On the
  // contact page a successful send replaces the form with a success panel
  // (focused, so it is announced) that offers to send another message.
  const pageLoadedAt = Date.now();
  document.querySelectorAll('form.contacto, form.reclamo').forEach((form) => {
    const status = form.querySelector('.estado-formulario');
    const button = form.querySelector('button[type="submit"]');
    const elapsed = form.querySelector('input[name="tiempo"]');
    const buttonText = button ? button.textContent : '';
    const validation = setUpValidation(form);
    const replaceOnSuccess = form.classList.contains('contacto');
    let sending = false;
    let successPanel = null;

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

    const showSuccess = (message) => {
      successPanel = document.createElement('div');
      successPanel.className = 'exito-formulario';
      successPanel.setAttribute('role', 'status');
      successPanel.tabIndex = -1;
      const title = document.createElement('p');
      title.className = 'exito-titulo';
      title.textContent = 'Consulta enviada.';
      const text = document.createElement('p');
      text.textContent = message;
      const again = document.createElement('button');
      again.type = 'button';
      again.className = 'boton fantasma';
      again.textContent = 'Enviar otro mensaje';
      again.addEventListener('click', () => {
        successPanel.remove();
        successPanel = null;
        form.hidden = false;
        const first = form.querySelector('.campos input, .campos select, .campos textarea');
        if (first) first.focus();
      });
      successPanel.append(title, text, again);
      form.hidden = true;
      form.insertAdjacentElement('afterend', successPanel);
      successPanel.focus();
    };

    form.addEventListener('submit', (e) => {
      if (elapsed) elapsed.value = String(Date.now() - pageLoadedAt);
      if (sending) { e.preventDefault(); return; }
      if (!validation.validateAll()) { e.preventDefault(); return; }
      if (!window.fetch || !window.FormData) return; // valid: let the browser post it
      e.preventDefault();

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
            if (!ok) { report(message, true); return; }
            form.reset();
            validation.clear();
            if (replaceOnSuccess) showSuccess(message);
            else report(message, false);
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
      <button class="lb-cerrar" type="button" aria-label="Cerrar"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      <button class="lb-prev" type="button" aria-label="Foto anterior"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m15 6-6 6 6 6"/></svg></button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="lb-next" type="button" aria-label="Foto siguiente"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6"/></svg></button>`;
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
