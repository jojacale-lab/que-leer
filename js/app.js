// -- Fecha dinamica --
function getSemanaActual() {
  var hoy = new Date();
  var dia = hoy.getDay();
  var diffLunes = dia === 0 ? -6 : 1 - dia;
  var lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffLunes);
  var domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  var opciones = { day: 'numeric', month: 'long' };
  var lunesStr = lunes.toLocaleDateString('es-ES', opciones);
  var domingoStr = domingo.toLocaleDateString('es-ES', opciones);
  var anio = domingo.getFullYear();
  return lunesStr + ' - ' + domingoStr + ' ' + anio;
}

// -- Estado global --
var lang = 'both';
var moods = [];
var topics = [];
var lista = [];
var filtroTimer = null;
var SERVER_URL = '';

// -- Portada --
function coverHTML(title, emoji, color, imgClass, phClass) {
  var src = COVERS[title];
  if (src) {
    return '<img src="' + src + '" class="' + imgClass + '" alt="Portada de ' + title + '" onerror="this.outerHTML=\'<div class=\\\'' + phClass + '\\\' style=\\\'background:' + color + ';\\\'>' + emoji + '</div>\'" loading="lazy">';
  }
  return '<div class="' + phClass + '" style="background:' + color + ';">' + emoji + '</div>';
}

// -- Render catalogo --
function renderBooks(books, containerId) {
  var cont = document.getElementById(containerId);
  if (!cont) return;
  if (!books || books.length === 0) {
    cont.innerHTML = '<div class="loading-msg">No hay libros disponibles.</div>';
    return;
  }
  cont.innerHTML = books.map(function(b) {
    var coverSrc = b.coverSrc || COVERS[b.title] || '';
    var coverEl = coverSrc
      ? '<img src="' + coverSrc + '" class="book-cover" alt="Portada de ' + b.title + '" onerror="this.style.display=\'none\'" loading="lazy">'
      : '<div class="cover-placeholder" style="background:' + b.color + ';">' + b.emoji + '</div>';
    var badgesHtml = b.badges.map(function(x) { return '<span class="badge ' + x.c + '">' + x.t + '</span>'; }).join('');
    return '<div class="book-card">' +
      '<div class="book-header" onclick="toggleResena(\'r-' + b.id + '\',\'ic-' + b.id + '\')">' +
      coverEl +
      '<div class="book-meta">' +
      '<div class="book-title">' + b.title + '</div>' +
      '<div class="book-author">' + b.author + ' · ' + b.year + '</div>' +
      '<div class="badge-row">' + badgesHtml + '<span class="chevron" id="ic-' + b.id + '">▾</span></div>' +
      '</div></div>' +
      '<div class="resena" id="r-' + b.id + '">' + (b.resena || '') + '</div>' +
      '<div class="card-actions">' +
      '<button class="aBtn" id="sv-' + b.id + '" onclick="guardar(\'' + b.id + '\')">🔖 Guardar</button>' +
      '<button class="aBtn" onclick="pedirResenaIA(\'' + b.title.replace(/'/g, "\\'") + '\',\'' + b.author.replace(/'/g, "\\'") + '\')">✨ Reseña IA</button>' +
      '</div></div>';
  }).join('');
}

// -- Toggle resena --
function toggleResena(rid, iid) {
  var r = document.getElementById(rid);
  var ic = document.getElementById(iid);
  if (!r) return;
  var open = r.style.display !== 'block';
  r.style.display = open ? 'block' : 'none';
  if (ic) ic.style.transform = open ? 'rotate(180deg)' : '';
}

// -- Idioma --
function setLang(l) {
  lang = l;
  document.querySelectorAll('.lang-btn').forEach(function(b) {
    b.className = 'lang-btn';
    if (b.dataset.lang === l) b.classList.add('act-' + l);
  });
  document.getElementById('sec-es').style.display = (l === 'en') ? 'none' : 'block';
  document.getElementById('sec-en').style.display = (l === 'es') ? 'none' : 'block';
  filtrarLibros();
}

// -- Tabs --
function showTab(t) {
  document.querySelectorAll('.nav-tab').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
  document.querySelector('[data-tab="' + t + '"]').classList.add('active');
  document.getElementById('tab-' + t).classList.add('active');
  if (t === 'lista') renderLista();
}

// -- Filtrar libros --
function filtrarLibros() {
  clearTimeout(filtroTimer);
  filtroTimer = setTimeout(async function() {
    if (moods.length === 0 && topics.length === 0) {
      try {
        var r = await fetch(SERVER_URL + '/api/novedades');
        var data = await r.json();
        window.currentBooks = (data.es || []).concat(data.en || []);
        renderBooks(data.es || [], 'books-es');
        renderBooks(data.en || [], 'books-en');
      } catch(e) {
        renderBooks(BOOKS_ES, 'books-es');
        renderBooks(BOOKS_EN, 'books-en');
      }
      return;
    }

    document.getElementById('books-es').innerHTML = '<div class="loading-msg">🔍 Buscando libros para ti...</div>';
    document.getElementById('books-en').innerHTML = '';

    var mood = moods[0] || '';
    var topicsStr = topics.join(',');
    var url = SERVER_URL + '/api/buscar-libros?mood=' + encodeURIComponent(mood) + '&topics=' + encodeURIComponent(topicsStr) + '&lang=' + lang;

    try {
      var r = await fetch(url);
      var data = await r.json();
      window.currentBooks = (data.es || []).concat(data.en || []);

      if (lang !== 'en') renderBooks(data.es || [], 'books-es');
      else document.getElementById('books-es').innerHTML = '';

      if (lang !== 'es') renderBooks(data.en || [], 'books-en');
      else document.getElementById('books-en').innerHTML = '';

      if ((!data.es || !data.es.length) && (!data.en || !data.en.length)) {
        document.getElementById('books-es').innerHTML = '<div class="loading-msg">No se encontraron libros. Intenta otra combinacion.</div>';
      }
    } catch(e) {
      document.getElementById('books-es').innerHTML = '<div class="loading-msg">Error al buscar libros.</div>';
    }
  }, 600);
}

// -- Guardar libro --
function guardar(id) {
  if (lista.find(function(l) { return l.id === id; })) return;
  var allBooks = window.currentBooks || [];
  var book = allBooks.find(function(b) { return b.id === id; });
  if (!book) return;
  lista.push(Object.assign({}, book, { status: 'quiero' }));
  var btn = document.getElementById('sv-' + id);
  if (btn) { btn.classList.add('saved'); btn.textContent = '✓ Guardado'; }
  updateCount();
}

function guardarExterno(book) {
  if (lista.find(function(l) { return l.id === book.id; })) {
    alert('Ya esta en tu lista.');
    return;
  }
  lista.push(Object.assign({}, book, { status: 'quiero' }));
  updateCount();
  alert('Guardado: ' + book.title);
}

function updateCount() {
  var el = document.getElementById('lista-count');
  el.textContent = lista.length;
  el.style.display = lista.length > 0 ? 'inline' : 'none';
}

function setStatus(id, s) {
  var item = lista.find(function(l) { return l.id === id; });
  if (item) item.status = s;
  renderLista();
}

function eliminar(id) {
  lista = lista.filter(function(l) { return l.id !== id; });
  updateCount();
  renderLista();
}

function renderLista() {
  var cont = document.getElementById('lista-container');
  document.getElementById('st-total').textContent = lista.length;
  document.getElementById('st-leyendo').textContent = lista.filter(function(l) { return l.status === 'leyendo'; }).length;
  document.getElementById('st-leido').textContent = lista.filter(function(l) { return l.status === 'leido'; }).length;
  document.getElementById('lista-empty').style.display = lista.length ? 'none' : 'block';
  document.getElementById('lista-ai-btn').style.display = lista.length ? 'block' : 'none';
  cont.querySelectorAll('.lista-item').forEach(function(e) { e.remove(); });
  lista.forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'lista-item';
    var coverSrc = item.coverSrc || COVERS[item.title] || '';
    var coverEl = coverSrc
      ? '<img src="' + coverSrc + '" class="li-cover" alt="Portada" onerror="this.style.display=\'none\'" loading="lazy">'
      : '<div class="li-cover-ph" style="background:' + item.color + ';">' + item.emoji + '</div>';
    div.innerHTML = coverEl +
      '<div class="li-info">' +
      '<div class="li-title">' + item.title + '</div>' +
      '<div class="li-author">' + item.author + '</div>' +
      '<div class="li-status">' +
      '<button class="stBtn ' + (item.status === 'quiero' ? 'sq' : '') + '" onclick="setStatus(\'' + item.id + '\',\'quiero\')">Quiero leer</button>' +
      '<button class="stBtn ' + (item.status === 'leyendo' ? 'sl' : '') + '" onclick="setStatus(\'' + item.id + '\',\'leyendo\')">Leyendo</button>' +
      '<button class="stBtn ' + (item.status === 'leido' ? 'sd' : '') + '" onclick="setStatus(\'' + item.id + '\',\'leido\')">Leido</button>' +
      '</div></div>' +
      '<button class="rm-btn" onclick="eliminar(\'' + item.id + '\')" title="Eliminar">✕</button>';
    cont.appendChild(div);
  });
}

async function buscar() {
  var q = document.getElementById('search-input').value.trim();
  if (!q) return;
  var res = document.getElementById('search-results');
  res.innerHTML = '<div class="loading-msg">🔍 Buscando...</div>';
  try {
    var r = await fetch('https://openlibrary.org/search.json?q=' + encodeURIComponent(q) + '&limit=10');
    var data = await r.json();
    var docs = (data.docs || []).filter(function(d) { return !isAcademic(d); }).slice(0, 6);
    if (!docs.length) {
      res.innerHTML = '<div class="loading-msg">Sin resultados para "' + q + '".</div>';
      return;
    }
    res.innerHTML = '<div class="sr-title">Resultados para "' + q + '"</div>' +
      docs.map(function(d) {
        var title = d.title || 'Sin titulo';
        var author = (d.author_name || ['Autor desconocido'])[0];
        var year = d.first_publish_year || '';
        var coverId = d.cover_i;
        var coverSrc = coverId ? 'https://covers.openlibrary.org/b/id/' + coverId + '-M.jpg' : null;
        var bid = 'sr-' + Math.random().toString(36).slice(2, 7);
        var bookObj = { id: bid, title: title, author: author, year: String(year), emoji: '📖', color: '#F1EFE8', badges: [], resena: '', coverSrc: coverSrc };
        var coverEl = coverSrc
          ? '<img src="' + coverSrc + '" class="book-cover" alt="Portada" loading="lazy">'
          : '<div class="cover-placeholder" style="background:#F1EFE8;">📖</div>';
        return '<div class="book-card"><div class="book-header">' + coverEl +
          '<div class="book-meta"><div class="book-title">' + title + '</div>' +
          '<div class="book-author">' + author + (year ? ' · ' + year : '') + '</div></div></div>' +
          '<div class="card-actions">' +
          '<button class="aBtn" onclick=\'guardarExterno(' + JSON.stringify(bookObj) + ')\'>🔖 Guardar</button>' +
          '<button class="aBtn" onclick="pedirResenaIA(\'' + title.replace(/'/g, "\\'") + '\',\'' + author.replace(/'/g, "\\'") + '\')">✨ Resena IA</button>' +
          '</div></div>';
      }).join('');
  } catch(e) {
    res.innerHTML = '<div class="loading-msg">Error al buscar.</div>';
  }
}

function isAcademic(d) {
  var subjects = (d.subject || []).join(' ').toLowerCase();
  var title = (d.title || '').toLowerCase();
  var bad = ['textbook', 'university', 'course', 'academic', 'manual', 'workbook', 'chemistry', 'physics', 'calculus', 'algebra'];
  return bad.some(function(w) { return subjects.includes(w) || title.includes(w); });
}

function closeModal() {
  document.getElementById('modal-ia').style.display = 'none';
}

async function pedirResenaIA(title, author) {
  document.getElementById('modal-body').innerHTML = '<div class="loading-spinner">✨ Consultando a la IA...</div>';
  document.getElementById('modal-ia').style.display = 'flex';
  try {
    var resp = await fetch(SERVER_URL + '/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: 'Dame una resena breve del libro "' + title + '" de ' + author + '. De que trata, para quien es ideal, y una frase que lo defina. Responde en espanol. Tono calido y literario.' }]
      })
    });
    var data = await resp.json();
    var text = data.content ? data.content.map(function(i) { return i.text || ''; }).join('') : 'No se pudo obtener la resena.';
    document.getElementById('modal-body').textContent = text;
  } catch(e) {
    document.getElementById('modal-body').textContent = 'Error al conectar con la IA.';
  }
}

async function pedirIA() {
  var m = moods.length ? moods.join(', ') : 'no especificado';
  var t = topics.length ? topics.join(', ') : 'no especificado';
  var l = lang === 'es' ? 'solo en espanol' : lang === 'en' ? 'solo en ingles' : 'en espanol e ingles';
  document.getElementById('modal-body').innerHTML = '<div class="loading-spinner">✨ Buscando libros para ti...</div>';
  document.getElementById('modal-ia').style.display = 'flex';
  try {
    var resp = await fetch(SERVER_URL + '/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: 'Recomiendame 5 libros reales para leer esta semana. Solo narrativa y divulgacion accesible. Idioma: ' + l + '. Estado de animo: ' + m + '. Generos: ' + t + '. Para cada libro: titulo, autor, ano y resena de 2-3 oraciones. Tono calido.' }]
      })
    });
    var data = await resp.json();
    var text = data.content ? data.content.map(function(i) { return i.text || ''; }).join('') : 'No se pudo obtener la recomendacion.';
    document.getElementById('modal-body').textContent = text;
  } catch(e) {
    document.getElementById('modal-body').textContent = 'Error al conectar con la IA.';
  }
}

async function pedirIALista() {
  var titulos = lista.map(function(l) { return '"' + l.title + '" de ' + l.author; }).join(', ');
  document.getElementById('modal-body').innerHTML = '<div class="loading-spinner">✨ Analizando tu lista...</div>';
  document.getElementById('modal-ia').style.display = 'flex';
  try {
    var resp = await fetch(SERVER_URL + '/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: 'Tengo estos libros en mi lista: ' + titulos + '. Cual me recomiendas empezar esta semana y por que? Respuesta breve y calida en espanol.' }]
      })
    });
    var data = await resp.json();
    var text = data.content ? data.content.map(function(i) { return i.text || ''; }).join('') : 'No se pudo obtener la recomendacion.';
    document.getElementById('modal-body').textContent = text;
  } catch(e) {
    document.getElementById('modal-body').textContent = 'Error al conectar con la IA.';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Detectar si estamos en produccion o local
  SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

  document.querySelector('.week-pill').textContent = getSemanaActual();

  fetch(SERVER_URL + '/api/novedades')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      window.currentBooks = (data.es || []).concat(data.en || []);
      renderBooks(data.es || [], 'books-es');
      renderBooks(data.en || [], 'books-en');
      renderBooks(data.es || [], 'novedades-grid-es');
      renderBooks(data.en || [], 'novedades-grid-en');
    })
    .catch(function() {
      window.currentBooks = BOOKS_ES.concat(BOOKS_EN);
      renderBooks(BOOKS_ES, 'books-es');
      renderBooks(BOOKS_EN, 'books-en');
      renderBooks(BOOKS_ES, 'novedades-grid-es');
      renderBooks(BOOKS_EN, 'novedades-grid-en');
    });

  document.querySelectorAll('.nav-tab').forEach(function(btn) {
    btn.addEventListener('click', function() { showTab(btn.dataset.tab); });
  });

  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { setLang(btn.dataset.lang); });
  });

  document.querySelectorAll('#moods .pill').forEach(function(btn) {
    btn.addEventListener('click', function() {
      btn.classList.toggle('am');
      var v = btn.dataset.v;
      moods = moods.includes(v) ? moods.filter(function(x) { return x !== v; }) : moods.concat([v]);
      filtrarLibros();
    });
  });

  document.querySelectorAll('#topics .pill').forEach(function(btn) {
    btn.addEventListener('click', function() {
      btn.classList.toggle('at');
      var v = btn.dataset.v;
      topics = topics.includes(v) ? topics.filter(function(x) { return x !== v; }) : topics.concat([v]);
      filtrarLibros();
    });
  });

  document.getElementById('btn-ia').addEventListener('click', pedirIA);
  document.getElementById('btn-search').addEventListener('click', buscar);
  document.getElementById('search-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') buscar();
  });
  document.getElementById('btn-lista-ia').addEventListener('click', pedirIALista);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-ia').addEventListener('click', function(e) {
    if (e.target === document.getElementById('modal-ia')) closeModal();
  });
});
