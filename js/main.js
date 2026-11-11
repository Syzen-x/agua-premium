(function () {
  'use strict';

  const WA_NUMBER = '593988212277';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]motion/.test(location.search);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ══════════════════════════════════════════════════════════════
     DATOS DEL NEGOCIO — se completan aquí, en un solo lugar.
     Lo que quede vacío ('' o null) NO se muestra en la página.
     PENDIENTE: todos estos datos los entrega el dueño.
     ══════════════════════════════════════════════════════════════ */
  const NEGOCIO = {
    // Precio por unidad en dólares, como número con punto decimal. null = sin precio visible.
    precios: {
      'agua-625': null,
      'agua-1l': null,
      'agua-galon': null,
      'agua-20l': null,
      'hielo-2kg': null
    },
    horario: '',            // horario de atención y de reparto, en una frase
    pedidoMinimo: '',       // pedido mínimo, en una frase
    envio: '',              // costo de envío por ciudad, en una frase
    registroSanitario: '',  // número de registro sanitario ARCSA / norma INEN
    direccion: '',          // dirección exacta de la planta
    mapsUrl: '',            // enlace de Google Maps de la planta
    correo: '',
    redes: { facebook: '', instagram: '', tiktok: '' },   // enlaces completos (https://…)
    appUrl: '',             // enlace público de la app de pedidos
    ecoflex: ''             // qué es la botella ECOFLEX, en una frase (sale en la ficha de 625 ml)
  };

  /* Analítica: GoatCounter (ligero, sin cookies). PENDIENTE: crear la cuenta en goatcounter.com
     y escribir aquí el código del sitio (la parte de "CODIGO.goatcounter.com"). Vacío = no se carga nada. */
  const ANALITICA = { goatcounter: '' };

  /* ══════════════════════════════════════════════════════════════
     CRONOGRAMA SEMANAL DE RUTAS — único lugar donde se edita.
     De aquí leen: Cobertura, el pedido (hero y panel), Negocios y el pie.
     (El JSON-LD de index.html repite los días: actualízalo también.)
     ══════════════════════════════════════════════════════════════ */
  const ZONAS = {
    lago: { name: 'Lago Agrio', alias: 'Nueva Loja · planta', city: 'Lago Agrio (Nueva Loja)', roads: [] },
    shushufindi: { name: 'Shushufindi', alias: '', city: 'Shushufindi', roads: ['shushufindi'] },
    sacha: { name: 'Sacha', alias: 'Joya de los Sachas', city: 'Sacha', roads: ['sacha'] },
    coca: { name: 'Coca', alias: 'Francisco de Orellana', city: 'Coca', roads: ['sacha', 'coca'] },
    viaquito: { name: 'Vía Quito – El Amazonas', alias: '', city: 'Vía Quito – El Amazonas', roads: [] }
  };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const RUTAS = [
    /* domingo   */ [],
    /* lunes     */ ['coca'],
    /* martes    */ ['lago'],
    /* miércoles */ ['shushufindi'],
    /* jueves    */ ['sacha'],
    /* viernes   */ ['lago'],
    /* sábado    */ ['viaquito', 'lago']
  ];
  const SEMANA = [1, 2, 3, 4, 5, 6, 0];   // orden en que se lee la semana: de lunes a domingo
  const lista = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
  const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const diasDe = (key) => SEMANA.filter(d => RUTAS[d].includes(key));
  const diasTexto = (key) => lista(diasDe(key).map(d => DIAS[d]));
  function rutaTexto(key) {
    const d = diasDe(key);
    if (!d.length) return '';
    return d.length === 1 ? `ruta del ${DIAS[d[0]]}` : `rutas de ${lista(d.map(i => DIAS[i]))}`;
  }
  // próxima ruta a una zona, contada desde la fecha del visitante
  function proximoTexto(key, now) {
    const hoy = (now || new Date()).getDay();
    for (let o = 0; o < 7; o++) {
      const d = (hoy + o) % 7;
      if (!RUTAS[d].includes(key)) continue;
      if (o === 0) return `Próximo reparto: hoy, ${DIAS[d]}. Confirma por WhatsApp si tu pedido alcanza a salir.`;
      if (o === 1) return `Próximo reparto: mañana, ${DIAS[d]}.`;
      return `Próximo reparto: ${SEMANA.indexOf(d) > SEMANA.indexOf(hoy) ? 'este' : 'el próximo'} ${DIAS[d]}.`;
    }
    return 'Consulta el día de reparto por WhatsApp.';
  }
  function cityLine(key) {
    const z = ZONAS[key];
    if (!z) return '';
    const d = diasTexto(key);
    return d ? `Reparto a ${z.name}: ${d}.` : `${z.name}: consulta el día de reparto por WhatsApp.`;
  }

  /* ── catálogo (solo datos confirmados por la marca) ── */
  const IMG = 'assets/img/productos/';
  const PRODUCTS = [
    {
      id: 'agua-625', short: '625 ml', name: 'Agua Premium 625 ml', h: 215,
      desc: 'En botella ECOFLEX: más resistente, más ligera y 100% reciclable. Agua purificada y envasada sin gas.',
      facts: ['Botella ECOFLEX', '100% reciclable', 'Sin gas'],
      sizes: [80, 160], iw: 540, ih: 1980
    },
    {
      id: 'agua-1l', short: '1 litro', name: 'Agua Premium 1 litro', h: 285,
      desc: 'Agua purificada y envasada sin gas, para la mesa, el trabajo o la jornada completa.',
      facts: ['1 litro', 'Sin gas'],
      sizes: [120, 320], iw: 534, ih: 1772
    },
    {
      id: 'agua-galon', short: 'Galón', name: 'Agua Premium galón', h: 300,
      desc: 'Agua purificada en galón, para la cocina y el consumo diario de la casa.',
      facts: ['Galón', 'Para la casa'],
      sizes: [200, 400], iw: 704, ih: 1422
    },
    {
      id: 'agua-20l', short: 'Garrafón 20 L', name: 'Garrafón Agua Premium 20 L', h: 490,
      desc: 'Para el dispensador de la casa, la oficina o el negocio.',
      facts: ['20 litros', 'Para dispensador'],
      sizes: [280, 560], iw: 874, ih: 1522
    },
    {
      id: 'hielo-2kg', short: 'Hielo 2 kg', name: 'Ice Fresh Premium 2 kg', h: 330,
      desc: 'Hielo 100% purificado en cubitos cristalinos. Funda de 2 kg con agarradera.',
      facts: ['Hielo 100% purificado', 'Funda con agarradera', 'Cubitos cristalinos'],
      sizes: [220, 500], iw: 1010, ih: 1498
    }
  ];
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const HERO_ID = 'agua-625';
  const HERO_SIZES = [200, 300, 400];
  // variantes de una imagen: 1x y 2x del tamaño mostrado
  function variants(p, hero) {
    const base = IMG + p.id + (hero ? '-hero' : '');
    const sizes = hero ? HERO_SIZES : p.sizes;
    return {
      src: `${base}-${sizes[0]}.webp`,
      srcset: sizes.map(w => `${base}-${w}.webp ${w}w`).join(', '),
      big: `${base}-${sizes[sizes.length - 1]}.webp`
    };
  }

  /* ── precios ── */
  const money = (n) => '$' + n.toFixed(2);
  const priceOf = (id) => { const v = NEGOCIO.precios[id]; return typeof v === 'number' && v > 0 ? v : null; };
  // total solo si todos los productos del pedido tienen precio
  function totalOf(items) {
    if (!items.length) return null;
    let t = 0;
    for (const [id, q] of items) { const p = priceOf(id); if (p === null) return null; t += p * q; }
    return t;
  }

  /* ── analítica: cada salida a WhatsApp, con la sección de origen ── */
  if (ANALITICA.goatcounter) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = `https://${ANALITICA.goatcounter}.goatcounter.com/count`;
    document.head.appendChild(s);
  }
  function sectionOf(el) {
    if (!el) return 'pagina';
    if (el.closest('.drawer')) return 'pedido';
    if (el.closest('.orderbar')) return 'barra-pedido';
    if (el.closest('footer')) return 'pie';
    const s = el.closest('section[id]');
    return s ? s.id : 'pagina';
  }
  function track(section) {
    const gc = window.goatcounter;
    if (gc && gc.count) gc.count({ path: `whatsapp-${section}`, title: `WhatsApp desde ${section}`, event: true });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (a) track(sectionOf(a));
  });

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
  function orderText(cityKey, address, extra) {
    const lines = ['Hola Premium Distribuciones, quiero hacer un pedido:'];
    const items = (extra || Object.entries(order)).filter(([id]) => byId[id]);
    items.forEach(([id, q]) => {
      const p = priceOf(id);
      lines.push(`• ${q} × ${byId[id].name}${p !== null ? ` (${money(p * q)})` : ''}`);
    });
    const total = totalOf(items);
    if (total !== null) lines.push(`Total: ${money(total)}`);
    if (cityKey && ZONAS[cityKey]) {
      const ruta = rutaTexto(cityKey);
      lines.push('', `Ciudad: ${ZONAS[cityKey].city}${ruta ? `, ${ruta}` : ''}`);
    }
    if (address) lines.push(`Dirección: ${address}`);
    return lines.join('\n');
  }
  function openWA(text, section) { track(section); window.open(waURL(text), '_blank', 'noopener'); }

  /* ── stepper reutilizable ── */
  function stepper(root, initial, onChange) {
    let v = initial;
    const out = $('[data-step-value]', root);
    const set = (n) => { v = Math.max(1, Math.min(999, n)); out.textContent = v; onChange && onChange(v); };
    $$('[data-step]', root).forEach(b => b.addEventListener('click', () => set(v + Number(b.dataset.step))));
    set(initial);
    return { get: () => v, set };
  }

  /* ── ciudad del pedido: la misma en el hero, en el panel y en Cobertura ── */
  const quickCity = $('[data-quick-city]');
  const drawerCity = $('[data-drawer-city]');
  const cityOptions = Object.entries(ZONAS).map(([k, z]) => `<option value="${k}">${z.city}</option>`).join('');
  quickCity.insertAdjacentHTML('beforeend', cityOptions);
  drawerCity.innerHTML = cityOptions;
  function renderCityRoutes() {
    $$('[data-city-route]').forEach(el => {
      const sel = $('select[name="ciudad"]', el.closest('form'));
      const text = cityLine(sel.value);
      el.textContent = text;
      el.hidden = !text;
    });
  }
  function setCity(key, keepQuick) {
    if (!ZONAS[key]) return;
    drawerCity.value = key;
    if (!keepQuick) quickCity.value = key;
    renderCityRoutes();
  }
  quickCity.addEventListener('change', () => { if (quickCity.value) setCity(quickCity.value); else renderCityRoutes(); });
  drawerCity.addEventListener('change', () => setCity(drawerCity.value));

  /* ── pedido rápido (hero) ── */
  const chipsRoot = $('[data-quick-chips]');
  chipsRoot.innerHTML = PRODUCTS.map(p => `
    <label class="chip"><input type="radio" name="quick-product" value="${p.id}" ${p.id === HERO_ID ? 'checked' : ''}><span>${p.short}</span></label>`).join('');
  const quickStep = stepper($('[data-quick] [data-stepper]'), 1);
  $('[data-quick]').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('input[name="quick-product"]:checked').value;
    openWA(orderText(quickCity.value, '', [[id, quickStep.get()]]), 'inicio');
  });

  /* ── la imagen del hero sigue al producto elegido ── */
  const heroFig = $('.hero__bottle');
  const heroImg = $('[data-hero-img]');
  const heroRef = $('[data-hero-reflect]');
  const heroSheen = $('.bottle__sheen');
  const heroTilt = $('[data-bottle-tilt]');
  const HERO_ALT = heroImg.alt;
  let heroShown = HERO_ID;
  function heroShow(id) {
    if (id === heroShown || !byId[id]) return;
    heroShown = id;
    const p = byId[id], isHero = id === HERO_ID, v = variants(p, isHero), ar = p.iw / p.ih;
    const sizes = isHero ? '(max-width: 820px) 84px, 200px' : `(max-width: 820px) 28vw, ${Math.round(600 * ar)}px`;
    const swap = () => {
      heroFig.style.setProperty('--ar', ar.toFixed(4));
      heroFig.classList.toggle('is-wide', ar > 0.45);
      [heroImg, heroRef].forEach(im => { im.width = p.iw; im.height = p.ih; im.sizes = sizes; im.srcset = v.srcset; im.src = v.src; });
      heroImg.alt = isHero ? HERO_ALT : p.name;
      const mask = `url("${isHero ? IMG + 'agua-625-160.webp' : v.big}")`;
      heroSheen.style.webkitMaskImage = mask;
      heroSheen.style.maskImage = mask;
    };
    const gsap = window.gsap;
    if (!gsap || reduce) { swap(); return; }
    gsap.to(heroTilt, {
      opacity: 0, duration: 0.16, ease: 'power1.in', overwrite: 'auto',
      onComplete() {
        swap();
        const show = () => {
          if (heroShown !== id) return;
          gsap.to(heroTilt, { opacity: 1, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
          rippleAtBottle();
        };
        (heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve()).then(show);
      }
    });
  }
  chipsRoot.addEventListener('change', (e) => { if (e.target.name === 'quick-product') heroShow(e.target.value); });

  /* ── la línea de productos ── */
  const lineup = $('[data-lineup]');
  lineup.innerHTML = PRODUCTS.map((p, i) => {
    const v = variants(p), r = p.h / 500 * p.iw / p.ih;   // ancho mostrado por cada px de escala
    return `
    <button class="item" type="button" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-id="${p.id}" style="--h:${p.h}" aria-label="${p.name}">
      <span class="item__label">${p.short}</span><img src="${v.src}" srcset="${v.srcset}" sizes="(max-width: 820px) ${Math.round(320 * r)}px, ${Math.round(470 * r)}px" alt="${p.name}" width="${p.iw}" height="${p.ih}" loading="lazy" decoding="async">
    </button>`;
  }).join('');
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
    const price = priceOf(id), priceEl = $('[data-spec-price]');
    priceEl.textContent = price !== null ? `${money(price)} por unidad` : '';
    priceEl.hidden = price === null;
    const note = id === 'agua-625' ? NEGOCIO.ecoflex.trim() : '', noteEl = $('[data-spec-note]');
    noteEl.textContent = note;
    noteEl.hidden = !note;
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
    const entries = Object.entries(order).filter(([id]) => byId[id]);
    const total = totalOf(entries);
    countEl.hidden = n === 0;
    countEl.textContent = n;
    if (bump && n) { countEl.classList.remove('is-bump'); void countEl.offsetWidth; countEl.classList.add('is-bump'); }
    bar.hidden = n === 0;
    const kinds = entries.length;
    $('[data-orderbar-text]').textContent = n
      ? `${n} ${n === 1 ? 'producto' : 'productos'} en tu pedido${total !== null ? `: ${money(total)}` : kinds > 1 ? ` (${kinds} tipos)` : ''}`
      : 'Tu pedido';
    $('[data-orderbar-send]').href = waURL(orderText('', ''));
    drawer.classList.toggle('is-empty', n === 0);
    $('[data-drawer-empty]').hidden = n !== 0;
    list.innerHTML = entries.map(([id, q]) => {
      const p = priceOf(id);
      return `
      <li data-line="${id}"><span>${byId[id].name}${p !== null ? `<small>${money(p)} c/u, ${money(p * q)}</small>` : ''}</span>
        <div class="stepper"><button type="button" data-d="-1" aria-label="Quitar uno de ${byId[id].name}"><svg aria-hidden="true"><use href="#i-minus"/></svg></button>
        <output aria-live="polite">${q}</output>
        <button type="button" data-d="1" aria-label="Agregar uno de ${byId[id].name}"><svg aria-hidden="true"><use href="#i-plus"/></svg></button></div>
      </li>`;
    }).join('');
    const totalEl = $('[data-drawer-total]');
    totalEl.hidden = total === null;
    $('[data-v]', totalEl).textContent = total !== null ? money(total) : '';
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
    openWA(orderText(fd.get('ciudad'), (fd.get('direccion') || '').trim()), 'pedido');
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
    openWA(text, 'negocios');
  });
  supply.querySelector('[name="negocio"]').addEventListener('input', (e) => {
    if (e.target.value.trim()) e.target.closest('.field').classList.remove('has-error');
  });
  $('[data-supply-products]').addEventListener('change', () => {
    if (supply.querySelectorAll('[name="productos"]:checked').length) $('[data-supply-products]').closest('.field').classList.remove('has-error');
  });
  // Negocios: las ciudades con ruta fija salen del cronograma
  const fixed = Object.keys(ZONAS).filter(k => diasDe(k).length).map(k => ZONAS[k].name);
  const fixedEl = $('[data-rutas-ciudades]');
  if (fixedEl && fixed.length) fixedEl.textContent = ` a ${lista(fixed)}`;

  /* ── mapa de cobertura ── */
  $('[data-towns]').innerHTML = Object.entries(ZONAS).map(([k, z]) => `
    <li><button type="button" data-town="${k}" aria-pressed="false">
      <span class="towns__name">${z.name}${z.alias ? `<small>${z.alias}</small>` : ''}</span>
      <span class="towns__days">${diasTexto(k) || 'día por confirmar'}</span>
    </button></li>`).join('');
  const cta = $('[data-town-cta]');
  function pickTown(key, initial) {
    const t = ZONAS[key];
    $$('[data-town]').forEach(b => b.setAttribute('aria-pressed', b.dataset.town === key));
    $$('[data-town-dot]').forEach(g => g.classList.toggle('is-on', g.dataset.townDot === key));
    $$('[data-road]').forEach(p => p.classList.toggle('is-on', t.roads.includes(p.dataset.road)));
    $('[data-town-cta-label]').textContent = `Pedir en ${t.name}`;
    $('[data-town-next]').textContent = proximoTexto(key);
    cta.href = waURL(`Hola Premium Distribuciones, quiero hacer un pedido en ${t.city}.`);
    setCity(key, initial);
  }
  $$('[data-town]').forEach(b => b.addEventListener('click', () => pickTown(b.dataset.town)));
  $$('[data-town-dot]').forEach(g => g.addEventListener('click', () => pickTown(g.dataset.townDot)));
  pickTown('lago', true);

  /* ── pie: la semana completa, compacta ── */
  $('[data-week]').innerHTML = SEMANA.map(d => `
    <li><b>${mayus(DIAS[d])}</b> ${RUTAS[d].length ? lista(RUTAS[d].map(k => ZONAS[k].name)) : 'sin ruta'}</li>`).join('');

  /* ── datos del negocio: se muestra solo lo que esté completo ── */
  (function biz() {
    const N = NEGOCIO;
    $$('[data-biz]').forEach(el => {
      const key = el.dataset.biz, v = String(N[key] || '').trim(), t = $('[data-v]', el);
      if (!v || !t) return;
      if (key === 'mapsUrl') t.href = v;
      else if (key === 'correo') { t.href = `mailto:${v}`; t.textContent = v; }
      else t.textContent = v;
      el.hidden = false;
    });
    $$('[data-biz-link]').forEach(a => {
      const v = String(N.redes[a.dataset.bizLink] || '').trim();
      if (v) { a.href = v; a.hidden = false; }
    });
    $$('[data-biz-group]').forEach(g => { g.hidden = !$$('[data-biz], [data-biz-link]', g).some(el => !el.hidden); });
    // con enlace público, la app es el botón principal y WhatsApp queda como alternativa
    const appUrl = N.appUrl.trim(), appOpen = $('[data-app-open]'), appWa = $('[data-app-wa]');
    if (appUrl && appOpen) {
      appOpen.href = appUrl;
      appOpen.hidden = false;
      appWa.classList.replace('btn--light', 'btn--ghost');
    }
  })();

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

  /* ── menú en móvil ── */
  const menuBtn = $('[data-menu-btn]');
  const menu = $('#menu');
  const menuIcon = $('[data-menu-icon]');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menuIcon.setAttribute('href', open ? '#i-close' : '#i-menu');
    menu.classList.toggle('is-open', open);
    head.classList.toggle('is-menu', open);
  }
  const menuOpen = () => menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.addEventListener('click', () => setMenu(!menuOpen()));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen()) { setMenu(false); menuBtn.focus(); } });
  document.addEventListener('click', (e) => { if (menuOpen() && !e.target.closest('#menu, [data-menu-btn]')) setMenu(false); });
  $$('[data-open-order]').forEach(b => b.addEventListener('click', () => setMenu(false)));

  /* ── agua del fondo + movimiento ── */
  const field = window.WaterField ? new window.WaterField($('[data-water]')) : null;
  field && field.start();
  // la botella "toca" el agua: una onda nace en su base
  function rippleAtBottle() {
    if (!field || !heroImg) return;
    const r = heroImg.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    field.rippleAtClient(r.left + r.width / 2, r.bottom - r.height * 0.02);
  }

  function loadScript(src) {
    return new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
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

    // el agua del fondo reacciona al desplazamiento
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => { const y = window.scrollY; field && field.nudge((y - lastY) * 40); lastY = y; }, { passive: true });

    // Lenis: desplazamiento suave solo con ratón o trackpad. En pantallas táctiles no se descarga.
    const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (!touch) {
      loadScript('https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js').then(() => {
        if (!window.Lenis) return;
        const lenis = new window.Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 4) });
        window.__lenis = lenis;
        lenis.on('scroll', () => ST.update());
        gsap.ticker.add((t) => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
        if (!drawer.hidden) lenis.stop();
        $$('a[href^="#"]').forEach(a => a.addEventListener('click', (e) => {
          const id = a.getAttribute('href'); if (id.length < 2) return;
          const el = document.querySelector(id); if (!el) return;
          e.preventDefault(); lenis.scrollTo(el, { offset: -72 });
          if (!drawer.hidden) closeDrawer();
        }));
      }).catch(() => { /* sin Lenis: desplazamiento nativo */ });
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
    if (heroTilt && window.matchMedia('(pointer: fine)').matches) {
      gsap.set(heroTilt, { transformPerspective: 900 });
      const ry = gsap.quickTo(heroTilt, 'rotationY', { duration: 1.1, ease: 'power3.out' });
      const rx = gsap.quickTo(heroTilt, 'rotationX', { duration: 1.1, ease: 'power3.out' });
      const tx = gsap.quickTo(heroTilt, 'x', { duration: 1.4, ease: 'power3.out' });
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
