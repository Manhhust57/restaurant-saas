import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 4173);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.xml': 'application/xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
};

async function resolveFile(urlPath) {
    const clean = decodeURIComponent(urlPath.split('?')[0]);
    const candidates = [
        path.join(distDir, clean),
        path.join(distDir, `${clean}.html`),
        path.join(distDir, clean, 'index.html'),
    ];

    if (clean === '/' || clean === '') {
        return path.join(distDir, 'index.html');
    }

    for (const candidate of candidates) {
        try {
            const info = await stat(candidate);
            if (info.isFile()) return candidate;
            if (info.isDirectory()) {
                const nested = path.join(candidate, 'index.html');
                const nestedInfo = await stat(nested);
                if (nestedInfo.isFile()) return nested;
            }
        } catch {
            // try next
        }
    }

    return path.join(distDir, 'index.html');
}

createServer(async (req, res) => {
    try {
        const filePath = await resolveFile(req.url || '/');
        const body = await readFile(filePath);
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(body);
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(String(error));
    }
}).listen(port, '127.0.0.1', () => {
    console.log(`serving dist at http://127.0.0.1:${port}`);
});
