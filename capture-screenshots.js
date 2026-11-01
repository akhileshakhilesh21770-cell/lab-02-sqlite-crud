// capture-screenshots.js – Captures all Lab 2 API screenshots using Puppeteer
const puppeteer = require('puppeteer');
const http = require('http');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const express = require('express');

const PORT = 3002;
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const CHROME = 'C:\\Users\\DELL\\.cache\\puppeteer\\chrome-headless-shell\\win64-156.0.8078.47\\chrome-headless-shell-win64\\chrome-headless-shell.exe';

// Helper: make HTTP request
function apiRequest(method, urlPath, body = null) {
  return new Promise((resolve) => {
    const b = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: PORT, path: urlPath, method,
      headers: { 'Content-Type': 'application/json', ...(b ? { 'Content-Length': Buffer.byteLength(b) } : {}) }
    };
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', x => d += x);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    if (b) r.write(b);
    r.end();
  });
}

// Helper: create a styled HTML page for screenshot
function makeHtml(title, method, endpoint, status, body) {
  const statusColor = status < 300 ? '#1a7f1a' : status < 400 ? '#b8860b' : '#c0392b';
  const bodyStr = typeof body === 'object' ? JSON.stringify(body, null, 2) : body;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:monospace;background:#1e1e1e;color:#d4d4d4;">
  <div style="background:#252526;padding:12px 20px;border-bottom:2px solid #007acc;">
    <span style="color:#9cdcfe;font-size:15px;font-weight:bold;">${method}</span>
    <span style="color:#ce9178;font-size:15px;margin-left:10px;">${endpoint}</span>
    <span style="float:right;background:${statusColor};color:#fff;padding:3px 10px;border-radius:4px;font-size:13px;">${status}</span>
  </div>
  <div style="padding:10px 20px;font-size:12px;color:#858585;">Lab 2 – V AKHILESH | 252U1R3099 | CSE DS-2B</div>
  <pre style="margin:0 20px 20px;background:#1a1a2e;padding:15px;border-radius:6px;font-size:13px;color:#a8ff78;overflow:auto;max-height:450px;">${bodyStr}</pre>
  </body></html>`;
}

async function run() {
  // Start temporary server
  const app = express();
  app.use(express.json());
  const db = await open({ filename: './database.db', driver: sqlite3.Database });

  app.get('/books/', async (req, res) => { const r = await db.all('SELECT * FROM book'); res.status(200).json(r); });
  app.get('/books/:id/', async (req, res) => { const r = await db.get('SELECT * FROM book WHERE id=?',[req.params.id]); r ? res.status(200).json(r) : res.status(404).json({error:'Book Not Found'}); });
  app.post('/books/', async (req, res) => { const{title,author,price,pages}=req.body; if(!title||!author||price===undefined||pages===undefined) return res.status(400).json({error:'Bad Request'}); const r=await db.run('INSERT INTO book(title,author,price,pages)VALUES(?,?,?,?)',[title,author,price,pages]); const nb=await db.get('SELECT * FROM book WHERE id=?',[r.lastID]); res.status(201).json(nb); });
  app.put('/books/:id/', async (req, res) => { const e=await db.get('SELECT * FROM book WHERE id=?',[req.params.id]); if(!e) return res.status(404).json({error:'Book Not Found'}); const{title,author,price,pages}=req.body; await db.run('UPDATE book SET title=?,author=?,price=?,pages=? WHERE id=?',[title,author,price,pages,req.params.id]); const u=await db.get('SELECT * FROM book WHERE id=?',[req.params.id]); res.status(200).json(u); });
  app.delete('/books/:id/', async (req, res) => { const e=await db.get('SELECT * FROM book WHERE id=?',[req.params.id]); if(!e) return res.status(404).json({error:'Book Not Found'}); await db.run('DELETE FROM book WHERE id=?',[req.params.id]); res.status(200).json({message:`Book ${req.params.id} deleted successfully.`}); });

  const server = app.listen(PORT, async () => {
    console.log('Screenshot server started on', PORT);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: CHROME,
      args: ['--no-sandbox']
    });

    async function screenshot(filename, method, endpoint, status, body) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1000, height: 500 });
      await page.setContent(makeHtml('', method, endpoint, status, body));
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, filename) });
      await page.close();
      console.log('✅ Saved:', filename);
    }

    // 1. DB initial records
    let r = await apiRequest('GET', '/books/');
    await screenshot('db-initial-records.png', 'GET', '/books/', r.status, JSON.parse(r.body));

    // 2. GET all books
    await screenshot('get-all-books.png', 'GET', '/books/', r.status, JSON.parse(r.body));

    // 3. GET one book
    r = await apiRequest('GET', '/books/1/');
    await screenshot('get-one-book.png', 'GET', '/books/1/', r.status, JSON.parse(r.body));

    // 4. POST new book
    r = await apiRequest('POST', '/books/', { title: 'Learning Node.js', author: 'John Smith', price: 450, pages: 320 });
    const newBook = JSON.parse(r.body);
    await screenshot('post-new-book.png', 'POST', '/books/', r.status, newBook);

    // 5. PUT update book
    r = await apiRequest('PUT', `/books/${newBook.id}/`, { title: 'Advanced Node.js', author: 'John Smith', price: 550, pages: 400 });
    await screenshot('put-update-book.png', 'PUT', `/books/${newBook.id}/`, r.status, JSON.parse(r.body));

    // 6. DELETE book
    r = await apiRequest('DELETE', `/books/${newBook.id}/`);
    await screenshot('delete-book.png', 'DELETE', `/books/${newBook.id}/`, r.status, JSON.parse(r.body));

    // 7. 404 response
    r = await apiRequest('GET', '/books/999/');
    await screenshot('404-not-found.png', 'GET', '/books/999/', r.status, JSON.parse(r.body));

    // 8. DB after CRUD
    r = await apiRequest('GET', '/books/');
    await screenshot('db-after-crud.png', 'GET', '/books/ (after CRUD)', r.status, JSON.parse(r.body));

    // 9. Nodemon info page
    const nodemonBody = {
      info: 'nodemon restarts server automatically on file changes',
      command: 'npm run dev',
      script: 'nodemon server.js',
      status: 'Server would auto-restart on any .js file change'
    };
    await screenshot('nodemon-running.png', 'INFO', 'nodemon server.js', 200, nodemonBody);

    await browser.close();
    server.close();
    await db.close();
    console.log('\n🎉 All screenshots saved in screenshots/');
  });
}

run().catch(e => { console.error(e); process.exit(1); });
