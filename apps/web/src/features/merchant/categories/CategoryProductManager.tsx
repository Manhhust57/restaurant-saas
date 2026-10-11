import ProductList from '../products/ProductList';
import CategoryList from './CategoryList';
import ProductForm from '../products/ProductForm';
import CategoryForm from './CategoryForm';
import styles from '../MerchantAdminPage.module.css';
import { FormEvent, useEffect, useState } from 'react';
import { listCategories, createCategory as createCategoryRequest, deactivateCategory } from './category.api';
import { listProducts, createProduct as createProductRequest, deactivateProduct } from '../products/product.api';
import type { Category, Product } from '../merchant.types';
export default function MenuManager({ role }: { role: string }) {
    const canManage = role === 'OWNER' || role === 'MANAGER';
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categoryName, setCategoryName] = useState('');
    const [product, setProduct] = useState({ categoryId: '', name: '', description: '', price: '', imageUrl: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    async function reload() {
        const [nextCategories, nextProducts] = await Promise.all([
            listCategories(),
            listProducts(),
        ]);
        setCategories(nextCategories);
        setProducts(nextProducts);
        setProduct((current) => ({
            ...current,
            categoryId: nextCategories.some((category) => category.id === current.categoryId)
                ? current.categoryId
                : nextCategories[0]?.id || '',
        }));
    }

    useEffect(() => {
        reload().catch((requestError: Error) => setError(requestError.message)).finally(() => setLoading(false));
    }, []);

    async function run(action: () => Promise<void>) {
        setSaving(true);
        setError('');
        setNotice('');
        try { await action(); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Không thực hiện được thao tác.'); }
        finally { setSaving(false); }
    }

    function createCategory(event: FormEvent) {
        event.preventDefault();
        void run(async () => {
            await createCategoryRequest({ name: categoryName.trim() });
            setCategoryName('');
            setNotice('Đã tạo danh mục.');
            await reload();
        });
    }

    function createProduct(event: FormEvent) {
        event.preventDefault();
        void run(async () => {
            await createProductRequest({ categoryId: product.categoryId, name: product.name.trim(), description: product.description.trim() || null, price: Number(product.price), imageUrl: product.imageUrl.trim() || null });
            setProduct((current) => ({ ...current, name: '', description: '', price: '', imageUrl: '' }));
            setNotice('Đã tạo món ăn.');
            await reload();
        });
    }

    function hideCategory(category: Category) {
        if (!window.confirm(`Ẩn danh mục ${category.name}? Các món trong danh mục cũng bị ẩn.`)) return;
        void run(async () => {
            await deactivateCategory(category.id);
            setNotice(`Đã ẩn danh mục ${category.name}.`);
            await reload();
        });
    }

    function hideProduct(item: Product) {
        if (!window.confirm(`Ẩn món ${item.name}? Khách và POS sẽ không còn thấy món này.`)) return;
        void run(async () => {
            await deactivateProduct(item.id);
            setNotice(`Đã ẩn món ${item.name}.`);
            await reload();
        });
    }

    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    return (
        <section className={[styles['admin-panel'], 'menu-admin-panel'].join(' ')}>
            <h3>Danh mục & món ăn</h3>
            {error && <div className={['error', styles['admin-message']].join(' ')}>{error}</div>}
            {notice && <div className={'success'}>{notice}</div>}
            {loading && <p>Đang tải menu...</p>}
            {canManage && <div className={styles['admin-grid']}>
                <CategoryForm categoryName={categoryName} setCategoryName={setCategoryName} saving={saving} onSubmit={createCategory} />
                <ProductForm product={product} setProduct={setProduct} categories={categories} saving={saving} onSubmit={createProduct} />
            </div>}
            <CategoryList categories={categories} onHide={canManage ? hideCategory : undefined} />
            <ProductList products={products} categoryNames={categoryNames} onHide={canManage ? hideProduct : undefined} />
            {!loading && !products.length && <p>Chưa có món ăn.</p>}
        </section>
    );
}
