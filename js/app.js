// ── Fecha dinámica ──
function getSemanaActual() {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diffLunes = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffLunes);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const opciones = { day: 'numeric', month: 'long' };
  const lunesStr = lunes.toLocaleDateString('es-ES', opciones);
  const domingoStr = domingo.toLocaleDateString('es-ES', opciones);
  const anio = domingo.getFullYear();
  return `${lunesStr} – ${domingoStr} ${anio}`;
}

// ── Estado global ──
let lang = 'both';
let moods = [];
let topics = [];
let lista = [];
let filtroTimer = null;

// ── Portada ──
function coverHTML(title, emoji, color, imgClass, phClass) {
  const src = COVERS[title];
  if (src) {
    return `<img src="${src}" class="${imgClass}" alt="Portada de ${title}"
      onerror="this.outerHTML='<div class=\'${phClass}\' style=\'background:${color};\'>${emoji}</div>'"
      loading="lazy">`;
  }
  return `<div class="${phClass}" style="background:${color};">${emoji}</div>`;
}

// ── Render catálogo ──
function renderBooks(books, containerId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;
  cont.innerHTML = books.map(b => `
    <div class="book-card" data-title="${b.title.toLowerCase()}" data-resena="${(b.resena||'').toLowerCase()}">
      <div class="book-header" onclick="toggleResena('r-${b.id}','ic-${b.id}')">
        ${coverHTML(b.title, b.emoji, b.color, 'book-cover', 'cover-placeholder')}
        <div class="book-meta">
          <div class="book-title">${b.title}</div>
          <div class="book-author">${b.author} · ${b.year}</div>
          <div class="badge-row">
            ${b.badges.map(x => `<span class="badge ${x.c}">${x.t}</span>`).join('')}
            <span class="chevron" id="ic-${b.id}">▾</span>
          </div>
        </div>
      </div>
      <div class="resena" id="r-${b.id}">${b.resena}</div>
      <div class="card-actions">
        <button class="aBtn" id="sv-${b.id}" onclick="guardar('${b.id}')">🔖 Guardar</button>
        <button class="aBtn" onclick="pedirResenaIA('${b.title.replace(/'/g,"\\'")}','${b.author.replace(/'/g,"\\'")}')">✨ Reseña IA</button>
      </div>
    </div>`).join('');
}

// ── Buscar libros por mood y topics en Google Books ──
function filtrarLibros() {
  clearTimeout(filtroTimer);
  filtroTimer = setTimeout(async () => {
    if (moods.length === 0 && topics.length === 0) {
      fetch('http://localhost:3000/api/novedades')
        .then(r => r.json())
        .then(data => {
          window.currentBooks = [...(data.es || []), ...(data.en || [])];
          renderBooks(data.es || [], 'books-es');
          renderBooks(data.en || [], 'books-en');
        });
      return;
    }

    document.getElementById('books-es').innerHTML = '<div class="loading-msg">🔍 Buscando libros para ti...</div>';
    document.getElementById('books-en').innerHTML = '';

    const mood = moods[0] || '';
    const topicsStr = topics.join(',');
    const url = `http://localhost:3000/api/buscar-libros?mood=${encodeURIComponent(mood)}&topics=${encodeURIComponent(topicsStr)}&lang=${lang}`;

    try {
      const r = await fetch(url);
      const data = await r.json();
      window.currentBooks = [...(data.es || []), ...(data.en || [])];

      if (lang !== 'en') renderBooks(data.es || [], 'books-es');
      else document.getElementById('books-es').innerHTML = '';

      if (lang !== 'es') renderBooks(data.en || [], 'books-en');
      else document.getElementById('books-en').innerHTML = '';

      if (!data.es?.length && !data.en?.length) {
        document.getElementById('books-es').innerHTML = '<div class="loading-msg">No se encontraron libros. Intenta otra combinación.</div>';
      }
    } catch (e) {
      document.getElementById('books-es').innerHTML = '<div class="loading-msg">Error al buscar libros.</div>';
    }
  }, 600);
}

// ── Toggle reseña ──
function toggleResena(rid, iid) {
  const r = document.getElementById(rid);
  const ic = document.getElementById(iid);
  if (!r) return;
  const open = r.style.display !== 'block';
  r.style.display = open ? 'block' : 'none';
  if (ic) ic.style.transform = open ? 'rotate(180deg)' : '';
}

// ── Idioma ──
function setLang(l) {
  lang = l;
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.className = 'lang-btn';
    if (b.dataset.lang === l) b.classList.add('act-' + l);
  });
  document.getElementById('sec-es').style.display = (l === 'en') ? 'none' : 'block';
  document.getElementById('sec-en').style.display = (l === 'es') ? 'none' : 'block';
}

// ── Tabs ──
function showTab(t) {
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${t}"]`).classList.add('active');
  document.getElementById('tab-' + t).classList.add('active');
  if (t === 'lista') renderLista();
}

// ── Guardar libro (catálogo) ──
function guardar(id) {
  if (lista.find(l => l.id === id)) return;
  const allBooks = window.currentBooks || [];
  const book = allBooks.find(b => b.id === id);
  if (!book) return;
  lista.push({ ...book, status: 'quiero' });
  const btn = document.getElementById('sv-' + id);
  if (btn) { btn.classList.add('saved'); btn.textContent = '✓ Guardado'; }
  updateCount();
}

// ── Guardar libro (búsqueda externa) ──
function guardarExterno(book) {
  if (lista.find(l => l.id === book.id)) {
    alert('Ya está en tu lista.');
    return;
  }
  lista.push({ ...book, status: 'quiero' });
  updateCount();
  alert(`✅ "${book.title}" guardado en tu lista.`);
}

// ── Contador de lista ──
function updateCount() {
  const el = document.getElementById('lista-count');
  el.textContent = lista.length;
  el.style.display = lista.length > 0 ? 'inline' : 'none';
}

// ── Cambiar estado en lista ──
function setStatus(id, s) {
  const item = lista.find(l => l.id === id);
  if (item) item.status = s;
  renderLista();
}

// ── Eliminar de lista ──
function eliminar(id) {
  lista = lista.filter(l => l.id !== id);
  updateCount();
  renderLista();
}

// ── Render Mi Lista ──
function renderLista() {
  const cont = document.getElementById('lista-container');
  document.getElementById('st-total').textContent = lista.length;
  document.getElementById('st-leyendo').textContent = lista.filter(l => l.status === 'leyendo').length;
  document.getElementById('st-leido').textContent = lista.filter(l => l.status === 'leido').length;
  document.getElementById('lista-empty').style.display = lista.length ? 'none' : 'block';
  document.getElementById('lista-ai-btn').style.display = lista.length ? 'block' : 'none';

  cont.querySelectorAll('.lista-item').forEach(e => e.remove());

  lista.forEach(item => {
    const div = document.createElement('div');
    div.className = 'lista-item';
    const coverSrc = item.coverSrc || COVERS[item.title];
    const coverEl = coverSrc
      ? `<img src="${coverSrc}" class="li-cover" alt="Portada"
           onerror="this.outerHTML='<div class=li-cover-ph style=background:${item.color};>${item.emoji}</div>'"
           loading="lazy">`
      : `<div class="li-cover-ph" style="background:${item.color};">${item.emoji}</div>`;

    div.innerHTML = `
      ${coverEl}
      <div class="li-info">
        <div class="li-title">${item.title}</div>
        <div class="li-author">${item.author}</div>
        <div class="li-status">
          <button class="stBtn ${item.status === 'quiero' ? 'sq' : ''}" onclick="setStatus('${item.id}','quiero')">Quiero leer</button>
          <button class="stBtn ${item.status === 'leyendo' ? 'sl' : ''}" onclick="setStatus('${item.id}','leyendo')">Leyendo</button>
          <button class="stBtn ${item.status === 'leido' ? 'sd' : ''}" onclick="setStatus('${item.id}','leido')">Leído ✓</button>
        </div>
      </div>
      <button class="rm-btn" onclick="eliminar('${item.id}')" title="Eliminar">✕</button>`;
    cont.appendChild(div);
  });
}

// ── Buscar en Open Library ──
async function buscar() {
  const q = document.getElementById('search-input').value.trim();
  if (!q) return;
  const res = document.getElementById('search-results');
  res.innerHTML = '<div class="loading-msg">🔍 Buscando...</div>';
  try {
    const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10`);
    const data = await r.json();
    const docs = (data.docs || []).filter(d => !isAcademic(d)).slice(0, 6);
    if (!docs.length) {
      res.innerHTML = `<div class="loading-msg">Sin resultados para "${q}". Intenta con otro término.</div>`;
      return;
    }
    res.innerHTML = `<div class="sr-title">Resultados para "${q}"</div>` +
      docs.map(d => {
        const title = d.title || 'Sin título';
        const author = (d.author_name || ['Autor desconocido'])[0];
        const year = d.first_publish_year || '';
        const coverId = d.cover_i;
        const coverSrc = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
        const bid = 'sr-' + Math.random().toString(36).slice(2, 7);
        const bookObj = { id: bid, title, author, year: String(year), emoji: '📖', color: '#F1EFE8', badges: [], resena: '', coverSrc };
        const coverEl = coverSrc
          ? `<img src="${coverSrc}" class="book-cover" alt="Portada de ${title}"
               onerror="this.outerHTML='<div class=cover-placeholder style=background:#F1EFE8;>📖</div>'"
               loading="lazy">`
          : '<div class="cover-placeholder" style="background:#F1EFE8;">📖</div>';
        return `
          <div class="book-card">
            <div class="book-header">
              ${coverEl}
              <div class="book-meta">
                <div class="book-title">${title}</div>
                <div class="book-author">${author}${year ? ' · ' + year : ''}</div>
              </div>
            </div>
            <div class="card-actions">
              <button class="aBtn" onclick='guardarExterno(${JSON.stringify(bookObj)})'>🔖 Guardar en mi lista</button>
              <button class="aBtn" onclick="pedirResenaIA('${title.replace(/'/g, "\\'")}','${author.replace(/'/g, "\\'")}')">✨ Reseña IA</button>
            </div>
          </div>`;
      }).join('');
  } catch (e) {
    res.innerHTML = '<div class="loading-msg">Error al conectar con Open Library. Verifica tu conexión.</div>';
  }
}

// ── Filtro libros de texto ──
function isAcademic(d) {
  const subjects = (d.subject || []).join(' ').toLowerCase();
  const title = (d.title || '').toLowerCase();
  const bad = ['textbook', 'university', 'course', 'academic', 'manual', 'workbook',
    'chemistry', 'physics', 'calculus', 'algebra', 'anatomy', 'biology textbook'];
  return bad.some(w => subjects.includes(w) || title.includes(w));
}

// ── Modal IA ──
function closeModal() {
  document.getElementById('modal-ia').style.display = 'none';
}

// ── Reseña IA ──
async function pedirResenaIA(title, author) {
  document.getElementById('modal-body').innerHTML = '<div class="loading-spinner">✨ Consultando a la IA...</div>';
  document.getElementById('modal-ia').style.display = 'flex';
  try {
    const resp = await fetch('http://localhost:3000/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Dame una reseña breve pero atractiva del libro "${title}" de ${author}.
Incluye: de qué trata (2-3 oraciones), para quién es ideal, y una frase que lo defina.
Responde en español. Tono cálido y literario.`
        }]
      })
    });
    const data = await resp.json();
    const text = data.content?.map(i => i.text || '').join('') || 'No se pudo obtener la reseña.';
    document.getElementById('modal-body').textContent = text;
  } catch (e) {
    document.getElementById('modal-body').textContent = 'Error al conectar con la IA.';
  }
}

// ── Recomendación IA general ──
async function pedirIA() {
  const m = moods.length ? moods.join(', ') : 'no especificado';
  const t = topics.length ? topics.join(', ') : 'no especificado';
  const l = lang === 'es' ? 'solo en español' : lang === 'en' ? 'solo en inglés' : 'en español e inglés';

  document.getElementById('modal-body').innerHTML = '<div class="loading-spinner">✨ Buscando los mejores libros para ti...</div>';
  document.getElementById('modal-ia').style.display = 'flex';

  try {
    const resp = await fetch('http://localhost:3000/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Recomiéndame 5 libros reales para leer esta semana.
Solo literatura narrativa y divulgación accesible — excluye libros de texto académicos.
Idioma preferido: ${l}.
Mi estado de ánimo: ${m}.
Géneros que me interesan: ${t}.
Para cada libro: título, autor, año y reseña de 2-3 oraciones. Tono cálido.`
        }]
      })
    });
    const data = await resp.json();
    const text = data.content?.map(i => i.text || '').join('') || 'No se pudo obtener la recomendación.';
    document.getElementById('modal-body').textContent = text;
  } catch (e) {
    document.getElementById('modal-body').textContent = 'Error al conectar con la IA.';
  }
}

// ── IA sobre mi lista ──
async function pedirIALista() {
  const titulos = lista.map(l => `"${l.title}" de ${l.author}`).join(', ');
  document.getElementById('modal-body').innerHTML = '<div class="loading-spinner">✨ Analizando tu lista...</div>';
  document.getElementById('modal-ia').style.display = 'flex';

  try {
    const resp = await fetch('http://localhost:3000/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Tengo estos libros en mi lista: ${titulos}.
¿Cuál me recomiendas empezar esta semana y por qué?
Respuesta breve y cálida en español.`
        }]
      })
    });
    const data = await resp.json();
    const text = data.content?.map(i => i.text || '').join('') || 'No se pudo obtener la recomendación.';
    document.getElementById('modal-body').textContent = text;
  } catch (e) {
    document.getElementById('modal-body').textContent = 'Error al conectar con la IA.';
  }
}

// ── Event Listeners ──
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.week-pill').textContent = getSemanaActual();

  fetch('http://localhost:3000/api/novedades')
    .then(r => r.json())
    .then(data => {
      window.currentBooks = [...(data.es || []), ...(data.en || [])];
      renderBooks(data.es || [], 'books-es');
      renderBooks(data.en || [], 'books-en');
      renderBooks(data.es || [], 'novedades-grid-es');
      renderBooks(data.en || [], 'novedades-grid-en');
    })
    .catch(() => {
      window.currentBooks = [...BOOKS_ES, ...BOOKS_EN];
      renderBooks(BOOKS_ES, 'books-es');
      renderBooks(BOOKS_EN, 'books-en');
      renderBooks(BOOKS_ES, 'novedades-grid-es');
      renderBooks(BOOKS_EN, 'novedades-grid-en');
    });

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      filtrarLibros();
    });
  });

  document.querySelectorAll('#moods .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('am');
      const v = btn.dataset.v;
      moods = moods.includes(v) ? moods.filter(x => x !== v) : [...moods, v];
      filtrarLibros();
    });
  });

  document.querySelectorAll('#topics .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('at');
      const v = btn.dataset.v;
      topics = topics.includes(v) ? topics.filter(x => x !== v) : [...topics, v];
      filtrarLibros();
    });
  });

  document.getElementById('btn-ia').addEventListener('click', pedirIA);

  document.getElementById('btn-search').addEventListener('click', buscar);
  document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') buscar();
  });

  document.getElementById('btn-lista-ia').addEventListener('click', pedirIALista);

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-ia').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-ia')) closeModal();
  });
});