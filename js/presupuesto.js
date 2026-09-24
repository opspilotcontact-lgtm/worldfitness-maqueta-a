/* World Fitness Club · el presupuesto. Una sola lista para la tienda, las fichas y «Monta tu sala»,
   guardada en este navegador. No hay pago en línea: la lista se manda a Miguel por WhatsApp.
   <html data-raiz="../../"> dice dónde está la raíz de la web desde cada página. */
(() => {
  const CLAVE = 'wf-presupuesto';
  const raiz = document.documentElement.dataset.raiz || '';
  const WA = 'https://wa.me/34618050806?text=';
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const miles = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // n: {slug: cantidad}. «ejemplo» = la sala de muestra de la landing, que se ve pero no está pedida.
  let estado = { largo: 15, ancho: 10, n: {}, ejemplo: true, salaTocada: false };
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if (g && g.n) estado = { ...estado, ...g };
  } catch (e) { /* sin almacenamiento: la lista vive mientras dure la página */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) {} };

  let catalogo = null, pidiendo = null;
  const cargaCatalogo = () => pidiendo || (pidiendo = fetch(raiz + 'datos/catalogo.json')
    .then((r) => r.json())
    .then((d) => (catalogo = Object.fromEntries(d.map((p) => [p.slug, p])))));

  const oyentes = new Set();
  const cuantas = () => Object.values(estado.n).reduce((s, q) => s + q, 0);
  function emite(origen) {
    guarda();
    pintaContador(origen);
    oyentes.forEach((fn) => fn(estado, origen));
    if (cajon && cajon.open) pintaCajon();
  }

  const WF = {
    estado: () => estado,
    oye: (fn) => oyentes.add(fn),
    catalogo: cargaCatalogo,
    cambia(slug, d, origen) {
      estado.ejemplo = false;
      const q = Math.max(0, Math.min(9, (estado.n[slug] || 0) + d));
      if (q) estado.n[slug] = q; else delete estado.n[slug];
      emite(origen);
      return q;
    },
    pon(cambios, origen) { Object.assign(estado, cambios); emite(origen); },
    abre: () => abre(),
    mensaje,
  };
  window.WF = WF;

  /* ---------- contador de la cabecera ---------- */
  function pintaContador(origen) {
    const n = cuantas();
    document.querySelectorAll('.presu-n').forEach((b) => {
      b.textContent = n;
      b.classList.toggle('vacio', !n);
      if (origen && origen !== 'inicio' && !quieto && b.animate) {
        b.animate([{ transform: 'scale(1.5) rotate(-20deg)' }, { transform: 'scale(1) rotate(0)' }], { duration: 450, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    });
    document.querySelectorAll('[data-abrir-presupuesto]').forEach((b) => b.setAttribute('aria-label', `Presupuesto: ${n} ${n === 1 ? 'máquina' : 'máquinas'}`));
  }

  /* ---------- el mensaje para Miguel ---------- */
  function mensaje() {
    const lineas = [];
    let total = 0, consultar = 0;
    for (const [slug, q] of Object.entries(estado.n)) {
      const p = catalogo && catalogo[slug];
      const nombre = p ? p.n : slug.replace(/-/g, ' ');
      if (p && Number.isFinite(p.p)) { total += q * p.p; lineas.push(`- ${q} × ${nombre} (${miles(p.p)} €)`); }
      else { consultar++; lineas.push(`- ${q} × ${nombre} (precio a consultar)`); }
    }
    if (!lineas.length) return 'Hola Miguel, vengo de la web. ¿Me ayudas a elegir máquinas para mi sala?';
    const sala = estado.salaTocada ? `\nPara una sala de ${estado.largo} × ${estado.ancho} m (${estado.largo * estado.ancho} m²).` : '';
    return `Hola Miguel, quiero presupuesto de:\n${lineas.join('\n')}\nTotal orientativo: ${miles(total)} € IVA incluido${consultar ? ` (+ ${consultar} a consultar)` : ''}.${sala}\n¿Me lo preparas con transporte y montaje?`;
  }

  /* ---------- el cajón ---------- */
  let cajon = null;
  function creaCajon() {
    cajon = document.createElement('dialog');
    cajon.className = 'cajon';
    cajon.setAttribute('aria-labelledby', 't-cajon');
    cajon.innerHTML = `
      <div class="cajon-cab"><h2 id="t-cajon">Mi presupuesto</h2><button class="cajon-cerrar" type="button" aria-label="Cerrar">✕</button></div>
      <ul class="cajon-lista"></ul>
      <div class="cajon-pie">
        <div class="total"><span>Total orientativo · IVA incluido</span><b class="cajon-total">0 €</b></div>
        <a class="btn btn-rojo cajon-wa" href="${WA}" rel="noopener"><svg class="ico" aria-hidden="true" viewBox="0 0 24 24"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/></svg>Mandar a Miguel por WhatsApp</a>
        <div class="fila-b"><a class="chico" href="${raiz}#monta">Verla en mi sala</a><a class="chico" href="${raiz}tienda/">Seguir en la tienda</a><button class="chico cajon-vaciar" type="button">Vaciar</button></div>
        <p class="nota">Miguel te contesta con el presupuesto final, con transporte y montaje.</p>
      </div>`;
    document.body.append(cajon);
    cajon.querySelector('.cajon-cerrar').addEventListener('click', () => cajon.close());
    cajon.addEventListener('click', (e) => { if (e.target === cajon) cajon.close(); });
    cajon.querySelector('.cajon-vaciar').addEventListener('click', () => WF.pon({ n: {}, ejemplo: false }, 'cajon'));
    cajon.querySelector('.cajon-lista').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-d]');
      if (b) WF.cambia(b.closest('li').dataset.slug, +b.dataset.d, 'cajon');
    });
  }
  function pintaCajon() {
    const lista = cajon.querySelector('.cajon-lista');
    const filas = Object.entries(estado.n);
    let total = 0;
    if (!filas.length) {
      lista.innerHTML = '<li class="cajon-vacio">Todavía no has añadido nada. Toca «+» en cualquier máquina de la tienda.</li>';
    } else {
      lista.innerHTML = filas.map(([slug, q]) => {
        const p = catalogo[slug] || { n: slug, p: NaN };
        if (Number.isFinite(p.p)) total += q * p.p;
        const precio = Number.isFinite(p.p) ? `${miles(p.p)} € · ` : 'a consultar · ';
        const dat = p.a ? `${(p.a / 1000).toFixed(2).replace('.', ',')} × ${(p.b / 1000).toFixed(2).replace('.', ',')} m` : 'sin medidas en su ficha';
        return `<li data-slug="${esc(slug)}"><span class="th"><img src="${raiz}img/p/${esc(slug)}.webp" alt="" width="48" height="48" loading="lazy"></span>
          <span class="nom"><a href="${raiz}producto/${esc(slug)}/">${esc(p.n)}</a><small>${precio}${dat}</small></span>
          <span class="paso"><button type="button" data-d="-1" aria-label="Quitar una">−</button><output>${q}</output><button type="button" class="mas" data-d="1" aria-label="Añadir otra">+</button></span></li>`;
      }).join('');
    }
    cajon.querySelector('.cajon-total').textContent = `${miles(total)} €`;
    cajon.querySelector('.cajon-wa').href = WA + encodeURIComponent(mensaje());
  }
  async function abre() {
    if (!cajon) creaCajon();
    await cargaCatalogo().catch(() => {});
    pintaCajon();
    if (typeof cajon.showModal === 'function') cajon.showModal(); else cajon.setAttribute('open', '');
  }

  /* ---------- aviso al añadir ---------- */
  let aviso = null, reloj = null;
  function avisa(texto) {
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.className = 'aviso-flot';
      aviso.setAttribute('role', 'status');
      aviso.innerHTML = '<span></span><button type="button">Ver presupuesto</button>';
      aviso.querySelector('button').addEventListener('click', () => { aviso.hidden = true; abre(); });
      document.body.append(aviso);
    }
    aviso.querySelector('span').textContent = texto;
    aviso.hidden = false;
    clearTimeout(reloj);
    reloj = setTimeout(() => { aviso.hidden = true; }, 3800);
  }

  /* ---------- botones de la página ---------- */
  document.addEventListener('click', (e) => {
    const abrir = e.target.closest('[data-abrir-presupuesto]');
    if (abrir) { e.preventDefault(); abre(); return; }
    const b = e.target.closest('[data-anadir]');
    if (!b) return;
    e.preventDefault();
    const q = WF.cambia(b.dataset.anadir, 1, 'tienda');
    b.classList.add('hecho');
    if (b.dataset.ir) { location.href = b.dataset.ir; return; }
    avisa(`Añadida${q > 1 ? ` (${q})` : ''}: ${b.dataset.nombre || 'la máquina'}`);
  });
  pintaContador('inicio');
})();
