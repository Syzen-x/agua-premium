(function () {
  'use strict';

  const WA_NUMBER = '593988212277';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]motion/.test(location.search);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ── catálogo (solo datos confirmados por la marca) ── */
  const PRODUCTS = [
    {
      id: 'agua-625', short: '625 ml', name: 'Agua Premium 625 ml', h: 215,
      desc: 'En botella ECOFLEX: más resistente, más ligera y 100% reciclable. Agua purificada y envasada sin gas.',
      facts: ['Botella ECOFLEX', '100% reciclable', 'Sin gas'],
      img: 'assets/img/productos/agua-625.webp', iw: 540, ih: 1980
    },
    {
      id: 'agua-1l', short: '1 litro', name: 'Agua Premium 1 litro', h: 285,
      desc: 'Agua purificada y envasada sin gas, para la mesa, el trabajo o la jornada completa.',
      facts: ['1 litro', 'Sin gas'],
      img: 'assets/img/productos/agua-1l.webp', iw: 534, ih: 1772
    },
    {
      id: 'agua-galon', short: 'Galón', name: 'Agua Premium galón', h: 300,
      desc: 'Agua purificada en galón, para la cocina y el consumo diario de la casa.',
      facts: ['Galón', 'Para la casa'],
      img: 'assets/img/productos/agua-galon.webp', iw: 704, ih: 1422
    },
    {
      id: 'agua-20l', short: 'Garrafón 20 L', name: 'Garrafón Agua Premium 20 L', h: 490,
      desc: 'Para el dispensador de la casa, la oficina o el negocio.',
      facts: ['20 litros', 'Para dispensador'],
      img: 'assets/img/productos/agua-20l.webp', iw: 874, ih: 1522
    },
    {
      id: 'hielo-2kg', short: 'Hielo 2 kg', name: 'Ice Fresh Premium 2 kg', h: 330,
      desc: 'Hielo 100% purificado en cubitos cristalinos. Funda de 2 kg con agarradera.',
      facts: ['Hielo 100% purificado', 'Funda con agarradera', 'Cubitos cristalinos'],
      img: 'assets/img/productos/hielo-2kg.webp', iw: 1010, ih: 1498
    }
  ];
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

  /* ── estado del pedido ── */
  const order = load();
  function load() {
    try { const o = JSON.parse(localStorage.getItem('ap-order') || '{}'); return typeof o === 'object' && o ? o : {}; }
    catch (e) { return {}; }
  }
  function save() { try { localStorage.setItem('ap-order', JSON.stringify(order)); } catch (e) { /* sin almacenamiento */ } }
  function count() { return Object.values(order).reduce((a, b) => a + b, 0); }
  function add(id, qty) {
    if (!byId[id] || qty <= 0) return;
    order[id] = Math.min(999, (order[id] || 0) + qty);
    save(); renderOrder(true);
  }
  function setQty(id, qty) {
    if (qty <= 0) delete order[id]; else order[id] = Math.min(999, qty);
    save(); renderOrder(false);
  }
  function waURL(text) { return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`; }
  function orderText(city, address, extra) {
    const lines = ['Hola Premium Distribuciones, quiero hacer un pedido:'];
    const items = extra || Object.entries(order).map(([id, q]) => [id, q]);
    items.forEach(([id, q]) => lines.push(`• ${q} × ${byId[id].name}`));
    if (city) lines.push('', `Ciudad: ${city}`);
    if (address) lines.push(`Dirección: ${address}`);
    return lines.join('\n');
  }
  function openWA(text) { window.open(waURL(text), '_blank', 'noopener'); }

  /* ── stepper reutilizable ── */
  function stepper(root, initial, onChange) {
    let v = initial;
    const out = $('[data-step-value]', root);
    const set = (n) => { v = Math.max(1, Math.min(999, n)); out.textContent = v; onChange && onChange(v); };
    $$('[data-step]', root).forEach(b => b.addEventListener('click', () => set(v + Number(b.dataset.step))));
    set(initial);
    return { get: () => v, set };
  }

  /* ── pedido rápido (hero) ── */
  const chipsRoot = $('[data-quick-chips]');
  chipsRoot.innerHTML = PRODUCTS.map((p, i) => `
    <label class="chip"><input type="radio" name="quick-product" value="${p.id}" ${i === 3 ? 'checked' : ''}><span>${p.short}</span></label>`).join('');
  const quickStep = stepper($('[data-quick] [data-stepper]'), 1);
  $('[data-quick]').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('input[name="quick-product"]:checked').value;
    openWA(orderText('', '', [[id, quickStep.get()]]));
  });

  /* ── la línea de productos ── */
  const lineup = $('[data-lineup]');
  lineup.innerHTML = PRODUCTS.map((p, i) => `
    <button class="item" type="button" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-id="${p.id}" style="--h:${p.h}" aria-label="${p.name}">
      <span class="item__label">${p.short}</span><img src="${p.img}" alt="" width="${p.iw}" height="${p.ih}" decoding="async">
    </button>`).join('');
  const items = $$('.item', lineup);
  const spec = $('[data-spec]');
  const specStep = stepper($('[data-spec-stepper]'), 1);
  let current = PRODUCTS[0].id;
  function select(id, focus) {
    current = id;
    items.forEach(b => { const on = b.dataset.id === id; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    const p = byId[id];
    $('[data-spec-name]').textContent = p.name;
    $('[data-spec-desc]').textContent = p.desc;
    $('[data-spec-facts]').innerHTML = p.facts.map(f => `<li>${f}</li>`).join('');
    $('[data-spec-add]').textContent = `Agregar ${p.short} al pedido`;
    specStep.set(1);
    spec.classList.remove('is-swap'); void spec.offsetWidth; spec.classList.add('is-swap');
  }
  items.forEach((b, i) => {
    b.addEventListener('click', () => select(b.dataset.id));
    b.addEventListener('keydown', (e) => {
      const k = e.key; let j = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % items.length;
      if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + items.length) % items.length;
      if (j !== null) { e.preventDefault(); select(items[j].dataset.id, true); }
    });
  });
  select(current);
  $('[data-spec-add]').addEventListener('click', () => add(current, specStep.get()));
  $$('[data-add]').forEach(b => b.addEventListener('click', () => add(b.dataset.add, 1)));

  /* ── barra y panel del pedido ── */
  const countEl = $('[data-count]');
  const bar = $('[data-orderbar]');
  const drawer = $('[data-drawer]');
  const list = $('[data-drawer-items]');
  function renderOrder(bump) {
    const n = count();
    countEl.hidden = n === 0;
    countEl.textContent = n;
    if (bump && n) { countEl.classList.remove('is-bump'); void countEl.offsetWidth; countEl.classList.add('is-bump'); }
    bar.hidden = n === 0;
    const kinds = Object.keys(order).length;
    $('[data-orderbar-text]').textContent = n ? `${n} ${n === 1 ? 'producto' : 'productos'} en tu pedido${kinds > 1 ? ` (${kinds} tipos)` : ''}` : 'Tu pedido';
    $('[data-orderbar-send]').href = waURL(orderText('', ''));
    drawer.classList.toggle('is-empty', n === 0);
    $('[data-drawer-empty]').hidden = n !== 0;
    list.innerHTML = Object.entries(order).map(([id, q]) => `
      <li data-line="${id}"><span>${byId[id].name}</span>
        <div class="stepper"><button type="button" data-d="-1" aria-label="Quitar uno de ${byId[id].name}"><svg aria-hidden="true"><use href="#i-minus"/></svg></button>
        <output aria-live="polite">${q}</output>
        <button type="button" data-d="1" aria-label="Agregar uno de ${byId[id].name}"><svg aria-hidden="true"><use href="#i-plus"/></svg></button></div>
      </li>`).join('');
  }
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    const id = b.closest('[data-line]').dataset.line;
    setQty(id, (order[id] || 0) + Number(b.dataset.d));
  });
  let lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    if (window.__lenis) window.__lenis.stop();
    $('.drawer__panel', drawer).focus();
  }
  function closeDrawer() {
    drawer.hidden = true;
    document.documentElement.style.overflow = '';
    if (window.__lenis) window.__lenis.start();
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  $$('[data-open-order]').forEach(b => b.addEventListener('click', openDrawer));
  drawer.addEventListener('click', (e) => { if (e.target.closest('[data-close-order]')) closeDrawer(); });
  document.addEventListener('keydown', (e) => {
    if (drawer.hidden) return;
    if (e.key === 'Escape') closeDrawer();
    if (e.key === 'Tab') {
      const f = $$('a[href],button:not([disabled]),input,select', drawer).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $('[data-drawer-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!count()) return;
    const fd = new FormData(e.target);
    openWA(orderText(fd.get('ciudad'), (fd.get('direccion') || '').trim()));
  });
  renderOrder(false);
  // la barra flotante no tapa el pedido rápido del inicio
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => bar.classList.toggle('is-tucked', en.isIntersecting), { threshold: 0.15 }).observe($('[data-quick]'));
  }

  /* ── formulario de negocios ── */
  const supply = $('[data-supply]');
  $('[data-supply-products]').innerHTML = PRODUCTS.map(p => `
    <label class="chip"><input type="checkbox" name="productos" value="${p.id}" ${p.id === 'hielo-2kg' || p.id === 'agua-625' ? 'checked' : ''}><span>${p.short}</span></label>`).join('');
  supply.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(supply);
    const name = (fd.get('negocio') || '').trim();
    const prods = fd.getAll('productos');
    const nameField = supply.querySelector('[name="negocio"]').closest('.field');
    const prodField = $('[data-supply-products]').closest('.field');
    nameField.classList.toggle('has-error', !name);
    prodField.classList.toggle('has-error', prods.length === 0);
    if (!name) { supply.querySelector('[name="negocio"]').focus(); return; }
    if (!prods.length) return;
    const text = [
      'Hola Premium Distribuciones, quiero abastecer mi negocio.',
      `Negocio: ${name} (${fd.get('tipo')})`,
      `Ciudad: ${fd.get('ciudad')}`,
      `Me interesa: ${prods.map(id => byId[id].name).join(', ')}`
    ].join('\n');
    openWA(text);
  });
  supply.querySelector('[name="negocio"]').addEventListener('input', (e) => {
    if (e.target.value.trim()) e.target.closest('.field').classList.remove('has-error');
  });
  $('[data-supply-products]').addEventListener('change', () => {
    if (supply.querySelectorAll('[name="productos"]:checked').length) $('[data-supply-products]').closest('.field').classList.remove('has-error');
  });

  /* ── mapa de cobertura ── */
  const TOWNS = {
    lago: { name: 'Lago Agrio', city: 'Lago Agrio (Nueva Loja)', roads: [] },
    shushufindi: { name: 'Shushufindi', city: 'Shushufindi', roads: ['shushufindi'] },
    sacha: { name: 'Sacha', city: 'Sacha', roads: ['sacha'] },
    coca: { name: 'Coca', city: 'Coca', roads: ['sacha', 'coca'] },
    loreto: { name: 'Loreto', city: 'Loreto', roads: ['sacha', 'coca', 'loreto'] }
  };
  const cta = $('[data-town-cta]');
  function pickTown(key) {
    const t = TOWNS[key];
    $$('[data-town]').forEach(b => b.setAttribute('aria-pressed', b.dataset.town === key));
    $$('[data-town-dot]').forEach(g => g.classList.toggle('is-on', g.dataset.townDot === key));
    $$('[data-road]').forEach(p => p.classList.toggle('is-on', t.roads.includes(p.dataset.road)));
    $('[data-town-cta-label]').textContent = `Pedir en ${t.name}`;
    cta.href = waURL(`Hola Premium Distribuciones, quiero hacer un pedido en ${t.city}.`);
    const sel = $('[data-drawer-city]');
    Array.from(sel.options).forEach(o => { if (o.value === t.city) sel.value = o.value; });
  }
  $$('[data-town]').forEach(b => b.addEventListener('click', () => pickTown(b.dataset.town)));
  $$('[data-town-dot]').forEach(g => g.addEventListener('click', () => pickTown(g.dataset.townDot)));
  pickTown('lago');

  /* ── barra superior ── */
  const head = $('[data-bar]');
  const onScroll = () => head.classList.toggle('is-solid', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  const navLinks = $$('.bar__nav a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['productos', 'proceso', 'negocios', 'cobertura', 'app'].forEach(id => { const el = document.getElementById(id); el && io.observe(el); });
  }
  const year = $('[data-year]'); if (year) year.textContent = new Date().getFullYear();

  /* ── campo de tapas + movimiento ── */
  const field = window.WaterField ? new window.WaterField($('[data-water]')) : null;
  field && field.start();
  // la botella "toca" el agua: una onda nace en su base
  function rippleAtBottle() {
    const img = $('.hero__bottle img');
    if (!field || !img) return;
    const r = img.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    field.rippleAtClient(r.left + r.width / 2, r.bottom - r.height * 0.02);
  }

  function motion() {
    const gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || reduce) {
      $$('.pipe__nodes circle').forEach(c => c.classList.add('is-on'));
      $$('.step').forEach(s => s.classList.add('is-on'));
      return;
    }
    gsap.registerPlugin(ST);
    document.documentElement.classList.add('js-motion');

    // Lenis: desplazamiento suave en escritorio
    if (window.Lenis) {
      const lenis = new window.Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 4) });
      window.__lenis = lenis;
      lenis.on('scroll', (e) => { ST.update(); field && field.nudge(e.velocity * 40); });
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(a => a.addEventListener('click', (e) => {
        const id = a.getAttribute('href'); if (id.length < 2) return;
        const el = document.querySelector(id); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -72 });
        if (!drawer.hidden) closeDrawer();
      }));
    } else {
      let lastY = window.scrollY;
      window.addEventListener('scroll', () => { const y = window.scrollY; field && field.nudge((y - lastY) * 40); lastY = y; }, { passive: true });
    }

    // el momento de carga: el titular sube desde la línea y cae una gota
    const heroBits = ['.hero__title .line > span', '.hero__lede', '.quick', '.hero__bottle'];
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => gsap.set(heroBits, { clearProps: 'transform,opacity' }) });
    tl.fromTo('.hero__title .line > span', { yPercent: 105 }, { yPercent: 0, duration: 1.3, stagger: 0.09 })
      .fromTo('.hero__lede', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.3)
      .fromTo('.quick', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 0.45)
      .fromTo('.hero__bottle', { y: -90, opacity: 0 }, { y: 0, opacity: 1, duration: 1.25, ease: 'back.out(1.25)' }, 0.2)
      .add(rippleAtBottle, 0.95);
    // si la pestaña no pinta o algo interrumpe la entrada, el contenido nunca se queda oculto
    setTimeout(() => { tl.kill(); gsap.set(heroBits, { clearProps: 'transform,opacity' }); }, 2400);

    // la gota recorre el proceso, de gris acero a azul limpio
    const steps = $$('.step');
    const nodes = $$('[data-pipe-nodes] circle');
    const drop = $('[data-pipe-drop]');
    const flow = $('[data-pipe-flow]');
    const nodeY = $$('[data-pipe-nodes] circle').map(c => Number(c.getAttribute('cy')));
    gsap.set(flow, { scaleY: 0 });
    ST.create({
      trigger: '.process__copy .steps',
      start: 'top 65%',
      end: 'bottom 55%',
      scrub: 0.6,
      onUpdate(self) {
        const p = self.progress;
        const y = 20 + p * 580;
        gsap.set(drop, { y });
        gsap.set(flow, { scaleY: p });
        const tint = gsap.utils.interpolate('#9FB3B8', '#1F5FBF', p);
        drop.querySelector('path').style.fill = tint;
        const active = nodeY.filter(n => y + 6 >= n).length;
        nodes.forEach((n, i) => n.classList.toggle('is-on', i < active));
        steps.forEach((s, i) => s.classList.toggle('is-on', i < Math.max(1, active)));
      }
    });
    // en móvil el tubo está oculto: cada paso se enciende al llegar
    if (window.matchMedia('(max-width: 820px)').matches) {
      steps.forEach(s => ST.create({ trigger: s, start: 'top 75%', onEnter: () => s.classList.add('is-on') }));
    }

    // la botella del hero se hunde en la línea al bajar
    gsap.to('[data-bottle-par]', { yPercent: 8, rotation: 4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // la botella sigue al puntero con una inclinación suave, como si flotara
    const tilt = $('[data-bottle-tilt]');
    if (tilt && window.matchMedia('(pointer: fine)').matches) {
      gsap.set(tilt, { transformPerspective: 900 });
      const ry = gsap.quickTo(tilt, 'rotationY', { duration: 1.1, ease: 'power3.out' });
      const rx = gsap.quickTo(tilt, 'rotationX', { duration: 1.1, ease: 'power3.out' });
      const tx = gsap.quickTo(tilt, 'x', { duration: 1.4, ease: 'power3.out' });
      $('.hero').addEventListener('pointermove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        ry(nx * 16); rx(-ny * 8); tx(nx * 18);
      }, { passive: true });
      $('.hero').addEventListener('pointerleave', () => { ry(0); rx(0); tx(0); }, { passive: true });
    }
    // cada vez que la botella baja en su flotación, roza el agua
    setTimeout(() => { rippleAtBottle(); setInterval(() => { if (!document.hidden) rippleAtBottle(); }, 6000); }, 1000);
  }
  motion();
  window.addEventListener('load', () => { window.ScrollTrigger && window.ScrollTrigger.refresh(); });
})();
