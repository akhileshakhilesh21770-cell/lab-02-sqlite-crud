// test-api.js – Tests all 5 CRUD routes
const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runTests() {
  await new Promise(r => setTimeout(r, 1000)); // wait for server

  console.log('\n========================================');
  console.log('   LAB 2 – API TEST RESULTS');
  console.log('========================================\n');

  // TEST 1: GET all books
  let r = await request('GET', '/books/');
  const allBooks = JSON.parse(r.body);
  console.log('TEST 1: GET /books/');
  console.log('  Status:', r.status, r.status === 200 ? '✅' : '❌');
  console.log('  Books returned:', allBooks.length);

  // TEST 2: GET one book
  r = await request('GET', '/books/1/');
  console.log('\nTEST 2: GET /books/1/');
  console.log('  Status:', r.status, r.status === 200 ? '✅' : '❌');
  console.log('  Body:', r.body);

  // TEST 3: GET non-existing book (404)
  r = await request('GET', '/books/999/');
  console.log('\nTEST 3: GET /books/999/ (should be 404)');
  console.log('  Status:', r.status, r.status === 404 ? '✅' : '❌');
  console.log('  Body:', r.body);

  // TEST 4: POST new book
  r = await request('POST', '/books/', {
    title: 'Learning Node.js',
    author: 'John Smith',
    price: 450,
    pages: 320
  });
  const newBook = JSON.parse(r.body);
  console.log('\nTEST 4: POST /books/');
  console.log('  Status:', r.status, r.status === 201 ? '✅' : '❌');
  console.log('  Created Book:', r.body);

  // TEST 5: PUT update book
  r = await request('PUT', `/books/${newBook.id}/`, {
    title: 'Advanced Node.js',
    author: 'John Smith',
    price: 550,
    pages: 400
  });
  console.log('\nTEST 5: PUT /books/' + newBook.id + '/');
  console.log('  Status:', r.status, r.status === 200 ? '✅' : '❌');
  console.log('  Updated Book:', r.body);

  // TEST 6: PUT non-existing book (404)
  r = await request('PUT', '/books/999/', {
    title: 'Test', author: 'Test', price: 100, pages: 100
  });
  console.log('\nTEST 6: PUT /books/999/ (should be 404)');
  console.log('  Status:', r.status, r.status === 404 ? '✅' : '❌');

  // TEST 7: DELETE book
  r = await request('DELETE', `/books/${newBook.id}/`);
  console.log('\nTEST 7: DELETE /books/' + newBook.id + '/');
  console.log('  Status:', r.status, r.status === 200 ? '✅' : '❌');
  console.log('  Message:', r.body);

  // TEST 8: DELETE non-existing (404)
  r = await request('DELETE', '/books/999/');
  console.log('\nTEST 8: DELETE /books/999/ (should be 404)');
  console.log('  Status:', r.status, r.status === 404 ? '✅' : '❌');

  // TEST 9: POST with missing fields (400)
  r = await request('POST', '/books/', { title: 'Incomplete' });
  console.log('\nTEST 9: POST with missing fields (should be 400)');
  console.log('  Status:', r.status, r.status === 400 ? '✅' : '❌');

  console.log('\n========================================');
  console.log('   ALL TESTS COMPLETE');
  console.log('========================================');
  process.exit(0);
}

runTests().catch(e => { console.error(e); process.exit(1); });
