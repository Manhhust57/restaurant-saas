import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import styles from './ProductForm.module.css';

const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 960;

type Size = { width: number; height: number };
type Point = { x: number; y: number };

function coverScale(frame: Size, image: Size) {
    return Math.max(frame.width / image.width, frame.height / image.height);
}

function clampOffset(frame: Size, image: Size, scale: number, offset: Point): Point {
    const minX = Math.min(0, frame.width - image.width * scale);
    const minY = Math.min(0, frame.height - image.height * scale);
    return {
        x: Math.min(0, Math.max(minX, offset.x)),
        y: Math.min(0, Math.max(minY, offset.y)),
    };
}

export default function ImageCropDialog({ file, onCancel, onConfirm }: { file: File; onCancel: () => void; onConfirm: (file: File) => void }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const dragRef = useRef<{ x: number; y: number; offset: Point } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState<Size>({ width: 0, height: 0 });
    const [frameSize, setFrameSize] = useState<Size>({ width: 0, height: 0 });
    const [frameTop, setFrameTop] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) dialog.showModal();
        const reader = new FileReader();
        let cancelled = false;
        reader.onload = () => {
            if (!cancelled && typeof reader.result === 'string') setPreviewUrl(reader.result);
        };
        reader.onerror = () => {
            if (!cancelled) setError('Không đọc được ảnh này.');
        };
        reader.readAsDataURL(file);
        return () => { cancelled = true; };
    }, [file]);

    function placeImage(nextImage: Size, nextFrame: Size, top: number) {
        const scale = coverScale(nextFrame, nextImage);
        setImageSize(nextImage);
        setFrameSize(nextFrame);
        setFrameTop(top);
        setZoom(1);
        setOffset({
            x: (nextFrame.width - nextImage.width * scale) / 2,
            y: (nextFrame.height - nextImage.height * scale) / 2,
        });
    }

    function measure() {
        const image = imageRef.current;
        const frame = frameRef.current;
        if (!image?.naturalWidth || !image.naturalHeight || !frame?.clientWidth || !frame.clientHeight) return;
        placeImage(
            { width: image.naturalWidth, height: image.naturalHeight },
            { width: frame.clientWidth, height: frame.clientHeight },
            frame.offsetTop,
        );
    }

    function changeZoom(nextZoom: number) {
        if (!frameSize.width || !imageSize.width) {
            setZoom(nextZoom);
            return;
        }
        const base = coverScale(frameSize, imageSize);
        const previous = base * zoom;
        const next = base * nextZoom;
        setZoom(nextZoom);
        setOffset(clampOffset(frameSize, imageSize, next, {
            x: frameSize.width / 2 - ((frameSize.width / 2 - offset.x) / previous) * next,
            y: frameSize.height / 2 - ((frameSize.height / 2 - offset.y) / previous) * next,
        }));
    }

    function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { x: event.clientX, y: event.clientY, offset };
    }

    function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        const drag = dragRef.current;
        if (!drag || !frameSize.width || !imageSize.width) return;
        const scale = coverScale(frameSize, imageSize) * zoom;
        setOffset(clampOffset(frameSize, imageSize, scale, {
            x: drag.offset.x + event.clientX - drag.x,
            y: drag.offset.y + event.clientY - drag.y,
        }));
    }

    function onPointerUp() {
        dragRef.current = null;
    }

    async function confirmCrop() {
        const image = imageRef.current;
        if (!image || !frameSize.width || !imageSize.width) return;
        setSaving(true);
        setError('');
        try {
            const scale = coverScale(frameSize, imageSize) * zoom;
            let sourceX = -offset.x / scale;
            let sourceY = -offset.y / scale;
            let sourceWidth = frameSize.width / scale;
            let sourceHeight = frameSize.height / scale;
            if (sourceX < 0) { sourceWidth += sourceX; sourceX = 0; }
            if (sourceY < 0) { sourceHeight += sourceY; sourceY = 0; }
            sourceWidth = Math.min(sourceWidth, imageSize.width - sourceX);
            sourceHeight = Math.min(sourceHeight, imageSize.height - sourceY);
            const canvas = document.createElement('canvas');
            canvas.width = OUTPUT_WIDTH;
            canvas.height = OUTPUT_HEIGHT;
            const context = canvas.getContext('2d');
            if (!context || sourceWidth <= 0 || sourceHeight <= 0) throw new Error('crop');
            context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            if (!blob || blob.size > 5 * 1024 * 1024) throw new Error('crop');
            onConfirm(new File([blob], 'mon-an.jpg', { type: 'image/jpeg' }));
        } catch {
            setError('Không cắt được ảnh. Thử lại.');
            setSaving(false);
        }
    }

    const scale = frameSize.width && imageSize.width ? coverScale(frameSize, imageSize) * zoom : 0;
    const photoStyle = scale ? {
        width: imageSize.width * scale,
        height: imageSize.height * scale,
        left: offset.x,
        top: frameTop + offset.y,
    } : undefined;

    return (
        <dialog ref={dialogRef} className={styles.cropDialog} aria-labelledby="crop-title" onCancel={(event) => { event.preventDefault(); onCancel(); }}>
            <h4 id="crop-title">Căn ảnh món</h4>
            <p>Vuốt lên hoặc xuống để căn ảnh. Phần rõ ở giữa là phần khách sẽ thấy. Phần mờ phía trên và dưới sẽ bị cắt.</p>
            <div
                className={styles.cropStage}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            >
                {previewUrl && (
                    <img
                        className={styles.cropBlur}
                        src={previewUrl}
                        alt=""
                        draggable={false}
                        style={photoStyle}
                    />
                )}
                <div ref={frameRef} className={styles.cropWindow}>
                    {previewUrl && (
                        <img
                            ref={imageRef}
                            src={previewUrl}
                            alt=""
                            draggable={false}
                            onLoad={measure}
                            onError={() => setError('Không đọc được ảnh này.')}
                            style={scale ? { width: imageSize.width * scale, height: imageSize.height * scale, left: offset.x, top: offset.y } : undefined}
                        />
                    )}
                </div>
            </div>
            <label className={styles.zoomLabel}>
                Phóng to
                <input type="range" min={1} max={3} step={0.01} value={zoom} disabled={!imageSize.width || saving} onChange={(event) => changeZoom(Number(event.target.value))} />
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            <div className={styles.cropActions}>
                <button type="button" className={styles.cropCancel} onClick={onCancel} disabled={saving}>Hủy</button>
                <button type="button" onClick={() => void confirmCrop()} disabled={!imageSize.width || saving}>{saving ? 'Đang lưu…' : 'Dùng ảnh này'}</button>
            </div>
        </dialog>
    );
}
