import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(new URL('../public', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const reportPath = resolve(tmpdir(), 'panda-notes-services-lighthouse.json');
const thresholds = {
  accessibility: 0.95,
  'best-practices': 0.9,
  performance: 0.9,
  seo: 0.95
};

const server = createServer(async (request, response) => {
  const cleanPath = decodeURIComponent((request.url || '/').split('?')[0]);
  const relativePath = cleanPath === '/' ? 'services.html' : cleanPath.replace(/^\//, '');
  const filePath = resolve(root, relativePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('forbidden');
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      'content-type': filePath.endsWith('.json')
        ? 'application/json'
        : filePath.endsWith('.xml')
          ? 'application/xml'
          : 'text/html'
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('missing');
  }
});

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));

try {
  const url = `http://127.0.0.1:${server.address().port}/services.html`;
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const lighthouse = await runCommand(npxCommand, [
    '--yes',
    'lighthouse',
    url,
    '--output=json',
    `--output-path=${reportPath}`,
    '--chrome-flags=--headless --no-sandbox --disable-gpu',
    '--quiet'
  ]);

  if (!existsSync(reportPath)) {
    throw new Error(`Lighthouse did not write a report.\n${lighthouse.stderr}`);
  }

  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const categoryScores = Object.fromEntries(
    Object.entries(report.categories).map(([key, value]) => [key, value.score])
  );
  const summary = {
    url,
    reportPath,
    scores: Object.fromEntries(
      Object.entries(categoryScores).map(([key, value]) => [key, Math.round(value * 100)])
    ),
    metrics: {
      cumulativeLayoutShift: report.audits['cumulative-layout-shift']?.displayValue,
      firstContentfulPaint: report.audits['first-contentful-paint']?.displayValue,
      largestContentfulPaint: report.audits['largest-contentful-paint']?.displayValue,
      speedIndex: report.audits['speed-index']?.displayValue,
      totalBlockingTime: report.audits['total-blocking-time']?.displayValue
    },
    lighthouseExitCode: lighthouse.code
  };

  console.log(JSON.stringify(summary, null, 2));

  const failures = Object.entries(thresholds)
    .filter(([key, minimum]) => (categoryScores[key] || 0) < minimum)
    .map(([key, minimum]) => `${key} ${Math.round((categoryScores[key] || 0) * 100)} < ${Math.round(minimum * 100)}`);

  if (failures.length) {
    throw new Error(`Lighthouse thresholds failed: ${failures.join('; ')}`);
  }

  if (lighthouse.code !== 0) {
    console.warn(`Lighthouse exited with code ${lighthouse.code}, but the report was valid and thresholds passed.`);
  }
} finally {
  server.close();
}

function runCommand(command, args) {
  return new Promise((resolveRun) => {
    const child = process.platform === 'win32'
      ? spawn([command, ...args.map(quoteShellArg)].join(' '), [], {
        cwd: resolve(root, '..'),
        shell: true
      })
      : spawn(command, args, {
        cwd: resolve(root, '..'),
        shell: false
      });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      resolveRun({ code, stderr, stdout });
    });
  });
}

function quoteShellArg(value) {
  if (!/[\s"`]/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}
