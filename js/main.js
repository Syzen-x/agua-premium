(function () {
  'use strict';

  const WA_NUMBER = '593988212277';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]motion/.test(location.search);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ══════════════════════════════════════════════════════════════
     DATOS DEL NEGOCIO — se completan aquí, en un solo lugar.
     Lo que quede vacío ('' o null) NO se muestra en la página.
     PENDIENTE: lo que sigue vacío lo entrega el dueño.
     ══════════════════════════════════════════════════════════════ */
  const NEGOCIO = {
    // Lista oficial de precios (precio final), en dólares, como número con punto decimal.
    // null = sin precio visible.
    precios: {
      'agua-625': 3.5,     // paca x 15
      'agua-1l': 3.5,      // paca x 9
      'agua-galon': 3.5,   // 3,8 litros
      'agua-20l': 1.5,     // bidón 20 litros, solo el líquido
      'envase-20l': 7.5,   // envase plástico del bidón (bidón completo = envase + líquido)
      'hielo-2kg': 0.75    // la funda; pedido mínimo de 10 fundas (ver "min" en el catálogo)
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

  /* Opiniones de clientes: SOLO reales y con permiso de quien la dio. Vacío = la sección no aparece.
     Formato de cada una: { texto: '…', nombre: '…', negocio: '…', ciudad: '…' }  (negocio y ciudad son opcionales) */
  const TESTIMONIOS = [
  ];
  // PENDIENTE: textos de MUESTRA para la maqueta (no son de clientes). Se reemplazan por opiniones reales.
  const MUESTRAS = [
    { texto: 'El camión pasa el día que dicen. Ya no me quedo sin agua para vender el fin de semana.', nombre: 'Tienda de barrio', ciudad: 'Lago Agrio' },
    { texto: 'El hielo llega limpio y en cubos enteros. En los jugos y los cócteles se nota, y la funda con agarradera ayuda en la cocina.', nombre: 'Restaurante', ciudad: 'Shushufindi' },
    { texto: 'Pido los garrafones por WhatsApp en un minuto y ya sé qué día me llegan.', nombre: 'Oficina', ciudad: 'Sacha' }
  ];

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
    loreto: { name: 'Loreto', alias: '', city: 'Loreto', roads: ['sacha', 'coca', 'loreto'] },
    viaquito: { name: 'Vía Quito – El Amazonas', alias: '', city: 'Vía Quito – El Amazonas', roads: [] }
  };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const RUTAS = [
    /* domingo   */ [],
    /* lunes     */ ['coca', 'loreto'],
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
  const IMG_V = '?v=2';   // súbelo cuando se reemplace una imagen de producto con el mismo nombre
  const PRODUCTS = [
    {
      id: 'agua-625', short: '625 ml', name: 'Agua Premium 625 ml', h: 215,
      desc: 'En botella ECOFLEX: más resistente, más ligera y 100% reciclable. Agua purificada y envasada sin gas.',
      facts: ['Paca de 15 botellas', 'Botella ECOFLEX', '100% reciclable', 'Sin gas'],
      pack: 'paca x 15', unit: 'la paca de 15 botellas',
      sizes: [80, 160], iw: 540, ih: 1980
    },
    {
      id: 'agua-1l', short: '1 litro', name: 'Agua Premium 1 litro', h: 285,
      desc: 'Agua purificada y envasada sin gas, para la mesa, el trabajo o la jornada completa.',
      facts: ['Paca de 9 botellas', 'Sin gas'],
      pack: 'paca x 9', unit: 'la paca de 9 botellas',
      sizes: [120, 320], iw: 534, ih: 1772
    },
    {
      id: 'agua-galon', short: 'Galón', name: 'Agua Premium galón', h: 300,
      desc: 'Agua purificada en galón, para la cocina y el consumo diario de la casa.',
      facts: ['3,8 litros', 'Para la casa'],
      pack: '3,8 litros', unit: 'el galón de 3,8 litros',
      sizes: [200, 400], iw: 704, ih: 1422
    },
    {
      id: 'agua-20l', short: 'Garrafón 20 L', name: 'Garrafón Agua Premium 20 L', h: 490,
      desc: 'Para el dispensador de la casa, la oficina o el negocio.',
      facts: ['20 litros', 'Para dispensador'],
      pack: 'solo líquido', unit: 'el líquido, entregando tu envase',
      sizes: [280, 560], iw: 874, ih: 1522
    },
    {
      id: 'hielo-2kg', short: 'Hielo 2 kg', name: 'Ice Fresh Premium 2 kg', h: 330,
      desc: 'Hielo 100% purificado en cubitos cristalinos. Funda de 2 kg con agarradera.',
      facts: ['Mínimo 10 fundas', 'Hielo 100% purificado', 'Funda con agarradera', 'Cubitos cristalinos'],
      unit: 'la funda, mínimo 10 fundas', min: 10,
      sizes: [220, 500], iw: 1010, ih: 1498
    }
  ];
  // se pide aparte, no es una presentación: el envase del garrafón para quien no tiene uno
  const ENVASE = { id: 'envase-20l', short: 'Envase 20 L', name: 'Envase plástico para garrafón 20 L' };
  const byId = Object.fromEntries([...PRODUCTS, ENVASE].map(p => [p.id, p]));
  // nombre con la unidad de venta, para el pedido y el mensaje
  const label = (id) => byId[id].name + (byId[id].pack ? ` (${byId[id].pack})` : '');
  // cantidad mínima por pedido (1 si el producto no tiene mínimo)
  const minOf = (id) => (byId[id] && byId[id].min) || 1;
  const HERO_ID = 'agua-625';
  const HERO_SIZES = [200, 300, 400];
  // variantes de una imagen: 1x y 2x del tamaño mostrado
  function variants(p, hero) {
    const base = IMG + p.id + (hero ? '-hero' : '');
    const sizes = hero ? HERO_SIZES : p.sizes;
    const ver = hero ? '' : IMG_V;   // la del hero va igual que en el preload del HTML
    return {
      src: `${base}-${sizes[0]}.webp${ver}`,
      srcset: sizes.map(w => `${base}-${w}.webp${ver} ${w}w`).join(', '),
      big: `${base}-${sizes[sizes.length - 1]}.webp${ver}`
    };
  }

  /* ── precios ── */
  const money = (n) => '$' + n.toFixed(2).replace('.', ',');
  const priceOf = (id) => { const v = NEGOCIO.precios[id]; return typeof v === 'number' && v > 0 ? v : null; };
  // suma lo que tiene precio; si a algo le falta precio, se dice como subtotal
  function totals(items) {
    let sum = 0; const missing = [];
    items.forEach(([id, q]) => { const p = priceOf(id); if (p === null) missing.push(byId[id].short); else sum += p * q; });
    return { sum, any: sum > 0, label: missing.length ? `Subtotal sin ${lista(missing)}` : 'Total' };
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
  Object.keys(order).forEach(id => {
    if (!byId[id] || !(order[id] > 0)) delete order[id];
    else if (order[id] < minOf(id)) order[id] = minOf(id);
  });
  function save() { try { localStorage.setItem('ap-order', JSON.stringify(order)); } catch (e) { /* sin almacenamiento */ } }
  function count() { return Object.values(order).reduce((a, b) => a + b, 0); }
  function add(id, qty) {
    if (!byId[id] || qty <= 0) return;
    order[id] = Math.min(999, Math.max(minOf(id), (order[id] || 0) + qty));
    save(); renderOrder(true);
  }
  function setQty(id, qty) {
    if (qty < minOf(id)) delete order[id]; else order[id] = Math.min(999, qty);
    save(); renderOrder(false);
  }
  function waURL(text) { return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`; }
  function orderText(cityKey, address, extra) {
    const lines = ['Hola Premium Distribuciones, quiero hacer un pedido:'];
    const items = (extra || Object.entries(order)).filter(([id]) => byId[id]);
    items.forEach(([id, q]) => {
      const p = priceOf(id);
      lines.push(`• ${q} × ${label(id)}${p !== null ? `: ${money(p * q)}` : ''}`);
    });
    const t = totals(items);
    if (t.any) lines.push(`${t.label}: ${money(t.sum)}`);
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
    let v = initial, min = 1;
    const out = $('[data-step-value]', root);
    const set = (n) => { v = Math.max(min, Math.min(999, n)); out.textContent = v; onChange && onChange(v); };
    $$('[data-step]', root).forEach(b => b.addEventListener('click', () => set(v + Number(b.dataset.step))));
    set(initial);
    // al cambiar de producto: nuevo mínimo, y la cantidad vuelve a ese mínimo
    return { get: () => v, set, reset: (m) => { min = m; set(m); } };
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
  const quickPrice = $('[data-quick-price]');
  function showQuickPrice(id) {
    const p = priceOf(id);
    quickPrice.textContent = p !== null ? `${money(p)} ${byId[id].unit}` : '';
    quickPrice.hidden = p === null;
  }
  showQuickPrice(HERO_ID);
  chipsRoot.addEventListener('change', (e) => {
    if (e.target.name !== 'quick-product') return;
    heroShow(e.target.value);
    showQuickPrice(e.target.value);
    quickStep.reset(minOf(e.target.value));
  });

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
    priceEl.textContent = price !== null ? `${money(price)} ${p.unit}` : '';
    priceEl.hidden = price === null;
    const envase = priceOf(ENVASE.id);
    const withEnvase = id === 'agua-20l' && price !== null && envase !== null;
    const note = id === 'agua-625' ? NEGOCIO.ecoflex.trim()
      : withEnvase ? `¿No tienes envase? El envase cuesta ${money(envase)}; el garrafón completo, envase y líquido, ${money(price + envase)}.` : '';
    const noteEl = $('[data-spec-note]');
    noteEl.textContent = note;
    noteEl.hidden = !note;
    $('[data-spec-extra]').hidden = !withEnvase;
    $('[data-spec-facts]').innerHTML = p.facts.map(f => `<li>${f}</li>`).join('');
    $('[data-spec-add]').textContent = `Agregar ${p.short} al pedido`;
    specStep.reset(minOf(id));
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
  $('[data-spec-extra]').addEventListener('click', () => add(ENVASE.id, specStep.get()));
  // sección Ice Fresh: se elige cuántas fundas (desde el mínimo) y el botón dice cuántas agrega y cuánto suman
  const ICE = 'hielo-2kg', icePrice = priceOf(ICE), iceEl = $('[data-ice-price]'), iceBtn = $('[data-ice-add]');
  const iceStep = stepper($('[data-ice-stepper]'), minOf(ICE), (n) => {
    iceBtn.textContent = `Agregar ${n} fundas al pedido`;
    if (icePrice === null) return;
    iceEl.textContent = `${n} fundas: ${money(n * icePrice)}. Mínimo ${minOf(ICE)} fundas, a ${money(icePrice)} cada una.`;
    iceEl.hidden = false;
  });
  iceStep.reset(minOf(ICE));
  iceBtn.addEventListener('click', () => add(ICE, iceStep.get()));

  /* ── barra y panel del pedido ── */
  const countEl = $('[data-count]');
  const bar = $('[data-orderbar]');
  const drawer = $('[data-drawer]');
  const list = $('[data-drawer-items]');
  function renderOrder(bump) {
    const n = count();
    const entries = Object.entries(order).filter(([id]) => byId[id]);
    const t = totals(entries);
    countEl.hidden = n === 0;
    countEl.textContent = n;
    if (bump && n) { countEl.classList.remove('is-bump'); void countEl.offsetWidth; countEl.classList.add('is-bump'); }
    bar.hidden = n === 0;
    const kinds = entries.length;
    $('[data-orderbar-text]').textContent = n
      ? `${n} ${n === 1 ? 'producto' : 'productos'} en tu pedido${t.any && t.label === 'Total' ? `: ${money(t.sum)}` : kinds > 1 ? ` (${kinds} tipos)` : ''}`
      : 'Tu pedido';
    $('[data-orderbar-send]').href = waURL(orderText('', ''));
    drawer.classList.toggle('is-empty', n === 0);
    $('[data-drawer-empty]').hidden = n !== 0;
    list.innerHTML = entries.map(([id, q]) => {
      const p = priceOf(id);
      return `
      <li data-line="${id}"><span>${label(id)}${p !== null ? `<small>${q} × ${money(p)} = ${money(p * q)}${minOf(id) > 1 ? `, mínimo ${minOf(id)}` : ''}</small>` : ''}</span>
        <div class="stepper"><button type="button" data-d="-1" aria-label="Quitar uno de ${byId[id].name}"><svg aria-hidden="true"><use href="#i-minus"/></svg></button>
        <output aria-live="polite">${q}</output>
        <button type="button" data-d="1" aria-label="Agregar uno de ${byId[id].name}"><svg aria-hidden="true"><use href="#i-plus"/></svg></button></div>
      </li>`;
    }).join('');
    const totalEl = $('[data-drawer-total]');
    totalEl.hidden = !t.any;
    $('[data-l]', totalEl).textContent = t.label;
    $('[data-v]', totalEl).textContent = t.any ? money(t.sum) : '';
    // quien pide garrafón y no lleva envase puede sumarlo aquí
    const envaseBtn = $('[data-add-envase]'), envasePrice = priceOf(ENVASE.id);
    envaseBtn.hidden = !(order['agua-20l'] && !order[ENVASE.id] && envasePrice !== null);
    if (envasePrice !== null) envaseBtn.textContent = `¿No tienes envase? Agregar envase (${money(envasePrice)})`;
  }
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    const id = b.closest('[data-line]').dataset.line;
    setQty(id, (order[id] || 0) + Number(b.dataset.d));
  });
  $('[data-add-envase]').addEventListener('click', () => add(ENVASE.id, order['agua-20l'] || 1));
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
  // en el orden de la semana: primero la zona cuya ruta cae antes (lunes, martes…); sin día fijo, al final
  const primerDia = (k) => { const d = diasDe(k); return d.length ? SEMANA.indexOf(d[0]) : 99; };
  const zonasPorDia = Object.entries(ZONAS).sort((a, b) => primerDia(a[0]) - primerDia(b[0]));
  $('[data-towns]').innerHTML = zonasPorDia.map(([k, z]) => `
    <li><button type="button" data-town="${k}" aria-pressed="false">
      <span class="towns__name">${z.name}${z.alias ? `<small>${z.alias}</small>` : ''}</span>
      <span class="towns__days">${diasTexto(k) || 'día por confirmar'}</span>
    </button></li>`).join('');
  const cta = $('[data-town-cta]');
  let travel = null;   // lo define motion(): un punto recorre la ruta elegida
  function pickTown(key, initial) {
    const t = ZONAS[key];
    $$('[data-town]').forEach(b => b.setAttribute('aria-pressed', b.dataset.town === key));
    $$('[data-town-dot]').forEach(g => g.classList.toggle('is-on', g.dataset.townDot === key));
    $$('[data-road]').forEach(p => p.classList.toggle('is-on', t.roads.includes(p.dataset.road)));
    $('[data-town-cta-label]').textContent = `Pedir en ${t.name}`;
    $('[data-town-next]').textContent = proximoTexto(key);
    cta.href = waURL(`Hola Premium Distribuciones, quiero hacer un pedido en ${t.city}.`);
    setCity(key, initial);
    if (!initial && travel) travel(t.roads);
  }
  $$('[data-town]').forEach(b => b.addEventListener('click', () => pickTown(b.dataset.town)));
  $$('[data-town-dot]').forEach(g => g.addEventListener('click', () => pickTown(g.dataset.townDot)));
  pickTown('lago', true);

  /* ── opiniones de clientes ── */
  (function voices() {
    const sec = $('[data-voices]');
    let ok = TESTIMONIOS.filter(t => t && String(t.texto || '').trim() && String(t.nombre || '').trim());
    // maqueta: mientras TESTIMONIOS esté vacío se muestran estos textos de muestra, rotulados como tales.
    // Al cargar la primera opinión real, las muestras y el rótulo desaparecen solos.
    const demo = !ok.length;
    if (demo) ok = MUESTRAS;
    if (!sec || !ok.length) return;
    if (demo) $('[data-voices-demo]').hidden = false;
    const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    $('[data-voices-list]').innerHTML = ok.map(t => `
      <li><figure class="voice">
        <blockquote><p>${esc(t.texto.trim())}</p></blockquote>
        <figcaption><b>${esc(t.nombre.trim())}</b>${[t.negocio, t.ciudad].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('')}</figcaption>
      </figure></li>`).join('');
    sec.hidden = false;
  })();

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

  /* ── Proceso: el agua del marco se aclara etapa por etapa ──
     c = claridad (0 turbia, 1 cristalina), uv = luz ultravioleta, oz = burbujas de ozono */
  function stageWater(canvas, tint) {
    const ctx = canvas.getContext('2d');
    const st = { c: 0, uv: 0, oz: 0 };
    const rnd = (a, b) => a + Math.random() * (b - a);
    const dust = Array.from({ length: 150 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(0.6, 2.2), s: rnd(0.3, 1), ph: rnd(0, 6.28) }));
    const bubbles = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(1.5, 4.5), s: rnd(0.5, 1.3), ph: rnd(0, 6.28) }));
    let w = 0, h = 0, d = 1, raf = 0, on = false;
    function size() {
      const r = canvas.getBoundingClientRect();
      d = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.width = Math.max(2, Math.round(r.width * d));
      h = canvas.height = Math.max(2, Math.round(r.height * d));
    }
    function draw(now) {
      raf = on ? requestAnimationFrame(draw) : 0;
      const t = now / 1000, c = st.c;
      // el agua limpia corre por detrás (js/water-field.js); aquí va lo que la enturbia, sobre la botella
      ctx.clearRect(0, 0, w, h);
      if (tint) tint.style.opacity = (0.92 * (1 - c)).toFixed(3);
      // sedimento: se va quedando en los filtros
      const n = Math.round(dust.length * Math.pow(1 - c, 1.25));
      ctx.fillStyle = `rgba(74,56,24,${0.25 + 0.5 * (1 - c)})`;
      for (let i = 0; i < n; i++) {
        const p = dust[i];
        const x = (p.x + Math.sin(t * 0.35 * p.s + p.ph) * 0.025) * w;
        const y = ((p.y + t * 0.014 * p.s) % 1) * h;
        ctx.beginPath(); ctx.arc(x, y, p.r * d, 0, 6.283); ctx.fill();
      }
      // luz ultravioleta: una franja que barre el agua
      if (st.uv > 0.01) {
        const y = (0.5 + 0.42 * Math.sin(t * 1.1)) * h, bh = h * 0.42;
        const u = ctx.createLinearGradient(0, y - bh / 2, 0, y + bh / 2);
        u.addColorStop(0, 'rgba(126,92,255,0)'); u.addColorStop(0.5, `rgba(126,92,255,${0.6 * st.uv})`); u.addColorStop(1, 'rgba(126,92,255,0)');
        ctx.fillStyle = u; ctx.fillRect(0, y - bh / 2, w, bh);
      }
      // ozono: burbujas finas que suben
      if (st.oz > 0.01) {
        ctx.lineWidth = 1.3 * d;
        for (const b of bubbles) {
          const y = h * 1.05 - ((b.y + t * 0.11 * b.s) % 1) * h * 1.15;
          const x = (b.x + Math.sin(t * 1.3 * b.s + b.ph) * 0.018) * w;
          ctx.strokeStyle = `rgba(255,255,255,${0.75 * st.oz})`;
          ctx.fillStyle = `rgba(255,255,255,${0.16 * st.oz})`;
          ctx.beginPath(); ctx.arc(x, y, b.r * d, 0, 6.283); ctx.fill(); ctx.stroke();
        }
      }
    }
    return {
      state: st,
      size,
      run(v) { if (v === on) return; on = v; if (on) { size(); raf = requestAnimationFrame(draw); } else cancelAnimationFrame(raf); },
      // un solo cuadro quieto (para quien pidió menos movimiento)
      frame() { if (on) return; size(); draw(8000); }
    };
  }

  function loadScript(src) {
    return new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  /* ── Proceso: la gota baja por el tubo y la botella del marco se aclara etapa por etapa.
     Si el equipo pide menos movimiento (en Windows: "Efectos de animación" apagados), la historia
     se sigue contando, pero sin nada que flote ni se desplace: cada etapa cambia la botella de golpe. */
  function processStory(gsap, ST) {
    const steps = $$('.step');
    const nodes = $$('[data-pipe-nodes] circle');
    const drop = $('[data-pipe-drop]');
    const flow = $('[data-pipe-flow]');
    const nodeY = nodes.map(c => Number(c.getAttribute('cy')));

    const stage = $('[data-stage]');
    const stageCap = $('[data-stage-cap]');
    const murkEl = $('[data-stage-murk]');
    const water = murkEl && murkEl.getContext ? stageWater(murkEl, $('[data-stage-tint]')) : null;
    const caustics = water && window.WaterField ? new window.WaterField($('[data-stage-caustics]')) : null;
    const stageNames = steps.map(s => $('h3', s).textContent.trim());
    const CLARITY = [0.06, 0.26, 0.44, 0.68, 0.93, 1, 1, 1];  // cuánto se ha aclarado al llegar a cada etapa
    let stageNow = 0, stageSeen = false;
    function setStage(n) {
      if (!water || n === stageNow) return;
      stageNow = n;
      const last = n >= steps.length;
      stageCap.hidden = false;
      stageCap.textContent = last ? 'Agua purificada, lista' : `Etapa ${n} de ${steps.length - 1}: ${stageNames[n - 1]}`;
      const to = { c: CLARITY[n - 1], uv: n === 6 ? 1 : 0, oz: n === 7 ? 1 : 0 };
      if (reduce) { Object.assign(water.state, to); water.frame(); return; }
      gsap.to(water.state, { ...to, duration: 1.1, ease: 'power2.out', overwrite: true });
      // al terminar, una onda recorre el agua ya limpia
      if (last && caustics && caustics.ok) caustics.ripple(caustics.w / 2, caustics.h * 0.62);
    }
    if (water && 'IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        stageSeen = en.isIntersecting;
        if (reduce) { if (stageSeen) water.frame(); }
        else water.run(stageSeen);
        if (stageSeen && caustics) { caustics.resize(); caustics.start(); }
      }).observe(stage);
      window.addEventListener('resize', () => { water.size(); if (reduce) water.frame(); }, { passive: true });
      setStage(1);
      caustics && caustics.resize();
    }
    gsap.set(flow, { scaleY: 0 });
    ST.create({
      trigger: '.process__copy .steps',
      start: 'top 65%',
      end: 'bottom 80%',
      scrub: reduce ? true : 0.6,
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
        setStage(Math.max(1, active));
      }
    });
    // en móvil el tubo está oculto: cada paso se enciende al llegar
    if (window.matchMedia('(max-width: 820px)').matches) {
      steps.forEach(s => ST.create({ trigger: s, start: 'top 75%', onEnter: () => s.classList.add('is-on') }));
    }
  }

  function motion() {
    const gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST) {
      $$('.pipe__nodes circle').forEach(c => c.classList.add('is-on'));
      $$('.step').forEach(s => s.classList.add('is-on'));
      return;
    }
    gsap.registerPlugin(ST);
    document.documentElement.classList.add('js-motion');
    processStory(gsap, ST);
    if (reduce) return;

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

    // las presentaciones llegan a la repisa, una tras otra
    // (nada queda oculto a la espera: el estado inicial se aplica recién al entrar en pantalla)
    ST.create({
      trigger: '.lineup', start: 'top 82%', once: true,
      onEnter: () => gsap.from('.item img', { y: 46, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.09, clearProps: 'transform,opacity' })
    });

    // la foto del hielo y la de la planta se asientan mientras pasan
    $$('.ice__scene img, .trade__photo img').forEach(img => {
      gsap.fromTo(img, { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // mapa: los pueblos aparecen en orden de ruta y un punto recorre el camino elegido
    ST.create({
      trigger: '.map', start: 'top 75%', once: true,
      onEnter: () => {
        gsap.from('.map__towns circle:not(.halo)', { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2.2)', stagger: 0.1, clearProps: 'transform' });
        gsap.from('.map__towns text, .map__roads path', { opacity: 0, duration: 0.8, stagger: 0.06, clearProps: 'opacity' });
      }
    });
    const truck = $('[data-truck]');
    const trip = { t: 0 };
    travel = (roads) => {
      gsap.killTweensOf(trip);
      gsap.killTweensOf(truck);
      const paths = roads.map(r => $(`[data-road="${r}"]`)).filter(Boolean);
      if (!truck || !paths.length) { truck && gsap.set(truck, { opacity: 0 }); return; }
      const lens = paths.map(p => p.getTotalLength());
      const total = lens.reduce((a, b) => a + b, 0);
      trip.t = 0;
      gsap.set(truck, { opacity: 1 });
      gsap.to(trip, {
        t: 1, duration: 0.55 + total / 420, ease: 'power2.inOut',
        onUpdate() {
          let l = trip.t * total, i = 0;
          while (i < lens.length - 1 && l > lens[i]) { l -= lens[i]; i++; }
          const pt = paths[i].getPointAtLength(l);
          truck.setAttribute('cx', pt.x); truck.setAttribute('cy', pt.y);
        },
        onComplete() { gsap.to(truck, { opacity: 0, duration: 0.5, delay: 0.2 }); }
      });
    };

    // los dos teléfonos de la app se mueven a distinto ritmo
    gsap.to('.phone--front', { yPercent: -7, ease: 'none', scrollTrigger: { trigger: '.phones', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.phone--back', { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.phones', start: 'top bottom', end: 'bottom top', scrub: true } });

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
