import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const ssrOutDir = path.join(root, 'dist-ssr');

async function main() {
    const templatePath = path.join(distDir, 'index.html');
    const template = await readFile(templatePath, 'utf8');

    await build({
        configFile: path.join(root, 'vite.config.ts'),
        root,
        mode: 'production',
        logLevel: 'error',
        build: {
            ssr: path.join(root, 'src/prerender/entry.tsx'),
            outDir: ssrOutDir,
            emptyOutDir: true,
            sourcemap: false,
            minify: false,
        },
    });

    const entryPath = path.join(ssrOutDir, 'entry.js');
    const { PRERENDER_ROUTES, render, applyHeadToTemplate } = await import(
        pathToFileURL(entryPath).href
    );

    for (const route of PRERENDER_ROUTES) {
        const result = render(route);
        const pageHtml = applyHeadToTemplate(template, result);

        if (route === '/') {
            const outputPath = path.join(distDir, 'index.html');
            await writeFile(outputPath, pageHtml, 'utf8');
            console.log(`prerendered ${route} -> ${path.relative(root, outputPath)}`);
            continue;
        }

        const slug = route.slice(1);
        const dirIndexPath = path.join(distDir, slug, 'index.html');
        const flatHtmlPath = path.join(distDir, `${slug}.html`);

        await mkdir(path.dirname(dirIndexPath), { recursive: true });
        await writeFile(dirIndexPath, pageHtml, 'utf8');
        await writeFile(flatHtmlPath, pageHtml, 'utf8');
        console.log(
            `prerendered ${route} -> ${path.relative(root, dirIndexPath)} + ${path.relative(root, flatHtmlPath)}`,
        );
    }

    await rm(ssrOutDir, { recursive: true, force: true });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
