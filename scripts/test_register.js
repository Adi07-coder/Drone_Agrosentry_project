const http = require('http');

const postData = JSON.stringify({
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'password123',
  role: 'user',
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
  timeout: 5000,
};

const req = http.request(options, (res) => {
  let data = '';
  console.log('Status:', res.statusCode);
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => console.log('Body:', data));
});

req.on('error', (err) => console.error('Request error:', err.message));
req.on('timeout', () => { console.error('Request timed out'); req.abort(); });

req.write(postData);
req.end();

// Usage: node scripts/test_register.js
