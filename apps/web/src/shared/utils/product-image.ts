export type ImageVariant = 'thumbnail' | 'detail';

export type ProductImageSources = {
    src: string;
    srcSet?: string;
    sizes?: string;
};

const THUMBNAIL_WIDTHS = [200, 320];
const DETAIL_WIDTHS = [480, 720];

// Phone menu cards are about half the screen. Ask the CDN for that size only.
export function productImageSources(source: string, variant: ImageVariant): ProductImageSources {
    const widths = variant === 'detail' ? DETAIL_WIDTHS : THUMBNAIL_WIDTHS;
    const urls = widths.map((width) => resizeProductImage(source, variant, width));
    const src = urls[urls.length - 1];
    if (urls.every((url) => url === source)) return { src: source };
    return {
        src,
        srcSet: widths.map((width, index) => `${urls[index]} ${width}w`).join(', '),
        sizes: variant === 'detail'
            ? '(max-width: 600px) calc(100vw - 56px), 528px'
            : '(max-width: 599px) calc((100vw - 50px) / 2), 220px',
    };
}

export function productImageUrl(source: string, variant: ImageVariant): string {
    return productImageSources(source, variant).src;
}

function resizeProductImage(source: string, variant: ImageVariant, width: number): string {
    try {
        const url = new URL(source);
        if (url.hostname === 'images.unsplash.com') {
            url.searchParams.set('w', String(width));
            url.searchParams.set('auto', 'format');
            url.searchParams.set('q', variant === 'detail' ? '60' : '40');
            if (variant === 'thumbnail') {
                url.searchParams.set('h', String(thumbnailHeight(width)));
                url.searchParams.set('fit', 'crop');
                url.searchParams.set('crop', 'entropy');
            } else {
                url.searchParams.delete('h');
                url.searchParams.set('fit', 'max');
            }
            return url.toString();
        }
        if (url.hostname === 'res.cloudinary.com' && url.pathname.includes('/image/upload/') && !url.pathname.includes('/s--') && !url.searchParams.has('__cld_token__')) {
            const quality = variant === 'detail' ? 'eco' : 'low';
            const crop = variant === 'thumbnail'
                ? `c_fill,g_center,w_${width},h_${thumbnailHeight(width)}`
                : `c_limit,w_${width}`;
            return insertCloudinaryTransform(url, `${crop},q_auto:${quality},f_auto`);
        }
        if (url.hostname === 'commons.wikimedia.org' && url.pathname.startsWith('/wiki/Special:Redirect/file/')) {
            url.searchParams.set('width', String(width));
            return url.toString();
        }
    } catch { /* Preserve unknown or invalid sources for the image fallback. */ }
    return source;
}

function thumbnailHeight(width: number): number {
    return Math.round(width * 4 / 5);
}

function insertCloudinaryTransform(url: URL, transform: string): string {
    const marker = '/image/upload/';
    const [prefix, rest] = url.pathname.split(marker);
    const segments = rest.split('/');
    let index = 0;
    while (index < segments.length - 1 && /^[a-z][a-z0-9]*_/.test(segments[index]) && !/^v\d+$/.test(segments[index])) index++;
    segments.splice(index, 0, transform);
    url.pathname = prefix + marker + segments.join('/');
    return url.toString();
}
