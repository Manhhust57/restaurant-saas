import { useState, type FormEvent, type Dispatch, type SetStateAction } from 'react';
import { uploadProductImage } from './product.api';
import styles from '../MerchantAdminPage.module.css';
import type { Category } from '../merchant.types';
import ProductImage from '../../../shared/components/ProductImage';
import ImageCropDialog from './ImageCropDialog';
import imageStyles from './ProductForm.module.css';
export type ProductFormValue = { categoryId: string; name: string; description: string; price: string; imageUrl: string };
export default function ProductForm({ product, setProduct, categories, saving, onSubmit }: { product: ProductFormValue; setProduct: Dispatch<SetStateAction<ProductFormValue>>; categories: Category[]; saving: boolean; onSubmit: (event: FormEvent) => void }) {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [cropSource, setCropSource] = useState<File | null>(null);

    function chooseFile(file?: File) {
        if (!file) return;
        setUploadError('');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
            setUploadError('Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB.');
            return;
        }
        setCropSource(file);
    }

    async function upload(file: File) {
        setCropSource(null);
        setUploading(true);
        try {
            const result = await uploadProductImage(file);
            setProduct(current => ({ ...current, imageUrl: result.imageUrl }));
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'Không upload được ảnh.');
        } finally { setUploading(false); }
    }

    return (<>
                <form className={styles['admin-form']} onSubmit={event => { if (uploading || saving || cropSource) event.preventDefault(); else onSubmit(event); }}>
                    <h4>Thêm món ăn</h4>
                    <label>Danh mục<select value={product.categoryId} onChange={(event) => setProduct({ ...product, categoryId: event.target.value })} required>
                        <option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select></label>
                    <label>Tên món<input value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} required /></label>
                    <div className={styles['field-row']}><label>Giá<input type="number" min={0} step="0.01" value={product.price} onChange={(event) => setProduct({ ...product, price: event.target.value })} required /></label><label>Mô tả<input value={product.description} onChange={(event) => setProduct({ ...product, description: event.target.value })} /></label></div>
                    <label>Ảnh món ăn<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || saving} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; chooseFile(file); }} /></label>
                    <small>JPG, PNG hoặc WebP · tối đa 5 MB · căn khung 5:4 trước khi lưu</small>
                    {uploading && <p role="status">Đang upload ảnh…</p>}
                    {uploadError && <p className="error" role="alert">{uploadError}</p>}
                    {product.imageUrl.trim() && <div className={imageStyles.preview}><ProductImage src={product.imageUrl} name={product.name || 'Ảnh xem trước'} /></div>}
                    <button type="submit" disabled={saving || uploading || !categories.length}>Thêm món</button>
                </form>
                {cropSource && <ImageCropDialog file={cropSource} onCancel={() => setCropSource(null)} onConfirm={(file) => void upload(file)} />}
                </>); }
