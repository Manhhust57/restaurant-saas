import type { Category } from '../merchant.types';
import styles from '../MerchantAdminPage.module.css';

export default function CategoryList({ categories, onHide }: { categories: Category[]; onHide?: (category: Category) => void }) {
    return <section aria-label="Danh sách danh mục">
        <h4>Danh mục ({categories.length})</h4>
        {categories.map((category) => (
            <div className={[styles['admin-row'], styles.static].join(' ')} key={category.id}>
                <span>{category.name}</span>
                {onHide && <button className={[styles['ghost-button'], styles['row-action']].join(' ')} type="button" onClick={() => onHide(category)}>Ẩn</button>}
            </div>
        ))}
    </section>;
}
