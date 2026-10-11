import styles from './KitchenPage.module.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTickets, updateTicketStatus } from './kitchen.api';
import { logout } from '../../shared/auth/session';
import { useRoleGate } from '../../shared/auth/useRoleGate';
import LoginPrompt from '../../shared/components/LoginPrompt';
import OpsHeader from '../../shared/components/OpsHeader';
import { notifyBeep } from '../../shared/lib/notifyBeep';
import {
    kitchenExtraItems,
    kitchenHasStageWork,
    kitchenItemStatusLabel,
    kitchenOriginalItems,
    kitchenVisibleItems,
} from '../../shared/orders/orderRules';
import { useOrderRealtime } from '../../shared/realtime/useOrderRealtime';
import type { KitchenTicket, OrderItemLine } from '../../shared/types/order';

const COLUMNS = [
    {
        key: 'CONFIRMED',
        title: 'Mới',
        action: 'Nhận đơn',
        next: 'PREPARING',
        tone: 'new' as const,
    },
    {
        key: 'PREPARING',
        title: 'Đang làm',
        action: 'Hoàn tất',
        next: 'READY',
        tone: 'doing' as const,
    },
    {
        key: 'READY',
        title: 'Sẵn sàng',
        action: 'Đã lấy',
        next: 'SERVED',
        tone: 'ready' as const,
    },
] as const;

const FALLBACK_POLL_MS = 30_000;
const BOARD_STATUSES = new Set(['CONFIRMED', 'PREPARING', 'READY']);

function waitClock(createdAt: string, now: number) {
    const sec = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function tableLabel(ticket: KitchenTicket) {
    return ticket.table?.name || ticket.table?.code || 'Mang về';
}

function shortOrderNo(orderNumber: string) {
    const digits = orderNumber.replace(/\D/g, '');
    if (digits.length >= 4) return `#${digits.slice(-4)}`;
    return orderNumber;
}

function normalizeTicket(ticket: KitchenTicket): KitchenTicket {
    return {
        ...ticket,
        items: kitchenVisibleItems(ticket.items),
    };
}

function extraItemIds(tickets: KitchenTicket[]) {
    const ids = new Set<string>();
    for (const ticket of tickets) {
        for (const item of ticket.items) {
            if (item.isExtra) ids.add(item.id);
        }
    }
    return ids;
}

function renderItemRow(item: OrderItemLine, extra: boolean) {
    return (
        <li key={item.id} className={extra ? styles['item-extra'] : undefined}>
            <span>
                {extra && <span className={styles['extra-pill']}>Gọi thêm</span>}
                {item.productName}
                <small className={styles['item-status']}>
                    {' '}· {kitchenItemStatusLabel(item.status)}
                </small>
            </span>
            <b>×{item.quantity}</b>
        </li>
    );
}

export default function KitchenPage() {
    const { session, ready, allowed } = useRoleGate('/kitchen');
    const [tickets, setTickets] = useState<KitchenTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [now, setNow] = useState(() => Date.now());
    const knownIds = useRef<Set<string> | null>(null);
    const knownExtraIds = useRef<Set<string> | null>(null);
    const canManage = session ? ['OWNER', 'MANAGER'].includes(session.role) : false;

    const refresh = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await listTickets();
            const board = data
                .map(normalizeTicket)
                .filter((ticket) => BOARD_STATUSES.has(ticket.status));
            const nextIds = new Set(board.map((ticket) => ticket.id));
            const nextExtras = extraItemIds(board);
            if (knownIds.current) {
                const hasNewTicket = board.some((ticket) => !knownIds.current!.has(ticket.id));
                const hasNewExtra = [...nextExtras].some((id) => !knownExtraIds.current!.has(id));
                if (hasNewTicket || hasNewExtra) notifyBeep();
            }
            knownIds.current = nextIds;
            knownExtraIds.current = nextExtras;
            setTickets(board);
            setError('');
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không tải được ticket.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const onOrderChanged = useCallback(() => {
        void refresh(true);
    }, [refresh]);

    const { connected: live } = useOrderRealtime({
        enabled: Boolean(session && allowed),
        onOrderChanged,
    });

    useEffect(() => {
        if (!session || !allowed) return;
        void refresh(false);
        const poll = window.setInterval(() => void refresh(true), FALLBACK_POLL_MS);
        const clock = window.setInterval(() => setNow(Date.now()), 1000);
        return () => {
            window.clearInterval(poll);
            window.clearInterval(clock);
        };
    }, [session, allowed, refresh]);

    const columns = useMemo(
        () =>
            COLUMNS.map((column) => ({
                ...column,
                tickets: tickets.filter((ticket) => ticket.status === column.key),
            })),
        [tickets],
    );

    if (!ready) return <p>Đang kiểm tra đăng nhập...</p>;
    if (!session) {
        return <LoginPrompt title="Kitchen" description="Đăng nhập tài khoản bếp để xem ticket." />;
    }
    if (!allowed) return <p>Đang chuyển hướng...</p>;

    async function moveTicket(ticket: KitchenTicket, nextStatus: string) {
        if (!kitchenHasStageWork(ticket.items, nextStatus)) {
            setError(`Không có món phù hợp để chuyển sang ${nextStatus}.`);
            return;
        }
        setBusyId(ticket.id);
        setError('');
        try {
            await updateTicketStatus(ticket.id, nextStatus);
            await refresh(true);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không cập nhật được trạng thái.');
            await refresh(true).catch(() => undefined);
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className={styles.kds}>
            <OpsHeader
                kicker="Kitchen"
                title="KDS"
                summary={`${new Date(now).toLocaleTimeString('vi-VN')} · ${live ? 'Live' : 'Offline'}`}
                actions={(
                    <>
                        {canManage && <Link to="/admin">Admin</Link>}
                        <Link to="/pos">POS</Link>
                        <button type="button" onClick={() => void logout()}>Đăng xuất</button>
                    </>
                )}
            />

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.board}>
                {columns.map((column) => (
                    <section key={column.key} className={[styles.column, styles[`col-${column.tone}`]].join(' ')}>
                        <header className={styles['column-head']}>
                            <span className={styles['column-dot']} aria-hidden="true" />
                            <h2>{column.title}</h2>
                            <strong>{column.tickets.length}</strong>
                        </header>

                        <div className={styles['column-body']}>
                            {loading && !tickets.length && (
                                <p className={styles.empty}>Đang tải...</p>
                            )}
                            {!loading && !column.tickets.length && (
                                <p className={styles.empty}>Trống</p>
                            )}
                            {column.tickets.map((ticket) => {
                                const visibleItems = kitchenVisibleItems(ticket.items);
                                const extras = kitchenExtraItems(visibleItems);
                                const originals = kitchenOriginalItems(visibleItems);
                                const canAdvance = kitchenHasStageWork(visibleItems, column.next);
                                const hasExtra = extras.length > 0;
                                return (
                                    <article
                                        className={[styles.card, hasExtra ? styles['card-extra'] : '']
                                            .filter(Boolean)
                                            .join(' ')}
                                        key={ticket.id}
                                    >
                                        <div className={styles['card-top']}>
                                            <strong>
                                                {shortOrderNo(ticket.orderNumber)} · {tableLabel(ticket)}
                                                {hasExtra && (
                                                    <span className={styles['card-extra-badge']}>Gọi thêm</span>
                                                )}
                                            </strong>
                                            <span className={Math.floor((now - new Date(ticket.createdAt).getTime()) / 60000) >= 10 ? styles['wait-hot'] : undefined}>
                                                {waitClock(ticket.createdAt, now)}
                                            </span>
                                        </div>
                                        <ul className={styles.items}>
                                            {hasExtra && !!extras.length && (
                                                <>
                                                    <li className={styles['items-group']}>Gọi thêm</li>
                                                    {extras.map((item) => renderItemRow(item, true))}
                                                </>
                                            )}
                                            {hasExtra && !!originals.length && (
                                                <li className={styles['items-group']}>Món trước</li>
                                            )}
                                            {(hasExtra ? originals : visibleItems).map((item) =>
                                                renderItemRow(item, false),
                                            )}
                                        </ul>
                                        <button
                                            type="button"
                                            className={styles.action}
                                            disabled={busyId === ticket.id || !canAdvance}
                                            title={
                                                canAdvance
                                                    ? column.action
                                                    : 'Không có món ở bước hiện tại để chuyển'
                                            }
                                            onClick={() => void moveTicket(ticket, column.next)}
                                        >
                                            {busyId === ticket.id ? '…' : column.action}
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
