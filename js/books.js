// ── Portadas por ISBN (Open Library) ──
const COVERS = {
  'Temporada de huracanes':       'https://covers.openlibrary.org/b/isbn/9786073156028-M.jpg',
  'La sombra del viento':         'https://covers.openlibrary.org/b/isbn/9788408163435-M.jpg',
  'El infinito en un junco':      'https://covers.openlibrary.org/b/isbn/9788417860226-M.jpg',
  'Mañana, y mañana, y mañana':   'https://covers.openlibrary.org/b/isbn/9788425367052-M.jpg',
  'James':                        'https://covers.openlibrary.org/b/isbn/9780385550369-M.jpg',
  'The Women':                    'https://covers.openlibrary.org/b/isbn/9780312577230-M.jpg',
  'Intermezzo':                   'https://covers.openlibrary.org/b/isbn/9780374610364-M.jpg',
  'The Demon of Unrest':          'https://covers.openlibrary.org/b/isbn/9780385348768-M.jpg',
};

// ── Catálogo en español ──
const BOOKS_ES = [
  {
    id: 'b1',
    title: 'Temporada de huracanes',
    author: 'Fernanda Melchor',
    year: '2017',
    emoji: '📕',
    color: '#FAEEDA',
    badges: [{ t: 'ES', c: 'b-es' }, { t: 'Tendencia', c: 'b-trend' }],
    resena: 'En un pueblo de Veracruz aparece el cuerpo de la Bruja, una mujer que vendía pociones y concedía favores oscuros. Melchor reconstruye el crimen desde voces múltiples en un torrente de prosa brutal e hipnótico. Una novela que golpea fuerte y no se olvida. Premio Anna Seghers.',
  },
  {
    id: 'b2',
    title: 'La sombra del viento',
    author: 'Carlos Ruiz Zafón',
    year: '2001',
    emoji: '📗',
    color: '#E1F5EE',
    badges: [{ t: 'ES', c: 'b-es' }, { t: 'Clásico moderno', c: 'b-classic' }],
    resena: 'Barcelona, 1945. Un niño descubre en el Cementerio de los Libros Olvidados una novela de un autor desaparecido. Al buscar su historia se adentra en una red de secretos y tragedia que atraviesa la posguerra española. Una de las novelas más vendidas del siglo XXI en español.',
  },
  {
    id: 'b3',
    title: 'El infinito en un junco',
    author: 'Irene Vallejo',
    year: '2019',
    emoji: '📘',
    color: '#EEEDFE',
    badges: [{ t: 'ES', c: 'b-es' }, { t: 'Divulgación', c: 'b-sci' }],
    resena: 'Un ensayo apasionante sobre el origen de los libros, desde los papiros egipcios hasta las grandes bibliotecas de la Antigüedad. Vallejo convierte la historia de la escritura en una narración tan envolvente como una novela. Divulgación extraordinaria. Premio Nacional.',
  },
  {
    id: 'b4',
    title: 'Mañana, y mañana, y mañana',
    author: 'Gabrielle Zevin',
    year: '2024',
    emoji: '📙',
    color: '#FAECE7',
    badges: [{ t: 'ES', c: 'b-es' }, { t: 'Traducción nueva', c: 'b-new' }],
    resena: 'Sam y Sadie se conocen de niños y se reencuentran para crear videojuegos juntos. Una historia sobre creatividad, amistad, amor y dedicar la vida a hacer algo que amas. Emotiva, inteligente y llena de cultura pop. Fenómeno editorial mundial ya en español.',
  },
];

// ── Catálogo en inglés ──
const BOOKS_EN = [
  {
    id: 'b5',
    title: 'James',
    author: 'Percival Everett',
    year: '2024',
    emoji: '📘',
    color: '#E6F1FB',
    badges: [{ t: 'EN', c: 'b-en' }, { t: 'Pulitzer 2024', c: 'b-new' }],
    resena: 'A bold reimagining of Huckleberry Finn from the perspective of Jim, the enslaved man. As Jim escapes down the Mississippi, he grapples with freedom, identity and humanity. Brilliant, funny, devastating — one of the best novels of the decade.',
  },
  {
    id: 'b6',
    title: 'The Women',
    author: 'Kristin Hannah',
    year: '2024',
    emoji: '📗',
    color: '#EAF3DE',
    badges: [{ t: 'EN', c: 'b-en' }, { t: 'NYT Bestseller', c: 'b-trend' }],
    resena: 'Frances McGrath joins the Army Nurse Corps and goes to Vietnam in 1965, only to return home to a country that wants to forget the war. A sweeping, emotional story about female veterans erased from history. Kristin Hannah at her absolute best.',
  },
  {
    id: 'b7',
    title: 'Intermezzo',
    author: 'Sally Rooney',
    year: '2024',
    emoji: '📕',
    color: '#FBEAF0',
    badges: [{ t: 'EN', c: 'b-en' }, { t: 'New 2024', c: 'b-new' }],
    resena: "Two brothers cope with grief after their father's death by falling into unexpected relationships. Sally Rooney's most mature novel: quieter but emotionally richer, exploring love, loss and the distance between siblings who share everything except understanding.",
  },
  {
    id: 'b8',
    title: 'The Demon of Unrest',
    author: 'Erik Larson',
    year: '2024',
    emoji: '📙',
    color: '#FAEEDA',
    badges: [{ t: 'EN', c: 'b-en' }, { t: 'Narrative non-fiction', c: 'b-sci' }],
    resena: "The five months between Lincoln's election and the first shots of the Civil War, reconstructed from letters and diaries. Reads like a thriller, not a textbook. Narrative non-fiction at its finest — Larson's most gripping book yet.",
  },
];
