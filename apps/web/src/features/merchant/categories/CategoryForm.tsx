import type { FormEvent } from 'react';
import styles from '../MerchantAdminPage.module.css';
export default function CategoryForm({ categoryName, setCategoryName, saving, onSubmit }: { categoryName: string; setCategoryName: (name: string) => void; saving: boolean; onSubmit: (event: FormEvent) => void }) { return (<form className={styles['admin-form']} onSubmit={onSubmit}>
                    <h4>Thêm danh mục</h4>
                    <label>Tên danh mục<input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required /></label>
                    <button type="submit" disabled={saving}>Thêm danh mục</button>
                </form>); }
