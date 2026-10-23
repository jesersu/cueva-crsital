(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header shadow on scroll ---------- */
  const header = document.querySelector('.cabecera');
  if (header) {
    const onScroll = () => header.classList.toggle('con-sombra', window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu: close on link click, Esc, or outside click ---------- */
  const toggle = document.getElementById('menu-toggle');
  const toggleLabel = document.querySelector('.boton-menu');
  if (toggle) {
    const sync = () => toggleLabel && toggleLabel.setAttribute('aria-expanded', String(toggle.checked));
    const close = () => { toggle.checked = false; sync(); };
    sync();
    toggle.addEventListener('change', sync);
    document.querySelectorAll('.menu a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', (e) => {
      if (toggle.checked && !e.target.closest('nav') && !e.target.closest('.boton-menu')) close();
    });
  }

  /* ---------- Scroll reveal (staggered) ---------- */
  // .revelar is only ever added here, so content stays visible if JS fails.
  // Elements entering the viewport in the same batch get an increasing --i,
  // which styles.css turns into a transition delay.
  const revealTargets = document.querySelectorAll([
    '.titulo-seccion', '.tarjeta-tour', '.banda-cta .contenedor > *',
    '.portada-tour .contenedor > *', '.bloque:not(.legal)', '.galeria a', '.bloque.legal > *',
    '.contacto-portada .contenedor > *', '.dato-contacto', '.tarjeta-niebla',
    '.contacto-formulario-intro', 'form.contacto',
  ].join(', '));
  const timelines = document.querySelectorAll('.itinerario');
  if (!reducedMotion && 'IntersectionObserver' in window && (revealTargets.length || timelines.length)) {
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

    revealTargets.forEach((el) => { el.classList.add('revelar'); io.observe(el); });
    // Itinerary: one group; each item keeps its own index so dots pop in order.
    timelines.forEach((list) => {
      Array.from(list.children).forEach((li, i) => li.style.setProperty('--i', String(i)));
      list.classList.add('revelar-grupo');
      io.observe(list);
    });
  }

  /* ---------- Subtle parallax ---------- */
  // Hero photo panel and tour cover drift slower than the page.
  // Only transform-type properties change; layers outside the viewport are skipped.
  const heroPhoto = document.querySelector('.hero-foto');
  const tourCover = document.querySelector('.portada-tour');
  if (!reducedMotion && 'IntersectionObserver' in window && (heroPhoto || tourCover)) {
    const layers = [];
    if (heroPhoto) {
      layers.push({
        el: heroPhoto,
        factor: 0.06,
        limit: () => Infinity,
        apply: (v) => { heroPhoto.style.translate = `0 ${v}px`; },
      });
    }
    if (tourCover) {
      // The cover image layer (::after) extends 10% above the section.
      layers.push({
        el: tourCover,
        factor: 0.12,
        limit: () => tourCover.offsetHeight * 0.1,
        apply: (v) => { tourCover.style.setProperty('--desplazar', `${v}px`); },
      });
    }

    let ticking = false;
    const update = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY);
      layers.forEach((layer) => {
        if (layer.inView) layer.apply(Math.min(y * layer.factor, layer.max).toFixed(1));
      });
    };
    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    const measure = () => {
      layers.forEach((layer) => { layer.max = layer.limit(); });
      requestUpdate();
    };

    const viewIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const layer = layers.find((l) => l.el === entry.target);
        if (layer) layer.inView = entry.isIntersecting;
      });
      requestUpdate();
    });
    layers.forEach((layer) => viewIo.observe(layer.el));
    measure();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
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
    const FADE_MS = reducedMotion ? 0 : 400; // matches the .lightbox opacity transition

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
      hideTimer = window.setTimeout(() => { box.hidden = true; }, FADE_MS);
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
})();
