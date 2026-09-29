const http = require('http');

const PORT = 8080;
const TARGET_HOST = 'http://localhost:3000';

const server = http.createServer((req, res) => {
  const targetUrl = new URL(req.url, TARGET_HOST);
  console.log(`[OAuth Bridge 8080] Received request: ${req.url} -> Redirecting to ${targetUrl.toString()}`);
  
  res.writeHead(302, {
    Location: targetUrl.toString(),
  });
  res.end();
});

server.listen(PORT, () => {
  console.log(`[OAuth Bridge] Active and listening on http://localhost:${PORT}`);
  console.log(`[OAuth Bridge] Forwarding all incoming OAuth callbacks to ${TARGET_HOST}`);
});
