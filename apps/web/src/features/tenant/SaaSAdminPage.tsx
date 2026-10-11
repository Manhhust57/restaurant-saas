import styles from './SaaSAdminPage.module.css';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { logout, type Session } from '../../shared/auth/session';
import { useRoleGate } from '../../shared/auth/useRoleGate';
import { getTenant, createTenant as createTenantRequest, switchTenant } from './tenant.api';
import LoginPrompt from '../../shared/components/LoginPrompt';
import type { Tenant } from '../merchant/merchant.types';
export default function SaaSAdminPage() {
    const gate = useRoleGate('/saas');
    const [session, setSession] = useState<Session | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (gate.session) setSession(gate.session);
        if (gate.session === null) setSession(null);
    }, [gate.session]);

    useEffect(() => {
        if (!gate.ready || !session?.tenantId) {
            setTenant(null);
            return;
        }
        let cancelled = false;
        getTenant(session.tenantId)
            .then((data) => {
                if (!cancelled) {
                    setTenant(data);
                    setError('');
                }
            })
            .catch((requestError: Error) => {
                if (!cancelled) setError(requestError.message);
            });
        return () => {
            cancelled = true;
        };
    }, [gate.ready, session]);

    if (!gate.ready) return <p>Đang kiểm tra đăng nhập...</p>;
    if (!session) {
        return <LoginPrompt title="SaaS Admin" description="Đăng nhập để tạo và xem tenant." />;
    }
    if (!gate.allowed) return <p>Đang chuyển hướng...</p>;

    async function createTenant(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        setError('');
        setNotice('');
        try {
            const created = await createTenantRequest(name.trim(), slug.trim());
            const switched = await switchTenant(created.id);
            setSession(switched.user);
            setName('');
            setSlug('');
            setNotice(`Đã tạo tenant ${created.name} và chuyển sang tenant này.`);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không tạo được tenant.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className={styles['admin-page']}>
            <header className={'customer-header'}>
                <div>
                    <p className={'eyebrow'}>SaaS Admin · {session.email}</p>
                    <h2>Tenant</h2>
                </div>
                <button className={styles['ghost-button']} type="button" onClick={logout}>Đăng xuất</button>
            </header>
            {error && <div className={['error', styles['admin-message']].join(' ')}>{error}</div>}
            {notice && <div className={'success'}>{notice}</div>}

            {!session.tenantId && <form className={[styles['admin-form'], styles['admin-panel']].join(' ')} onSubmit={createTenant}>
                <h3>Tạo tenant</h3>
                <div className={styles['field-row']}>
                    <label>Tên<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
                    <label>Slug<input value={slug} onChange={(event) => setSlug(event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" title="Chữ thường, số và dấu gạch ngang" required /></label>
                </div>
                <button type="submit" disabled={saving}>Tạo tenant</button>
            </form>}

            {tenant && (
                <section className={styles['admin-panel']}>
                    <div className={styles['admin-summary']}>
                        <strong>{tenant.name}</strong>
                        <span>{tenant.slug} · {tenant.status}</span>
                    </div>
                    <h3>Chi nhánh ({tenant.branches?.length ?? 0})</h3>
                    {(tenant.branches ?? []).map((branch) => (
                        <div className={[styles['admin-row'], styles['static']].join(' ')} key={branch.id}>
                            <span>{branch.name}</span>
                            <small>{branch.code}</small>
                        </div>
                    ))}
                    {!tenant.branches?.length && <p>Tenant này chưa có chi nhánh.</p>}
                    <p className={styles['admin-meta']}><Link to="/admin">Quản lý chi nhánh và bàn</Link></p>
                </section>
            )}
        </section>
    );
}
