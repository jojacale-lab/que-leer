# 📚 ¿Qué leer esta semana?

App web de recomendación de libros en español e inglés, con portadas reales, reseñas con IA y lista de lectura personal.

## Estructura del proyecto

```
que-leer/
├── index.html        ← Página principal
├── css/
│   └── style.css     ← Estilos
├── js/
│   ├── books.js      ← Catálogo de libros y portadas
│   └── app.js        ← Lógica de la app
└── README.md
```

## Cómo abrir en VS Code

1. Abre la carpeta `que-leer/` en VS Code
2. Instala la extensión **Live Server** (si no la tienes):
   - Ve a Extensiones (Ctrl+Shift+X)
   - Busca "Live Server" de Ritwick Dey
   - Instala
3. Haz clic derecho en `index.html` → **"Open with Live Server"**
4. La app se abre en tu navegador en `http://127.0.0.1:5500`

## Funcionalidades

- 🎨 **Hero** con colores vivos (rojo, naranja, amarillo, verde, azul)
- 📚 **Descubrir**: catálogo semanal de libros con portadas reales (Open Library)
- 🔍 **Buscar**: búsqueda en tiempo real por título o autor
- ✨ **IA**: recomendaciones personalizadas y reseñas generadas con Claude
- 🔖 **Mi lista**: guarda libros con estados (Quiero leer / Leyendo / Leído)
- 🌐 **Bilingüe**: español e inglés

## Agregar libros al catálogo

Edita `js/books.js` y agrega un objeto al array `BOOKS_ES` o `BOOKS_EN`:

```js
{
  id: 'b9',                          // ID único
  title: 'Título del libro',
  author: 'Nombre del autor',
  year: '2024',
  emoji: '📕',                       // Emoji de respaldo
  color: '#FAEEDA',                  // Color de respaldo
  badges: [
    { t: 'ES', c: 'b-es' },         // Idioma
    { t: 'Nuevo', c: 'b-new' },     // Etiqueta
  ],
  resena: 'Descripción del libro...',
}
```

Para agregar la portada, busca el ISBN del libro y añade a `COVERS` en `books.js`:
```js
'Título del libro': 'https://covers.openlibrary.org/b/isbn/TU-ISBN-M.jpg',
```

## IA — API Key

Las funciones de IA usan la API de Anthropic (Claude).
Para que funcionen en producción necesitas una API key.

Opción recomendada: crea un archivo `.env` y usa un backend simple
(Node.js / Express) para no exponer la key en el frontend.

## Próximos pasos sugeridos

- [ ] Persistencia de lista con `localStorage`
- [ ] Modo oscuro
- [ ] Más libros en el catálogo
- [ ] Filtro por género en el catálogo
- [ ] Página de detalle por libro
