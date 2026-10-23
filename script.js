(() => {
  'use strict';

  /* ---------- Motion preference ---------- */
  // Every motion effect below is gated on this flag. If the visitor switches
  // to reduced motion mid-session, CSS neutralises the visual state and
  // `stopMotion` settles anything JS still owns (counters, header).
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;
  const onMotionStop = [];
  const stopMotion = () => onMotionStop.forEach((fn) => fn());
  const onMotionChange = (e) => {
    reducedMotion = e.matches;
    if (reducedMotion) stopMotion();
  };
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);

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
    '.titulo-seccion > :not(h2)', '.tarjeta-dato', '.cifra', '.tarjeta-tour',
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
    zoomImages.forEach((img) => {
      if (img.parentElement.getBoundingClientRect().top > vhNow()) img.style.setProperty('--zoom', String(1 + ZOOM));
    });
    frameTasks.push(() => {
      if (reducedMotion) return;
      const vh = vhNow();
      zoomImages.forEach((img) => {
        const rect = img.parentElement.getBoundingClientRect();
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

  /* ---------- Counters ---------- */
  // Numbers with data-contar count up once when first visible. The final
  // value is in the HTML and is only reset to 0 when a number nears the
  // viewport, so anything that runs JS without rendering frames keeps the
  // real values. Screen readers get a hidden static copy and the animated
  // node is aria-hidden, so intermediate numbers are never read.
  const counters = Array.from(document.querySelectorAll('[data-contar]'))
    .filter((el) => Number.isFinite(parseInt(el.dataset.contar, 10)));
  if (counters.length && !reducedMotion && hasIO) {
    const DURATION = 1200;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const finish = (el) => { el.textContent = el.dataset.contar; };

    counters.forEach((el) => {
      const copy = document.createElement('span');
      copy.className = 'sr-only';
      copy.textContent = el.textContent;
      el.before(copy);
      el.setAttribute('aria-hidden', 'true');
    });

    const count = (el) => {
      const target = parseInt(el.dataset.contar, 10);
      const start = performance.now();
      const step = (now) => {
        if (reducedMotion) { finish(el); return; }
        const t = clamp01((now - start) / DURATION);
        el.textContent = String(Math.round(target * easeOutCubic(t)));
        if (t < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };

    // Stage 1: reset to 0 just before the number scrolls into view.
    const prepareIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        prepareIo.unobserve(entry.target);
        entry.target.textContent = '0';
        counterIo.observe(entry.target);
      });
    }, { rootMargin: '0px 0px 25% 0px' });
    // Stage 2: count once the number is mostly visible.
    const counterIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        counterIo.unobserve(entry.target);
        count(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => prepareIo.observe(el));
    onMotionStop.push(() => { prepareIo.disconnect(); counterIo.disconnect(); counters.forEach(finish); });
  }

  /* ---------- Contact form: compose a WhatsApp message ---------- */
  // Without JS the form falls back to its mailto: action.
  const contactForm = document.querySelector('form.contacto');
  if (contactForm) {
    const status = contactForm.querySelector('.estado-formulario');
    const value = (id) => (contactForm.querySelector(`#${id}`)?.value || '').trim();
    const formatDate = (iso) => {
      const [y, m, d] = iso.split('-');
      return y && m && d ? `${d}/${m}/${y}` : iso;
    };

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!contactForm.reportValidity()) return;

      const lines = [
        'Hola, Los Cristales. Les escribo desde el formulario de contacto de la web.',
        '',
        `Nombre: ${value('c-nombre')}`,
        `Teléfono o correo: ${value('c-contacto')}`,
      ];
      const optional = [
        ['Tour de interés', value('c-tour')],
        ['Fecha tentativa', value('c-fecha') && formatDate(value('c-fecha'))],
        ['Número de personas', value('c-personas')],
      ];
      optional.forEach(([label, v]) => { if (v) lines.push(`${label}: ${v}`); });
      lines.push('', 'Mensaje:', value('c-mensaje'));

      const url = `https://wa.me/51978571323?text=${encodeURIComponent(lines.join('\n'))}`;
      window.open(url, '_blank', 'noopener');
      if (status) {
        // Fallback link in case the browser blocked the new tab.
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'abre WhatsApp aquí';
        status.replaceChildren(
          'Listo: preparamos tu consulta en WhatsApp. Solo tienes que enviar el mensaje. Si no se abrió, ',
          link,
          '.'
        );
      }
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const links = Array.from(document.querySelectorAll('.galeria a'));
  if (links.length) {
    const items = links.map((a) => ({ src: a.href, alt: a.querySelector('img')?.alt || '' }));
    let index = 0;
    let lastFocus = null;
    let hideTimer = null;
    const fadeMs = () => (reducedMotion ? 0 : 400); // matches the .lightbox opacity transition

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
