import { useEffect, useMemo, useState } from 'react';
import { listOrders } from '../../pos/pos.api';
import { listBranches } from '../branches/branch.api';
import { listTables } from '../tables/table.api';
import { getSalesSummary, type SalesSummary } from '../reports/reports.api';
import styles from '../MerchantAdminPage.module.css';
import { fillDailyPoints, RevenueBars, StatusBars } from './SimpleCharts';

export default function AdminDashboard() {
    const [summary, setSummary] = useState<SalesSummary | null>(null);
    const [pending, setPending] = useState(0);
    const [activeKitchen, setActiveKitchen] = useState(0);
    const [branchCount, setBranchCount] = useState(0);
    const [tableCount, setTableCount] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        Promise.all([getSalesSummary(), listOrders(), listBranches(), listTables()])
            .then(([sales, orders, branches, tables]) => {
                if (cancelled) return;
                setSummary(sales);
                setPending(orders.filter((order) => order.status === 'PENDING').length);
                setActiveKitchen(orders.filter((order) => ['CONFIRMED', 'PREPARING', 'READY'].includes(order.status)).length);
                setBranchCount(branches.length);
                setTableCount(tables.length);
                setError('');
            })
            .catch((requestError: Error) => {
                if (!cancelled) setError(requestError.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const dailyPoints = useMemo(
        () => fillDailyPoints(summary?.daily ?? [], 7),
        [summary],
    );
    const statusPoints = useMemo(
        () => (summary?.statuses ?? []).map((entry) => ({ label: entry.status, value: entry.orders })),
        [summary],
    );

    if (loading) return <section className={styles['admin-panel']}><p>Đang tải dashboard...</p></section>;
    if (error) return <section className={styles['admin-panel']}><p className="error">{error}</p></section>;

    return (
        <div className={styles['dash-wrap']}>
            <section className={styles['admin-panel']}>
                <h3>Tổng quan</h3>
                <div className={styles['dash-grid']}>
                    <article className={styles['dash-card']}>
                        <span>Doanh thu</span>
                        <strong>{(summary?.totals.revenue ?? 0).toLocaleString('vi-VN')} đ</strong>
                        <small>{summary?.totals.orders ?? 0} đơn</small>
                    </article>
                    <article className={styles['dash-card']}>
                        <span>Chờ xác nhận</span>
                        <strong>{pending}</strong>
                        <small>PENDING</small>
                    </article>
                    <article className={styles['dash-card']}>
                        <span>Đang ở bếp</span>
                        <strong>{activeKitchen}</strong>
                        <small>CONFIRMED → READY</small>
                    </article>
                    <article className={styles['dash-card']}>
                        <span>Chi nhánh · Bàn</span>
                        <strong>{branchCount} · {tableCount}</strong>
                        <small>Tài nguyên</small>
                    </article>
                </div>
            </section>

            <div className={styles['dash-charts']}>
                <section className={styles['admin-panel']}>
                    <h3>Doanh thu theo ngày</h3>
                    <div className={styles['chart-frame']}>
                        <RevenueBars points={dailyPoints} />
                    </div>
                </section>
                <section className={styles['admin-panel']}>
                    <h3>Đơn theo trạng thái</h3>
                    <div className={styles['chart-frame']}>
                        <StatusBars points={statusPoints} />
                    </div>
                </section>
            </div>
        </div>
    );
}
