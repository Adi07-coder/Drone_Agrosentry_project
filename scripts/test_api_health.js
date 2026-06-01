const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  let data = '';
  console.log('Status:', res.statusCode);
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Body:', data);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.on('timeout', () => {
  console.error('Request timed out');
  req.abort();
});

req.end();

// Usage: node scripts/test_api_health.js
