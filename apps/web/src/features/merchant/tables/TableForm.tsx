import type { FormEvent, ReactNode } from 'react';
import styles from '../MerchantAdminPage.module.css';
import type { TableForm as FormValue, Branch } from '../merchant.types';
import { TABLE_STATUSES, STATUS_LABELS } from './table.constants';
type Props = { value: FormValue; onChange: (value: FormValue) => void; onSubmit: (event: FormEvent) => void; saving: boolean; submitLabel: string; children?: ReactNode; branches: Branch[]; };
export default function TableForm({ value, onChange, onSubmit, saving, submitLabel, children, branches }: Props) {
 return (<form className={styles['admin-form']} onSubmit={onSubmit}>
                        <label>Chi nhánh
                            <select value={value.branchId} onChange={(event) => onChange({ ...value, branchId: event.target.value })} required>
                                <option value="">Chọn chi nhánh</option>
                                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                            </select>
                        </label>
                        <div className={styles['field-row']}>
                            <label>Tên<input value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} required /></label>
                            <label>Mã<input value={value.code} onChange={(event) => onChange({ ...value, code: event.target.value })} required /></label>
                        </div>
                        <div className={styles['field-row']}>
                            <label>Sức chứa<input type="number" min={1} value={value.capacity} onChange={(event) => onChange({ ...value, capacity: event.target.value })} /></label>
                            <label>Trạng thái
                                <select value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}>
                                    {TABLE_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                                </select>
                            </label>
                        </div>
                        {children}
                        <button type="submit" disabled={saving || !branches.length}>{submitLabel}</button>
                    </form>);
}
