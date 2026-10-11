import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './MerchantAdminPage.module.css';
import { logout } from '../../shared/auth/session';
import { useRoleGate } from '../../shared/auth/useRoleGate';
import LoginPrompt from '../../shared/components/LoginPrompt';
import OpsHeader from '../../shared/components/OpsHeader';
import BranchTableManager from './branches/BranchTableManager';
import MenuManager from './categories/CategoryProductManager';
import AdminDashboard from './dashboard/AdminDashboard';
import ReportsPanel from './reports/ReportsPanel';
import StaffManager from './staff/StaffManager';

const TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'branches', label: 'Chi nhánh & bàn' },
    { id: 'menu', label: 'Menu' },
    { id: 'staff', label: 'Nhân viên' },
    { id: 'reports', label: 'Báo cáo' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function MerchantAdminPage() {
    const { session, ready, allowed } = useRoleGate('/admin');
    const [tab, setTab] = useState<TabId>('dashboard');

    if (!ready) return <p>Đang kiểm tra đăng nhập...</p>;
    if (!session) {
        return <LoginPrompt title="Merchant Admin" description="Đăng nhập để quản lý chi nhánh và bàn." />;
    }
    if (!allowed) return <p>Đang chuyển hướng...</p>;
    if (!session.tenantId) {
        return (
            <section className={'card'}>
                <p className={'eyebrow'}>Merchant Admin</p>
                <h2>Chi nhánh và bàn</h2>
                <p>Tài khoản chưa thuộc tenant nào. Tạo tenant trước khi thêm chi nhánh và bàn.</p>
                <Link to="/saas">Tới SaaS Admin</Link>
            </section>
        );
    }

    return (
        <div className={styles['admin-shell']}>
            <OpsHeader
                kicker="Admin"
                title="Quản trị nhà hàng"
                actions={(
                    <>
                        <Link to="/pos">POS</Link>
                        <Link to="/kitchen">Kitchen</Link>
                        <Link to="/saas">SaaS</Link>
                        <button type="button" onClick={logout}>Đăng xuất</button>
                    </>
                )}
            />
            <nav className={styles['admin-tabs']} aria-label="Admin sections">
                {TABS.map((entry) => (
                    <button
                        key={entry.id}
                        type="button"
                        aria-current={tab === entry.id ? 'page' : undefined}
                        onClick={() => setTab(entry.id)}
                    >
                        {entry.label}
                    </button>
                ))}
            </nav>
            <div className={styles['admin-body']}>
                {tab === 'dashboard' && <AdminDashboard />}
                {tab === 'branches' && <BranchTableManager role={session.role} />}
                {tab === 'menu' && <MenuManager role={session.role} />}
                {tab === 'staff' && <StaffManager />}
                {tab === 'reports' && <ReportsPanel />}
            </div>
        </div>
    );
}
