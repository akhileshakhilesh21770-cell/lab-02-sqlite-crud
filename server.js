// ============================================================
// server.js
// Lab 2 – SQLite Database and CRUD Routes
// Course : Backend Development Fundamentals
// Student: V AKHILESH | Reg: 252U1R3099 | Section: CSE DS-2B
// ============================================================

// --- Imports ---
// Express: web framework to handle HTTP routes
const express = require('express');

// sqlite: promise-based wrapper that lets us use async/await with SQLite
// sqlite3: the actual SQLite engine (driver)
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

// --- App and Port ---
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware: parse incoming JSON request bodies automatically
// Without this, req.body would be undefined for POST and PUT requests
app.use(express.json());

// --- Database reference (filled inside initializeDBAndServer) ---
let db;

// ============================================================
// initializeDBAndServer()
//
// This async function does TWO things in order:
//   1. Opens the SQLite database connection
//   2. Starts the Express HTTP server
//
// The server only starts AFTER the database is ready.
// If the database fails to open, we log the error and stop.
// ============================================================
const initializeDBAndServer = async () => {
  try {
    // Step 1: Open the SQLite database file
    // 'filename' points to our database.db file in the same folder
    // 'driver'   tells sqlite which engine to use (sqlite3)
    db = await open({
      filename: './database.db',
      driver: sqlite3.Database,
    });
    console.log('Database connected successfully!');

    // Step 2: Start the Express server ONLY after DB is ready
    app.listen(PORT, () => {
      console.log('================================================');
      console.log('  Lab 2 – SQLite CRUD Server is running!');
      console.log(`  Student : V AKHILESH | Reg: 252U1R3099`);
      console.log(`  Server  : http://localhost:${PORT}`);
      console.log('================================================');
      console.log('  Available Routes:');
      console.log('  GET    /books/           -> Get all books');
      console.log('  GET    /books/:bookId/   -> Get one book');
      console.log('  POST   /books/           -> Add a new book');
      console.log('  PUT    /books/:bookId/   -> Update a book');
      console.log('  DELETE /books/:bookId/   -> Delete a book');
      console.log('================================================');
    });
  } catch (error) {
    // If anything goes wrong (DB not found, etc.) log the error
    console.error('Failed to connect to database:', error.message);
    // Exit the process so the server doesn't run without a database
    process.exit(1);
  }
};

// ============================================================
// ROUTE 1 – GET /books/
// Purpose : Retrieve ALL books from the database
// Status  : 200 OK
// ============================================================
app.get('/books/', async (req, res) => {
  try {
    // db.all() fetches every row from the book table
    const getBooksQuery = `SELECT * FROM book`;
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROUTE 2 – GET /books/:bookId/
// Purpose : Retrieve ONE specific book by its ID
// Status  : 200 if found, 404 if not found
// ============================================================
app.get('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;

    // ? placeholder prevents SQL injection
    // db.get() returns a single row (or undefined if not found)
    const getBookQuery = `SELECT * FROM book WHERE id = ?`;
    const book = await db.get(getBookQuery, [bookId]);

    if (book === undefined) {
      // Book not found – return 404
      res.status(404).json({ error: 'Book Not Found' });
    } else {
      // Book found – return it
      res.status(200).json(book);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROUTE 3 – POST /books/
// Purpose : Add a NEW book to the database
// Status  : 201 Created
// ============================================================
app.post('/books/', async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Basic validation
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: 'Bad Request: title, author, price and pages are required.',
      });
    }

    // ? placeholders for all user-supplied values (prevents SQL injection)
    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?)
    `;
    const result = await db.run(addBookQuery, [title, author, price, pages]);

    // Fetch the newly created book to return it
    const newBook = await db.get('SELECT * FROM book WHERE id = ?', [result.lastID]);
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROUTE 4 – PUT /books/:bookId/
// Purpose : Update an EXISTING book
// Status  : 200 if updated, 404 if not found
// ============================================================
app.put('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    // Check if the book exists first
    const existingBook = await db.get('SELECT * FROM book WHERE id = ?', [bookId]);
    if (existingBook === undefined) {
      return res.status(404).json({ error: 'Book Not Found' });
    }

    // Basic validation
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: 'Bad Request: title, author, price and pages are required.',
      });
    }

    // Update using ? placeholders
    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?
    `;
    await db.run(updateBookQuery, [title, author, price, pages, bookId]);

    // Return the updated book
    const updatedBook = await db.get('SELECT * FROM book WHERE id = ?', [bookId]);
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROUTE 5 – DELETE /books/:bookId/
// Purpose : Delete a book from the database
// Status  : 200 if deleted, 404 if not found
// ============================================================
app.delete('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;

    // Check if the book exists first
    const existingBook = await db.get('SELECT * FROM book WHERE id = ?', [bookId]);
    if (existingBook === undefined) {
      return res.status(404).json({ error: 'Book Not Found' });
    }

    // Delete the book
    const deleteBookQuery = `DELETE FROM book WHERE id = ?`;
    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({
      message: `Book with id ${bookId} deleted successfully.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Start everything by calling initializeDBAndServer()
// ============================================================
initializeDBAndServer();
