import type { FormEvent, ReactNode } from 'react';
import styles from '../MerchantAdminPage.module.css';
import type { BranchForm as FormValue } from '../merchant.types';
type Props = { value: FormValue; onChange: (value: FormValue) => void; onSubmit: (event: FormEvent) => void; saving: boolean; submitLabel: string; children?: ReactNode; };
export default function BranchForm({ value, onChange, onSubmit, saving, submitLabel, children }: Props) {
 return (<form className={styles['admin-form']} onSubmit={onSubmit}>
                        <div className={styles['field-row']}>
                            <label>Tên<input value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} required /></label>
                            <label>Mã<input value={value.code} onChange={(event) => onChange({ ...value, code: event.target.value })} required /></label>
                        </div>
                        <label>Địa chỉ<input value={value.address} onChange={(event) => onChange({ ...value, address: event.target.value })} /></label>
                        {children}
                        <button type="submit" disabled={saving}>{submitLabel}</button>
                    </form>);
}
