import { useState } from 'react';
import styles from './ProductImage.module.css';
import { productImageSources, type ImageVariant } from '../utils/product-image';

export default function ProductImage({ src, name, variant = 'thumbnail', priority = false }: { src?: string | null; name: string; variant?: ImageVariant; priority?: boolean }) {
    const [failedSource, setFailedSource] = useState<string>();
    const source = src?.trim();
    const image = source ? productImageSources(source, variant) : undefined;
    const validUrl = image && /^https?:\/\//i.test(image.src);

    return <div className={styles.frame}>
        {validUrl && image && failedSource !== image.src ? (
            <img
                src={image.src}
                srcSet={image.srcSet}
                sizes={image.sizes}
                alt={name}
                width={variant === 'detail' ? 720 : 320}
                height={variant === 'detail' ? 720 : 256}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setFailedSource(image.src)}
            />
        ) : (
            <span className={styles.placeholder} role="img" aria-label={`${name}: chưa có ảnh`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8" cy="8" r="1.5" />
                    <path d="m3 17 5-5 4 4 3-3 6 6" />
                </svg>
                <small>Chưa có ảnh</small>
            </span>
        )}
    </div>;
}
