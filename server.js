const express = require('express');
const cors = require('cors');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_BOOKS_KEY = 'AIzaSyCUBeqOXy-_WIztHHi9PPGyWAQZ66qP8N0';

async function actualizarNovedades() {
  console.log('Actualizando novedades con Google Books...');
  try {
    var queries = [
      'novela+espanola+hispanoamericana+2025',
      'best+fiction+2025+english'
    ];
    var results = await Promise.all(queries.map(function(q) {
      return fetch('https://www.googleapis.com/books/v1/volumes?q=' + q + '&orderBy=newest&maxResults=4&key=' + GOOGLE_BOOKS_KEY).then(function(r) { return r.json(); });
    }));
    function mapBook(item, lang, idx) {
      return {
        id: lang + idx,
        title: item.volumeInfo.title || 'Sin titulo',
        author: (item.volumeInfo.authors || ['Autor desconocido'])[0],
        year: (item.volumeInfo.publishedDate || '2025').slice(0, 4),
        emoji: ['📕','📗','📘','📙'][idx % 4],
        color: ['#FAEEDA','#E1F5EE','#EEEDFE','#FAECE7'][idx % 4],
        badges: [
          { t: lang === 'es' ? 'ES' : 'EN', c: lang === 'es' ? 'b-es' : 'b-en' },
          { t: 'Nuevo', c: 'b-new' }
        ],
        resena: item.volumeInfo.description ? item.volumeInfo.description.slice(0, 200) + '...' : 'Descripcion no disponible.',
        coverSrc: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : null
      };
    }
    var novedades = {
      es: (results[0].items || []).map(function(item, i) { return mapBook(item, 'es', i); }),
      en: (results[1].items || []).map(function(item, i) { return mapBook(item, 'en', i); })
    };
    fs.writeFileSync('novedades.json', JSON.stringify(novedades, null, 2));
    console.log('Novedades actualizadas con Google Books.');
  } catch(e) {
    console.log('Error actualizando novedades:', e.message);
  }
}

app.get('/api/buscar-libros', async function(req, res) {
  var mood = req.query.mood || '';
  var topics = req.query.topics || '';
  var lang = req.query.lang || 'both';
  try {
    var langLabel = lang === 'es' ? 'solo en espanol' : lang === 'en' ? 'solo en ingles' : '4 en espanol y 4 en ingles';
    var prompt = 'Recomiendame 8 libros de narrativa o divulgacion (NO libros de texto, NO manuales, NO guiones) para alguien que se siente ' + mood + ' y le interesa ' + topics + '. Idioma: ' + langLabel + '. Incluye siempre al menos 2-3 autores hispanoamericanos o espanoles (Garcia Marquez, Isabel Allende, Vargas Llosa, Cortazar, Borges, Rulfo, Benedetti). Responde SOLO con JSON valido sin texto adicional: {"es": [{"title": "titulo", "author": "autor"}], "en": [{"title": "title", "author": "author"}]}';

    var iaResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    var iaData = await iaResp.json();
    console.log('IA response:', JSON.stringify(iaData));
    var iaText = iaData.content ? iaData.content.map(function(i) { return i.text || ''; }).join('') : '{"es":[],"en":[]}';
    var clean = iaText.replace(/```json/g, '').replace(/```/g, '').trim();
    var libros = JSON.parse(clean);

    async function buscarEnGoogle(title, author, lng, idx) {
      try {
        var q = encodeURIComponent(title + ' ' + author);
        var r = await fetch('https://www.googleapis.com/books/v1/volumes?q=' + q + '&maxResults=1&key=' + GOOGLE_BOOKS_KEY);
        var d = await r.json();
        var item = d.items ? d.items[0] : null;
        return {
          id: 'f-' + lng + idx + '-' + Date.now(),
          title: title,
          author: author,
          year: item && item.volumeInfo.publishedDate ? item.volumeInfo.publishedDate.slice(0, 4) : '',
          emoji: ['📕','📗','📘','📙'][idx % 4],
          color: ['#FAEEDA','#E1F5EE','#EEEDFE','#FAECE7'][idx % 4],
          badges: [
            { t: lng === 'es' ? 'ES' : 'EN', c: lng === 'es' ? 'b-es' : 'b-en' },
            { t: 'Recomendado', c: 'b-trend' }
          ],
          resena: item && item.volumeInfo.description ? item.volumeInfo.description.slice(0, 220) + '...' : 'Descripcion no disponible.',
          coverSrc: item && item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : null
        };
      } catch(e) {
        return null;
      }
    }

    var booksEs = await Promise.all((libros.es || []).map(function(b, i) { return buscarEnGoogle(b.title, b.author, 'es', i); }));
    var booksEn = await Promise.all((libros.en || []).map(function(b, i) { return buscarEnGoogle(b.title, b.author, 'en', i); }));

    res.json({
      es: booksEs.filter(function(b) { return b !== null; }),
      en: booksEn.filter(function(b) { return b !== null; })
    });

  } catch(e) {
    console.log('Error buscar-libros:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/novedades', function(req, res) {
  try {
    var data = fs.readFileSync('novedades.json', 'utf8');
    res.json(JSON.parse(data));
  } catch(e) {
    res.status(404).json({ error: 'Novedades no disponibles.' });
  }
});

app.post('/api/claude', async function(req, res) {
  try {
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    var data = await response.json();
    res.json(data);
  } catch(e) {
    console.log('Error:', e.message);
    res.status(500).json({ error: 'Error conectando con Claude' });
  }
});

cron.schedule('0 8 * * 1', function() {
  actualizarNovedades();
});

if (!fs.existsSync('novedades.json')) {
  actualizarNovedades();
} else {
  actualizarNovedades();
}

app.use(express.static('.'));

app.listen(3000, function() {
  console.log('Servidor corriendo en http://localhost:3000');
});