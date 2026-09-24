/* World Fitness Club · catálogo: buscar, ordenar y que los platos entren rodando al llegar.
   Sin JS se ve todo el catálogo en su orden; esto solo añade. */
(() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rejilla = document.querySelector('.rejilla-p[data-catalogo]');
  if (rejilla) {
    const items = [...rejilla.children];
    const buscar = document.getElementById('buscar');
    const ordenar = document.getElementById('ordenar');
    const cuantas = document.getElementById('cuantas');
    const vacio = document.getElementById('sin-resultados');
    const normal = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const total = items.length;
    function aplica() {
      const q = normal(buscar.value.trim());
      const palabras = q.split(/\s+/).filter(Boolean);
      let vistos = 0;
      items.forEach((li) => {
        const ok = palabras.every((p) => li.dataset.buscar.includes(p));
        li.hidden = !ok;
        if (ok) vistos++;
      });
      const modo = ordenar.value;
      const orden = [...items].sort((a, b) => {
        if (modo === 'barato') return (+a.dataset.precio || 1e9) - (+b.dataset.precio || 1e9);
        if (modo === 'caro') return (+b.dataset.precio || 0) - (+a.dataset.precio || 0);
        if (modo === 'nombre') return a.dataset.nombre.localeCompare(b.dataset.nombre, 'es');
        return +a.dataset.orden - +b.dataset.orden;
      });
      rejilla.append(...orden);
      cuantas.textContent = vistos === total ? `${total} máquinas` : `${vistos} de ${total} máquinas`;
      vacio.classList.toggle('si', !vistos);
    }
    buscar.addEventListener('input', aplica);
    ordenar.addEventListener('change', aplica);
    // «?q=smith» en la dirección abre la búsqueda hecha
    const q = new URLSearchParams(location.search).get('q');
    if (q) buscar.value = q;
    aplica();
  }

  // Los platos entran rodando cuando llegan a la pantalla (solo transform y opacidad).
  // La clase «anima» la pone el <head> para que no parpadeen; si este fichero no llega, el <head> la quita.
  window.WFT = 1;
  if (!quieto && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('anima');
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.prod-plato, .zonas-nav .d').forEach((el) => io.observe(el));
  }
})();
