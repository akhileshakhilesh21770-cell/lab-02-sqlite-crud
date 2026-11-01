// db-setup.js – Creates the database, table, and inserts 10 sample books
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  // Step 1: Create the book table
  db.run(`CREATE TABLE IF NOT EXISTS book (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    title   TEXT    NOT NULL,
    author  TEXT    NOT NULL,
    price   INTEGER NOT NULL,
    pages   INTEGER NOT NULL
  )`, (err) => {
    if (err) console.error('Table creation error:', err.message);
    else console.log('Table "book" created successfully.');
  });

  // Step 2: Insert 10 realistic book records
  const stmt = db.prepare('INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)');
  const books = [
    ['The Pragmatic Programmer',         'David Thomas',         899, 352],
    ['Clean Code',                       'Robert C. Martin',     799, 431],
    ['You Dont Know JS',                 'Kyle Simpson',         499, 278],
    ['JavaScript The Good Parts',        'Douglas Crockford',    399, 172],
    ['Eloquent JavaScript',              'Marijn Haverbeke',     599, 472],
    ['Node.js Design Patterns',          'Mario Casciaro',       999, 660],
    ['Learning SQL',                     'Alan Beaulieu',        649, 338],
    ['Database Design for Mere Mortals', 'Michael Hernandez',    749, 516],
    ['Express in Action',                'Evan Hahn',            549, 256],
    ['RESTful Web APIs',                 'Leonard Richardson',   699, 406]
  ];

  books.forEach(b => stmt.run(b));
  stmt.finalize();

  // Step 3: Verify all records
  db.all('SELECT * FROM book', [], (err, rows) => {
    if (err) { console.error(err); return; }
    console.log('\n=== SELECT * FROM book ===');
    rows.forEach(r => console.log(`id:${r.id} | "${r.title}" | ${r.author} | Rs.${r.price} | ${r.pages}pg`));
    console.log('\nTotal records inserted:', rows.length);
    db.close(() => console.log('Database setup complete!'));
  });
});
