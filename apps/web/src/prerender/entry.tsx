import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { getLandingByPath, MARKETING_PATHS } from '../features/marketing/landingContent';
import { getCanonicalUrl, getDocumentMeta } from '../shared/seo/documentMeta';

export const PRERENDER_ROUTES = ['/', ...MARKETING_PATHS] as const;

export type PrerenderResult = {
    html: string;
    title: string;
    description: string;
    robots: string;
    canonical?: string;
    faqJsonLd?: string;
};

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

export function render(url: string): PrerenderResult {
    const pathname = url.startsWith('/') ? url : `/${url}`;
    const isMarketing = pathname === '/' || MARKETING_PATHS.includes(pathname);

    if (!isMarketing) {
        throw new Error(`Route is not prerenderable: ${pathname}`);
    }

    // Keep the same component tree as the browser entry (Router -> App)
    // so hydrateRoot can reuse the prerendered markup.
    const html = renderToString(
        <MemoryRouter initialEntries={[pathname]}>
            <App />
        </MemoryRouter>,
    );

    const meta = getDocumentMeta(pathname);
    const landing = getLandingByPath(pathname);
    const faqJsonLd = landing
        ? JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: landing.faqs.map((faq) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: {
                      '@type': 'Answer',
                      text: faq.answer,
                  },
              })),
          })
        : undefined;

    return {
        html,
        title: meta.title,
        description: meta.description ?? '',
        robots: meta.robots,
        canonical: meta.canonicalPath ? getCanonicalUrl(meta.canonicalPath) : undefined,
        faqJsonLd,
    };
}

export function applyHeadToTemplate(template: string, result: PrerenderResult) {
    let page = template;

    page = page.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(result.title)}</title>`);

    page = page.replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
        `<meta name="description" content="${escapeHtml(result.description)}" />`,
    );

    page = page.replace(
        /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/,
        `<meta name="robots" content="${escapeHtml(result.robots)}" />`,
    );

    if (result.canonical) {
        page = page.replace(
            /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
            `<link rel="canonical" href="${escapeHtml(result.canonical)}" />`,
        );
        page = page.replace(
            /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
            `<meta property="og:url" content="${escapeHtml(result.canonical)}" />`,
        );
    }

    page = page.replace(
        /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
        `<meta property="og:title" content="${escapeHtml(result.title)}" />`,
    );
    page = page.replace(
        /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
        `<meta property="og:description" content="${escapeHtml(result.description)}" />`,
    );
    page = page.replace(
        /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
        `<meta name="twitter:title" content="${escapeHtml(result.title)}" />`,
    );
    page = page.replace(
        /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
        `<meta name="twitter:description" content="${escapeHtml(result.description)}" />`,
    );

    if (result.faqJsonLd) {
        const faqScript = `<script type="application/ld+json" id="tqm-landing-faq-jsonld">${result.faqJsonLd}</script>`;
        page = page.replace('</head>', `    ${faqScript}\n  </head>`);
    }

    if (!page.includes('<div id="root"></div>')) {
        throw new Error('Built index.html is missing <div id="root"></div>');
    }

    page = page.replace('<div id="root"></div>', `<div id="root">${result.html}</div>`);
    return page;
}
