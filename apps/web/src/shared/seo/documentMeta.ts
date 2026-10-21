import { LANDING_PAGES } from '../../features/marketing/landingContent';

export type DocumentMetaConfig = {
    title: string;
    description?: string;
    robots: string;
    canonicalPath?: string;
};

const SITE_ORIGIN = 'https://toquocmanh.id.vn';
const SITE_NAME = 'TQM';
const DEFAULT_DESCRIPTION =
    'Phần mềm gọi món bằng QR cho quán ăn và nhà hàng. Quản lý thực đơn, đơn hàng realtime, POS thu ngân và màn hình bếp trên một hệ thống.';

const PUBLIC_HOME: DocumentMetaConfig = {
    title: `${SITE_NAME} | Phần mềm gọi món QR cho quán ăn, nhà hàng`,
    description: DEFAULT_DESCRIPTION,
    robots: 'index, follow',
    canonicalPath: '/',
};

const NOINDEX: Omit<DocumentMetaConfig, 'title'> = {
    robots: 'noindex, nofollow',
};

const LANDING_META = LANDING_PAGES.map((page) => ({
    match: (path: string) => path === page.path,
    meta: {
        title: page.metaTitle,
        description: page.metaDescription,
        robots: 'index, follow',
        canonicalPath: page.path,
    } satisfies DocumentMetaConfig,
}));

const ROUTE_META: Array<{ match: (path: string) => boolean; meta: DocumentMetaConfig }> = [
    {
        match: (path) => path === '/',
        meta: PUBLIC_HOME,
    },
    ...LANDING_META,
    {
        match: (path) => path === '/login' || path.startsWith('/login/'),
        meta: {
            title: `Đăng nhập | ${SITE_NAME}`,
            description: 'Đăng nhập phần mềm gọi món và quản lý nhà hàng TQM.',
            ...NOINDEX,
        },
    },
    {
        match: (path) => path === '/admin' || path.startsWith('/admin/'),
        meta: {
            title: `Quản trị nhà hàng | ${SITE_NAME}`,
            ...NOINDEX,
        },
    },
    {
        match: (path) => path === '/saas' || path.startsWith('/saas/'),
        meta: {
            title: `SaaS Admin | ${SITE_NAME}`,
            ...NOINDEX,
        },
    },
    {
        match: (path) => path === '/pos' || path.startsWith('/pos/'),
        meta: {
            title: `POS thu ngân | ${SITE_NAME}`,
            ...NOINDEX,
        },
    },
    {
        match: (path) => path === '/kitchen' || path.startsWith('/kitchen/'),
        meta: {
            title: `Màn hình bếp | ${SITE_NAME}`,
            ...NOINDEX,
        },
    },
    {
        match: (path) => path === '/customer' || path.startsWith('/customer/'),
        meta: {
            title: `Thực đơn gọi món | ${SITE_NAME}`,
            description: 'Thực đơn đặt món tại bàn bằng QR.',
            robots: 'noindex, nofollow',
        },
    },
];

function upsertMetaByName(name: string, content: string) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
    let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

export function getDocumentMeta(pathname: string): DocumentMetaConfig {
    const matched = ROUTE_META.find((route) => route.match(pathname));
    return (
        matched?.meta ?? {
            title: SITE_NAME,
            description: DEFAULT_DESCRIPTION,
            robots: 'noindex, nofollow',
        }
    );
}

export function getCanonicalUrl(canonicalPath: string) {
    return `${SITE_ORIGIN}${canonicalPath}`;
}

export function applyDocumentMeta(pathname: string) {
    const meta = getDocumentMeta(pathname);

    document.title = meta.title;
    if (meta.description) {
        upsertMetaByName('description', meta.description);
        upsertMetaByProperty('og:title', meta.title);
        upsertMetaByProperty('og:description', meta.description);
        upsertMetaByName('twitter:title', meta.title);
        upsertMetaByName('twitter:description', meta.description);
    }
    upsertMetaByName('robots', meta.robots);

    if (meta.canonicalPath) {
        const url = getCanonicalUrl(meta.canonicalPath);
        upsertCanonical(url);
        upsertMetaByProperty('og:url', url);
    }
}
