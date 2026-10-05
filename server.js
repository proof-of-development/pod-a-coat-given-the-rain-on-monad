'use strict';

const http = require('http');

const PORT = 3000;
const HOST = '0.0.0.0';

const RAINING = new Set(['yes', 'true']);
const DRY = new Set(['no', 'false']);

function send(res, status, body, headOnly) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  res.end(headOnly ? undefined : payload);
}

const server = http.createServer((req, res) => {
  const headOnly = req.method === 'HEAD';

  if (req.method !== 'GET' && !headOnly) {
    res.setHeader('Allow', 'GET, HEAD');
    send(res, 405, { error: 'Method not allowed. Use GET.' }, false);
    return;
  }

  let values;
  try {
    const url = new URL(req.url, 'http://localhost');
    values = url.searchParams.getAll('raining');
  } catch (err) {
    send(res, 400, { error: 'The request URL could not be read.' }, headOnly);
    return;
  }

  if (values.length === 0) {
    send(
      res,
      400,
      { error: 'Missing query parameter "raining". Use raining=yes or raining=no.' },
      headOnly
    );
    return;
  }

  if (values.length > 1) {
    send(
      res,
      400,
      { error: 'Query parameter "raining" must be given exactly once.' },
      headOnly
    );
    return;
  }

  const value = values[0].trim().toLowerCase();

  if (RAINING.has(value)) {
    send(
      res,
      200,
      { coat: true, advice: 'It is raining, so take a coat.' },
      headOnly
    );
    return;
  }

  if (DRY.has(value)) {
    send(
      res,
      200,
      { coat: false, advice: 'It is dry, so no coat is needed and the umbrella can stay at home.' },
      headOnly
    );
    return;
  }

  send(
    res,
    400,
    { error: 'Invalid value for "raining". Use yes, no, true or false.' },
    headOnly
  );
});

server.on('clientError', (err, socket) => {
  if (socket.writable) {
    socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
  } else {
    socket.destroy();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Listening on http://${HOST}:${PORT}`);
});
