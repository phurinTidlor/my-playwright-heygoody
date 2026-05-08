/**
 * Heygoody Test Runner — เว็บ UI สำหรับเลือก/รัน Playwright test ทีละ flow
 *
 * Usage: node runner/server.js   (default port 3333)
 * แล้วเปิดเว็บที่ http://localhost:3333
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PORT = process.env.RUNNER_PORT || 3333;

const IGNORE_DIRS = new Set([
    'node_modules', '.git', 'test-results', 'playwright-report',
    'blob-report', 'playwright', 'runner', '.github',
]);

function findTestFiles() {
    const testsDir = path.join(PROJECT_ROOT, 'tests');
    const files = [];

    function scan(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name.startsWith('.') || IGNORE_DIRS.has(entry.name)) continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                scan(full);
            } else if (entry.isFile() && /\.spec\.(js|ts)$/.test(entry.name)) {
                files.push(path.relative(PROJECT_ROOT, full));
            }
        }
    }

    if (fs.existsSync(testsDir)) scan(testsDir);
    return files.sort();
}

function parseTestsFromFile(relPath) {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf-8');
    // จับเฉพาะ test('...') / test("...") ที่อยู่ต้นบรรทัด (ไม่นับ test.skip / test.describe etc.)
    const regex = /^\s*test\(\s*['"`]([^'"`]+)['"`]/gm;
    const tests = [];
    let m;
    while ((m = regex.exec(content)) !== null) {
        tests.push(m[1]);
    }
    return tests;
}

function send(res, status, body, contentType = 'application/json') {
    res.writeHead(status, { 'Content-Type': contentType });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
    // Serve UI
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        return send(res, 200, html, 'text/html; charset=utf-8');
    }

    // List tests
    if (req.method === 'GET' && req.url === '/api/tests') {
        const files = findTestFiles().map(f => ({
            path: f,
            tests: parseTestsFromFile(f),
        }));
        return send(res, 200, files);
    }

    // Run test (SSE stream)
    if (req.method === 'GET' && req.url.startsWith('/api/run')) {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const file = url.searchParams.get('file');
        const test = url.searchParams.get('test'); // optional — if omitted, runs whole file
        const project = url.searchParams.get('project') || 'chromium';

        if (!file) {
            return send(res, 400, { error: 'Missing file parameter' });
        }

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        const sse = (event, data) => {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        sse('start', { file, test, project });

        const args = ['playwright', 'test', file, '--project', project];
        if (test) args.push('--grep', test);
        const child = spawn('npx', args, {
            cwd: PROJECT_ROOT,
            env: { ...process.env, FORCE_COLOR: '0' },
        });

        child.stdout.on('data', chunk => sse('output', chunk.toString()));
        child.stderr.on('data', chunk => sse('output', chunk.toString()));
        child.on('close', code => {
            sse('done', { code });
            res.end();
        });

        // ถ้า client ปิด → kill child
        req.on('close', () => {
            if (!child.killed) child.kill('SIGTERM');
        });

        return;
    }

    send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
    console.log(`🚀 Heygoody Test Runner: http://localhost:${PORT}`);
});