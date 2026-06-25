const express = require('express');
const cors = require('cors');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

require('dotenv').config();
const API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_BOOKS_KEY = process.env.GOOGLE_BOOKS_KEY;

async function actualizarNovedades() {
  console.log('Actualizando novedades con Google Books...');
  try {
    const queries = [
      'novela+española+2025',
      'best+fiction+2025+english'
    ];

    const results = await Promise.all(queries.map(q =>
      fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&orderBy=newest&maxResults=4&key=${GOOGLE_BOOKS_KEY}`)
        .then(r => r.json())
    ));

    const mapBook = (item, lang, idx) => ({
      id: `${lang}${idx}`,
      title: item.volumeInfo?.title || 'Sin título',
      author: (item.volumeInfo?.authors || ['Autor desconocido'])[0],
      year: (item.volumeInfo?.publishedDate || '2026').slice(0, 4),
      emoji: ['📕','📗','📘','📙'][idx % 4],
      color: ['#FAEEDA','#E1F5EE','#EEEDFE','#FAECE7'][idx % 4],
      badges: [
        { t: lang === 'es' ? 'ES' : 'EN', c: lang === 'es' ? 'b-es' : 'b-en' },
        { t: 'Nuevo', c: 'b-new' }
      ],
      resena: item.volumeInfo?.description
        ? item.volumeInfo.description.slice(0, 200) + '...'
        : 'Descripción no disponible.',
      coverSrc: item.volumeInfo?.imageLinks?.thumbnail || null
    });

    const novedades = {
      es: (results[0].items || []).map((item, i) => mapBook(item, 'es', i)),
      en: (results[1].items || []).map((item, i) => mapBook(item, 'en', i))
    };

    fs.writeFileSync('novedades.json', JSON.stringify(novedades, null, 2));
    console.log('Novedades actualizadas con Google Books.');
  } catch (e) {
    console.log('Error actualizando novedades:', e.message);
  }
}

app.get('/api/buscar-libros', async (req, res) => {
  const { mood, topics, lang } = req.query;
  try {
    const langLabel = lang === 'es' ? 'solo en español' : lang === 'en' ? 'solo en inglés' : '4 en español y 4 en inglés';

    const iaResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Recomiéndame 8 libros de narrativa o divulgación (NO libros de texto, NO manuales, NO guiones) para alguien que se siente "${mood}" y le interesa "${topics}". Idioma: ${langLabel}.

Responde SOLO con JSON válido, sin texto adicional:
{
  "es": [
    {"title": "Título exacto", "author": "Autor exacto"}
  ],
  "en": [
    {"title": "Exact title", "author": "Exact author"}
  ]
}`
        }]
      })
    });

    const iaData = await iaResp.json();
    const iaText = iaData.content?.map(i => i.text || '').join('') || '{}';
    const clean = iaText.replace(/```json|```/g, '').trim();
    console.log('IA respondió:', iaText);
    const libros = JSON.parse(clean);

    const buscarEnGoogle = async (title, author, lng, idx) => {
      try {
        const q = encodeURIComponent(`${title} ${author}`);
        const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&key=${GOOGLE_BOOKS_KEY}`);
        const d = await r.json();
        const item = d.items?.[0];
        return {
          id: `f-${lng}${idx}-${Date.now()}`,
          title: title,
          author: author,
          year: (item?.volumeInfo?.publishedDate || '').slice(0, 4) || '',
          emoji: ['📕','📗','📘','📙'][idx % 4],
          color: ['#FAEEDA','#E1F5EE','#EEEDFE','#FAECE7'][idx % 4],
          badges: [
            { t: lng === 'es' ? 'ES' : 'EN', c: lng === 'es' ? 'b-es' : 'b-en' },
            { t: 'Recomendado', c: 'b-trend' }
          ],
          resena: item?.volumeInfo?.description
            ? item.volumeInfo.description.slice(0, 220) + '...'
            : 'Descripción no disponible.',
          coverSrc: item?.volumeInfo?.imageLinks?.thumbnail || null
        };
      } catch {
        return null;
      }
    };

    const [booksEs, booksEn] = await Promise.all([
      Promise.all((libros.es || []).map((b, i) => buscarEnGoogle(b.title, b.author, 'es', i))),
      Promise.all((libros.en || []).map((b, i) => buscarEnGoogle(b.title, b.author, 'en', i)))
    ]);

    res.json({
      es: booksEs.filter(Boolean),
      en: booksEn.filter(Boolean)
    });

  } catch (e) {
    console.log('Error buscar-libros DETALLE:', e.message, e.stack);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/novedades', (req, res) => {
  try {
    const data = fs.readFileSync('novedades.json', 'utf8');
    res.json(JSON.parse(data));
  } catch (e) {
    res.status(404).json({ error: 'Novedades no disponibles aún.' });
  }
});

app.post('/api/claude', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    console.log('Respuesta API:', JSON.stringify(data));
    res.json(data);
  } catch (e) {
    console.log('Error:', e.message);
    res.status(500).json({ error: 'Error conectando con Claude' });
  }
});

cron.schedule('0 8 * * 1', () => {
  actualizarNovedades();
});

if (!fs.existsSync('novedades.json')) {
  actualizarNovedades();
} else {
  actualizarNovedades();
}

app.use(express.static('.'));

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});