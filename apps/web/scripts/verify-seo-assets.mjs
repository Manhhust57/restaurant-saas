import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

const REQUIRED_ASSETS = [
  'site.webmanifest',
  'browserconfig.xml',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'favicon-64x64.png',
  'favicon-96x96.png',
  'apple-touch-icon.png',
  'apple-touch-icon-180x180.png',
  'apple-touch-icon-167x167.png',
  'apple-touch-icon-152x152.png',
  'apple-touch-icon-144x144.png',
  'apple-touch-icon-120x120.png',
  'apple-touch-icon-114x114.png',
  'apple-touch-icon-76x76.png',
  'apple-touch-icon-72x72.png',
  'apple-touch-icon-60x60.png',
  'apple-touch-icon-57x57.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'mstile-70x70.png',
  'mstile-144x144.png',
  'mstile-150x150.png',
  'mstile-310x310.png',
  'og-image.png',
  'robots.txt',
  'sitemap.xml',
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

async function assertFile(filePath, label) {
  try {
    await readFile(filePath);
  } catch {
    fail(`${label} missing: ${filePath}`);
  }
}

const indexHtml = await readFile(path.join(root, 'index.html'), 'utf8');
const jsonBlocks = [...indexHtml.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
  (m) => m[1],
);

if (!jsonBlocks.length) fail('index.html missing JSON-LD');

let hasOrganization = false;
let hasSoftware = false;
let hasWebsite = false;

for (const block of jsonBlocks) {
  const data = JSON.parse(block);
  const nodes = data['@graph'] || [data];
  for (const node of nodes) {
    if (node['@type'] === 'Organization') hasOrganization = true;
    if (node['@type'] === 'SoftwareApplication') hasSoftware = true;
    if (node['@type'] === 'WebSite') hasWebsite = true;
  }
}

if (!hasOrganization) fail('JSON-LD missing Organization');
if (!hasSoftware) fail('JSON-LD missing SoftwareApplication');
if (!hasWebsite) fail('JSON-LD missing WebSite');

if (!indexHtml.includes('href="/site.webmanifest"')) fail('missing manifest link');
if (!indexHtml.includes('content="/browserconfig.xml"')) fail('missing browserconfig meta');
if (!indexHtml.includes('href="/favicon.ico"')) fail('missing favicon.ico link');

for (const asset of REQUIRED_ASSETS) {
  await assertFile(path.join(publicDir, asset), 'public asset');
}

const manifest = JSON.parse(await readFile(path.join(publicDir, 'site.webmanifest'), 'utf8'));
if (!manifest.icons?.length) fail('manifest has no icons');

for (const icon of manifest.icons) {
  const iconPath = path.join(publicDir, icon.src.replace(/^\//, ''));
  await assertFile(iconPath, `manifest icon ${icon.src}`);
}

if (process.exitCode) {
  console.error('SEO asset verification failed');
  process.exit(process.exitCode);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      schema: ['Organization', 'SoftwareApplication', 'WebSite'],
      publicAssets: REQUIRED_ASSETS.length,
      manifestIcons: manifest.icons.length,
    },
    null,
    2,
  ),
);
