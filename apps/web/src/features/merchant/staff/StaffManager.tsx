import { FormEvent, useState } from 'react';
import { registerStaff, type StaffRole } from '../../auth/auth.api';
import styles from '../MerchantAdminPage.module.css';

const ROLES: StaffRole[] = ['MANAGER', 'CASHIER', 'WAITER', 'KITCHEN'];

export default function StaffManager() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<StaffRole>('CASHIER');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        setError('');
        setNotice('');
        try {
            const created = await registerStaff({
                email: email.trim(),
                password,
                fullName: fullName.trim(),
                role,
            });
            setNotice(`Đã tạo ${created.fullName} · ${created.role} (${created.email})`);
            setEmail('');
            setPassword('');
            setFullName('');
            setRole('CASHIER');
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không tạo được nhân viên.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className={styles['admin-panel']}>
            <h3>Nhân viên</h3>
            <p className={styles['admin-meta']}>Tạo tài khoản gắn vào tenant hiện tại. Role OWNER chỉ có qua tạo tenant.</p>
            {error && <p className="error">{error}</p>}
            {notice && <p className="success">{notice}</p>}
            <form className={styles['admin-form']} onSubmit={onSubmit}>
                <label>
                    Họ tên
                    <input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} />
                </label>
                <label>
                    Email
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>
                <div className={styles['field-row']}>
                    <label>
                        Mật khẩu
                        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
                    </label>
                    <label>
                        Role
                        <select value={role} onChange={(event) => setRole(event.target.value as StaffRole)}>
                            {ROLES.map((entry) => (
                                <option key={entry} value={entry}>{entry}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <button type="submit" disabled={saving}>{saving ? 'Đang tạo…' : 'Tạo nhân viên'}</button>
            </form>
        </section>
    );
}
