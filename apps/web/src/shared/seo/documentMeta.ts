export type DocumentMetaConfig = {
    title: string;
    description?: string;
    robots: string;
};

const SITE_NAME = 'TQM Integrated';
const DEFAULT_DESCRIPTION =
    'Giải pháp quản lý nhà hàng với gọi món bằng QR, quản lý thực đơn, đơn hàng và quy trình bếp trên một nền tảng.';

const PUBLIC_HOME: DocumentMetaConfig = {
    title: `${SITE_NAME} | Nền tảng quản lý nhà hàng`,
    description: DEFAULT_DESCRIPTION,
    robots: 'index, follow',
};

const NOINDEX: Omit<DocumentMetaConfig, 'title'> = {
    robots: 'noindex, nofollow',
};

const ROUTE_META: Array<{ match: (path: string) => boolean; meta: DocumentMetaConfig }> = [
    {
        match: (path) => path === '/',
        meta: PUBLIC_HOME,
    },
    {
        match: (path) => path === '/login' || path.startsWith('/login/'),
        meta: {
            title: `Đăng nhập | ${SITE_NAME}`,
            description: 'Đăng nhập vào hệ thống quản lý nhà hàng TQM Integrated.',
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
            title: `POS | ${SITE_NAME}`,
            ...NOINDEX,
        },
    },
    {
        match: (path) => path === '/kitchen' || path.startsWith('/kitchen/'),
        meta: {
            title: `Bếp | ${SITE_NAME}`,
            ...NOINDEX,
        },
    },
    {
        match: (path) => path === '/customer' || path.startsWith('/customer/'),
        meta: {
            title: `Thực đơn | ${SITE_NAME}`,
            description: 'Thực đơn đặt món tại bàn.',
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

export function applyDocumentMeta(pathname: string) {
    const matched = ROUTE_META.find((route) => route.match(pathname));
    const meta = matched?.meta ?? {
        title: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        robots: 'noindex, nofollow',
    };

    document.title = meta.title;
    if (meta.description) {
        upsertMetaByName('description', meta.description);
    }
    upsertMetaByName('robots', meta.robots);
}
