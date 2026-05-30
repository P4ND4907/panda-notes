const defaultAllowedOrigins = [
  'https://p4nd4907.github.io',
  'https://panda-notes.vercel.app',
  'http://127.0.0.1:5173',
  'http://localhost:5173'
];

export function applyCors(request, response) {
  const origin = request.headers.origin || '';
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');
}

export function handleOptions(request, response) {
  if (request.method !== 'OPTIONS') return false;
  applyCors(request, response);
  response.statusCode = 204;
  response.end();
  return true;
}

export function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export async function parseJsonRequest(request, maxBytes = 32_000) {
  if (request.body && typeof request.body === 'object') return request.body;
  const raw = await readRawBody(request, maxBytes);
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

export function readRawBody(request, maxBytes = 64_000) {
  return new Promise((resolve, reject) => {
    if (typeof request.body === 'string') {
      if (Buffer.byteLength(request.body) > maxBytes) {
        reject(new Error('request_too_large'));
        return;
      }
      resolve(request.body);
      return;
    }

    const chunks = [];
    let totalBytes = 0;
    request.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        reject(new Error('request_too_large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

function getAllowedOrigins() {
  const configured = process.env.PANDA_ALLOWED_ORIGINS;
  if (!configured) return defaultAllowedOrigins;
  return configured.split(',').map((origin) => origin.trim()).filter(Boolean);
}
