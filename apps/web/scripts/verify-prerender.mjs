import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = 'http://127.0.0.1:4173';
const routes = ['/', '/phan-mem-goi-mon-qr', '/phan-mem-quan-ly-nha-hang', '/pos-nha-hang'];

const server = spawn(process.execPath, [path.join(__dirname, 'serve-dist.mjs')], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
});

await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server start timeout')), 10000);
    server.stdout.on('data', (chunk) => {
        if (String(chunk).includes('serving dist')) {
            clearTimeout(timer);
            resolve();
        }
    });
    server.stderr.on('data', (chunk) => process.stderr.write(chunk));
    server.on('exit', (code) => reject(new Error(`server exited ${code}`)));
});

let failed = false;

try {
    for (const route of routes) {
        const res = await fetch(`${base}${route}`);
        const html = await res.text();
        const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
        const hasH1 = /<h1[\s>]/.test(html);
        const rootFilled = /<div id="root">\s*</.test(html);
        const ok = res.status === 200 && hasH1 && rootFilled;
        if (!ok) failed = true;
        console.log(JSON.stringify({ check: 'raw', route, status: res.status, hasH1, rootFilled, title }));
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    for (const route of routes) {
        pageErrors.length = 0;
        await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
        const h1 = await page.locator('h1').first().innerText();
        const title = await page.title();
        const hydrationError = pageErrors.find((msg) => msg.includes('Minified React error #418') || msg.includes('Hydration'));
        if (hydrationError) failed = true;
        console.log(
            JSON.stringify({
                check: 'hydrated',
                route,
                title,
                h1,
                hydrationError: hydrationError || null,
            }),
        );
    }

    await browser.close();
} finally {
    server.kill('SIGTERM');
}

if (failed) process.exit(1);
console.log('prerender verification passed');
