const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'E-Commerce API running on EKS',
    version: process.env.APP_VERSION || 'dev'
  }));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
