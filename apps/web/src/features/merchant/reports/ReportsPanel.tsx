import { FormEvent, useEffect, useState } from 'react';
import { listBranches } from '../branches/branch.api';
import type { Branch } from '../merchant.types';
import styles from '../MerchantAdminPage.module.css';
import { getSalesSummary, type SalesSummary } from './reports.api';

export default function ReportsPanel() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [branchId, setBranchId] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [summary, setSummary] = useState<SalesSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function load(next = { branchId, from, to }) {
        setLoading(true);
        try {
            const data = await getSalesSummary({
                branchId: next.branchId || undefined,
                from: next.from || undefined,
                to: next.to || undefined,
            });
            setSummary(data);
            setError('');
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không tải được báo cáo.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;
        Promise.all([listBranches(), getSalesSummary()])
            .then(([nextBranches, data]) => {
                if (cancelled) return;
                setBranches(nextBranches);
                setSummary(data);
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

    function onSubmit(event: FormEvent) {
        event.preventDefault();
        void load();
    }

    return (
        <section className={styles['admin-panel']}>
            <h3>Báo cáo doanh thu</h3>
            <form className={styles['admin-form']} onSubmit={onSubmit}>
                <div className={styles['field-row']}>
                    <label>
                        Chi nhánh
                        <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
                            <option value="">Tất cả</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Từ ngày
                        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                    </label>
                    <label>
                        Đến ngày
                        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                    </label>
                </div>
                <button type="submit" disabled={loading}>{loading ? 'Đang tải…' : 'Xem báo cáo'}</button>
            </form>
            {error && <p className="error">{error}</p>}
            {summary && (
                <>
                    <div className={styles['admin-summary']}>
                        <span>{summary.totals.orders} đơn</span>
                        <strong>{summary.totals.revenue.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <p className={styles['admin-meta']}>
                        Subtotal {summary.totals.subtotal.toLocaleString('vi-VN')} đ · Giảm {summary.totals.discount.toLocaleString('vi-VN')} đ
                    </p>
                    <div className={styles['field-row']}>
                        <div>
                            <h4>Theo trạng thái</h4>
                            {!summary.statuses.length && <p className={styles['admin-meta']}>Chưa có dữ liệu.</p>}
                            {summary.statuses.map((entry) => (
                                <div className={styles['admin-row']} key={entry.status}>
                                    <span>{entry.status}</span>
                                    <strong>{entry.orders}</strong>
                                </div>
                            ))}
                        </div>
                        <div>
                            <h4>Theo ngày</h4>
                            {!summary.daily.length && <p className={styles['admin-meta']}>Chưa có dữ liệu.</p>}
                            {summary.daily.map((entry) => (
                                <div className={styles['admin-row']} key={entry.date}>
                                    <span>{entry.date} · {entry.orders} đơn</span>
                                    <strong>{entry.revenue.toLocaleString('vi-VN')} đ</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}
