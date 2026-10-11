import styles from '../MerchantAdminPage.module.css';
import productStyles from './ProductList.module.css';
import type { Product } from '../merchant.types';
export default function ProductList({ products, categoryNames, onHide }: { products: Product[]; categoryNames: Map<string, string>; onHide?: (product: Product) => void }) {
    return <div>{products.map((item) => (
        <div className={[styles['admin-row'], styles.static].join(' ')} key={item.id}>
            <span className={productStyles.details}>
                {item.name}
                <small>{categoryNames.get(item.categoryId) ?? 'Chưa phân loại'}</small>
            </span>
            <strong className={productStyles.price}>{Number(item.price).toLocaleString('vi-VN')} đ</strong>
            {onHide && <button className={[styles['ghost-button'], styles['row-action']].join(' ')} type="button" onClick={() => onHide(item)}>Ẩn</button>}
        </div>
    ))}</div>;
}
