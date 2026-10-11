import styles from './PosPage.module.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    listOrders,
    confirmOrder as confirmOrderRequest,
    createPayment as createPaymentRequest,
    createOrder,
    addOrderItems,
    updateOrderItem,
    cancelOrderItem,
    cancelOrder as cancelOrderRequest,
} from './pos.api';
import { logout } from '../../shared/auth/session';
import { useRoleGate } from '../../shared/auth/useRoleGate';
import LoginPrompt from '../../shared/components/LoginPrompt';
import OpsHeader from '../../shared/components/OpsHeader';
import ProductImage from '../../shared/components/ProductImage';
import {
    activeItems,
    canAppendItems,
    canCancelOpenOrder,
    canCancelPendingItem,
    canConfirmOrder,
    cancelledItems,
    isItemEditable,
    itemStatusLabel,
    pickSessionOrder,
    sumActiveItemQty,
    sumActiveItemTotals,
} from '../../shared/orders/orderRules';
import { useOrderRealtime } from '../../shared/realtime/useOrderRealtime';
import type { PosOrder } from '../../shared/types/order';
import { listBranches } from '../merchant/branches/branch.api';
import { listCategories } from '../merchant/categories/category.api';
import { listProducts } from '../merchant/products/product.api';
import { listTables } from '../merchant/tables/table.api';
import type { Branch, Category, Product, TableItem } from '../merchant/merchant.types';

const FALLBACK_POLL_MS = 30_000;

type TableTone = 'free' | 'pending' | 'kitchen' | 'ready';

function openOrders(orders: PosOrder[]) {
    return orders.filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.status));
}

function tableTone(orders: PosOrder[]): TableTone {
    if (!orders.length) return 'free';
    if (orders.some((order) => order.status === 'PENDING')) return 'pending';
    if (orders.some((order) => order.status === 'READY')) return 'ready';
    if (orders.some((order) => ['CONFIRMED', 'PREPARING', 'SERVED'].includes(order.status))) return 'kitchen';
    return 'free';
}

function toneLabel(tone: TableTone) {
    if (tone === 'pending') return 'Chờ gửi bếp';
    if (tone === 'kitchen') return 'Đang làm';
    if (tone === 'ready') return 'Sẵn sàng';
    return 'Trống';
}

export default function PosPage() {
    const { session, ready, allowed } = useRoleGate('/pos');
    const [orders, setOrders] = useState<PosOrder[]>([]);
    const [tables, setTables] = useState<TableItem[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
    const [branchId, setBranchId] = useState('');
    const [categoryId, setCategoryId] = useState('all');
    const [cart, setCart] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [paying, setPaying] = useState(false);
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [itemBusyId, setItemBusyId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const role = session?.role ?? '';
    const canConfirm = ['OWNER', 'MANAGER', 'CASHIER'].includes(role);
    const canPay = ['OWNER', 'MANAGER', 'CASHIER'].includes(role);
    const canCreate = ['OWNER', 'MANAGER', 'CASHIER', 'WAITER'].includes(role);
    const canCancelOrderRole = ['OWNER', 'MANAGER', 'CASHIER'].includes(role);
    const canManage = ['OWNER', 'MANAGER'].includes(role);

    const reload = useCallback(async () => {
        const [nextOrders, nextTables, nextBranches, nextCategories, nextProducts] = await Promise.all([
            listOrders(),
            listTables(),
            listBranches(),
            listCategories(),
            listProducts(),
        ]);
        setOrders(nextOrders);
        setTables(nextTables);
        setBranches(nextBranches);
        setCategories(nextCategories);
        setProducts(nextProducts.filter((product) => product.isActive));
        setBranchId((current) => current || nextBranches[0]?.id || '');
        setError('');
    }, []);

    const refreshOrders = useCallback(async () => {
        const nextOrders = await listOrders();
        setOrders(nextOrders);
    }, []);

    const onOrderChanged = useCallback(() => {
        void refreshOrders().catch((requestError: Error) => setError(requestError.message));
    }, [refreshOrders]);

    const { connected: live } = useOrderRealtime({
        enabled: Boolean(session && allowed),
        onOrderChanged,
    });

    useEffect(() => {
        if (!session || !allowed) return;
        let cancelled = false;
        setLoading(true);
        reload()
            .catch((requestError: Error) => {
                if (!cancelled) setError(requestError.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        const poll = window.setInterval(() => {
            void refreshOrders().catch((requestError: Error) => {
                if (!cancelled) setError(requestError.message);
            });
        }, FALLBACK_POLL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(poll);
        };
    }, [session, allowed, reload, refreshOrders]);

    const branchTables = useMemo(
        () => tables.filter((table) => !branchId || table.branchId === branchId),
        [tables, branchId],
    );

    const tableOrders = useMemo(() => {
        if (!selectedTable) return [] as PosOrder[];
        return openOrders(orders).filter((order) => order.tableId === selectedTable.id);
    }, [orders, selectedTable]);

    // One bill per table session — always the earliest open order.
    const activeOrder = useMemo(() => pickSessionOrder(tableOrders), [tableOrders]);
    const orderLines = activeOrder ? activeItems(activeOrder.items) : [];
    const cancelledLines = activeOrder ? cancelledItems(activeOrder.items) : [];
    const pendingLines = orderLines.filter((item) => isItemEditable(item.status));
    const lockedLines = orderLines.filter((item) => !isItemEditable(item.status));
    const orderActiveTotal = activeOrder ? sumActiveItemTotals(activeOrder.items) : 0;

    const visibleProducts = useMemo(() => {
        return products.filter((product) => categoryId === 'all' || product.categoryId === categoryId);
    }, [products, categoryId]);

    const cartLines = useMemo(
        () =>
            products
                .filter((product) => cart[product.id])
                .map((product) => ({
                    product,
                    quantity: cart[product.id],
                    lineTotal: Number(product.price) * cart[product.id],
                })),
        [products, cart],
    );
    const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
    const cartTotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);
    const orderItemCount = sumActiveItemQty(activeOrder?.items ?? []);
    const headerCount = cartCount + orderItemCount;
    const displayTotal = orderActiveTotal + cartTotal;

    const allowAppend = canCreate && (!activeOrder || canAppendItems(activeOrder));
    const allowConfirmActive =
        canConfirm && activeOrder && canConfirmOrder(activeOrder.status) && cartLines.length === 0;
    const allowSendCart =
        canCreate &&
        cartLines.length > 0 &&
        (!activeOrder || canAppendItems(activeOrder));
    const canSend = allowSendCart || Boolean(allowConfirmActive);
    const sendLabel = activeOrder && cartLines.length ? 'Gọi thêm' : 'Gửi bếp';
    const allowCancelOrder =
        canCancelOrderRole && canCancelOpenOrder(activeOrder) && cartLines.length === 0;

    function addProduct(productId: string) {
        if (!allowAppend) return;
        setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }));
    }

    function removeProduct(productId: string) {
        setCart((current) => {
            const quantity = (current[productId] ?? 0) - 1;
            if (quantity <= 0) {
                const next = { ...current };
                delete next[productId];
                return next;
            }
            return { ...current, [productId]: quantity };
        });
    }

    async function sendOrderToKitchen(orderId: string) {
        if (!canConfirm) return;
        setConfirmingId(orderId);
        setError('');
        try {
            await confirmOrderRequest(orderId);
            await reload();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không gửi được bếp.');
        } finally {
            setConfirmingId(null);
        }
    }

    async function sendToKitchen() {
        if (!selectedTable) return;
        setSaving(true);
        setError('');
        try {
            if (cartLines.length && canCreate) {
                const items = cartLines.map((line) => ({
                    productId: line.product.id,
                    quantity: line.quantity,
                }));

                // Same table → always one open bill. Backend also folds create into addItems.
                if (activeOrder) {
                    if (!canAppendItems(activeOrder)) {
                        throw new Error('Không gọi thêm được trên đơn đã đóng.');
                    }
                    const updated = await addOrderItems(activeOrder.id, items);
                    setCart({});
                    if (canConfirm && canConfirmOrder(updated.status)) {
                        await confirmOrderRequest(updated.id);
                    }
                } else {
                    const created = await createOrder({
                        branchId: selectedTable.branchId,
                        tableId: selectedTable.id,
                        items,
                    });
                    setCart({});
                    if (canConfirm && canConfirmOrder(created.status)) {
                        await confirmOrderRequest(created.id);
                    }
                }
            } else if (activeOrder && canConfirm && canConfirmOrder(activeOrder.status)) {
                await confirmOrderRequest(activeOrder.id);
            }
            await reload();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không gửi được bếp.');
        } finally {
            setSaving(false);
        }
    }

    async function changePendingQty(itemId: string, quantity: number) {
        if (!activeOrder || !canCreate) return;
        const item = activeOrder.items.find((entry) => entry.id === itemId);
        if (!item || !isItemEditable(item.status) || quantity < 1) return;
        setItemBusyId(itemId);
        setError('');
        try {
            await updateOrderItem(activeOrder.id, itemId, { quantity });
            await refreshOrders();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không sửa được món.');
            await refreshOrders().catch(() => undefined);
        } finally {
            setItemBusyId(null);
        }
    }

    async function cancelPendingItem(itemId: string) {
        if (!activeOrder || !canCreate) return;
        if (!canCancelPendingItem(activeOrder.items, itemId)) {
            setError('Không hủy món active cuối — hãy hủy cả đơn.');
            return;
        }
        setItemBusyId(itemId);
        setError('');
        try {
            await cancelOrderItem(activeOrder.id, itemId);
            await refreshOrders();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không hủy được món.');
            await refreshOrders().catch(() => undefined);
        } finally {
            setItemBusyId(null);
        }
    }

    async function cancelActiveOrder() {
        if (!allowCancelOrder || !activeOrder) return;
        const ok = window.confirm(
            `Hủy đơn ${activeOrder.orderNumber}? Chỉ khi chưa thanh toán và chưa có món PREPARING/READY/SERVED.`,
        );
        if (!ok) return;
        setCancellingOrder(true);
        setError('');
        try {
            await cancelOrderRequest(activeOrder.id);
            setCart({});
            await reload();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không hủy được đơn.');
        } finally {
            setCancellingOrder(false);
        }
    }

    async function payActiveOrder() {
        if (!canPay || !activeOrder || cartLines.length) return;
        setPaying(true);
        setError('');
        try {
            await createPaymentRequest(activeOrder.id, {
                method: 'CASH',
                amount: orderActiveTotal,
            });
            setCart({});
            await reload();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không thu được tiền.');
        } finally {
            setPaying(false);
        }
    }

    function renderPendingLine(item: (typeof orderLines)[number]) {
        const busy = itemBusyId === item.id;
        const canCancelLine = canCancelPendingItem(activeOrder?.items ?? [], item.id);
        return (
            <div className={styles['cart-line']} key={item.id}>
                <div className={styles['line-main']}>
                    <span>
                        {item.isExtra ? 'Gọi thêm · ' : ''}
                        {item.productName}
                    </span>
                    <small className={styles['item-status']}>{itemStatusLabel(item.status)}</small>
                </div>
                {canCreate ? (
                    <div className={styles['qty-controls']}>
                        <button
                            type="button"
                            disabled={busy || item.quantity <= 1}
                            onClick={() => void changePendingQty(item.id, item.quantity - 1)}
                        >
                            −
                        </button>
                        <b>×{item.quantity}</b>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void changePendingQty(item.id, item.quantity + 1)}
                        >
                            +
                        </button>
                        <button
                            type="button"
                            className={styles['cancel-item']}
                            disabled={busy || !canCancelLine}
                            title={
                                canCancelLine
                                    ? 'Hủy món (PENDING → CANCELLED)'
                                    : 'Hủy cả đơn thay vì hủy món cuối'
                            }
                            onClick={() => void cancelPendingItem(item.id)}
                        >
                            Hủy
                        </button>
                    </div>
                ) : (
                    <small>×{item.quantity}</small>
                )}
                <span className={styles['line-price']}>
                    {Number(item.total ?? 0).toLocaleString('vi-VN')}đ
                </span>
            </div>
        );
    }

    if (!ready) return <p>Đang kiểm tra đăng nhập...</p>;
    if (!session) {
        return <LoginPrompt title="POS / Staff" description="Đăng nhập để xem và xử lý đơn." />;
    }
    if (!allowed) return <p>Đang chuyển hướng...</p>;

    const navActions = (
        <>
            {canManage && <Link to="/admin">Admin</Link>}
            <Link to="/kitchen">Kitchen</Link>
            <button type="button" onClick={() => void logout()}>Đăng xuất</button>
        </>
    );

    if (!selectedTable) {
        return (
            <div className={styles['pos-shell']}>
                <OpsHeader kicker="POS" title="Table Map" summary={live ? 'Live' : 'Offline'} actions={navActions} />
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles['map-body']}>
                    <div className={styles['map-toolbar']}>
                        <h2>Danh sách bàn</h2>
                        <label className={styles.muted}>
                            Chi nhánh{' '}
                            <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className={styles.legend}>
                        <span><i className={styles.dotFree} /> Trống</span>
                        <span><i className={styles.dotPending} /> Chờ gửi bếp</span>
                        <span><i className={styles.dotKitchen} /> Đang làm</span>
                        <span><i className={styles.dotReady} /> Sẵn sàng</span>
                    </div>

                    {loading && <p className={styles.muted}>Đang tải bàn...</p>}
                    {!loading && !branchTables.length && <p className={styles.muted}>Chưa có bàn ở chi nhánh này.</p>}
                    {!!branchTables.length && (
                        <div className={styles['table-wrap']}>
                            <table className={styles['tables-table']}>
                                <thead>
                                    <tr>
                                        <th className={styles['col-status']} aria-label="Trạng thái" />
                                        <th>Bàn</th>
                                        <th>Trạng thái</th>
                                        <th className={styles['col-num']}>Món</th>
                                        <th className={styles['col-num']}>Tổng</th>
                                        <th className={styles['col-action']} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {branchTables.map((table) => {
                                        const related = openOrders(orders).filter((order) => order.tableId === table.id);
                                        const tableSession = pickSessionOrder(related);
                                        const pending =
                                            tableSession && canConfirmOrder(tableSession.status) ? tableSession : null;
                                        const tone = tableTone(tableSession ? [tableSession] : []);
                                        const itemCount = tableSession ? sumActiveItemQty(tableSession.items) : 0;
                                        const total = tableSession ? sumActiveItemTotals(tableSession.items) : 0;
                                        const dotClass =
                                            tone === 'pending' ? styles.dotPending
                                                : tone === 'ready' ? styles.dotReady
                                                    : tone === 'kitchen' ? styles.dotKitchen
                                                        : styles.dotFree;
                                        return (
                                            <tr key={table.id}>
                                                <td className={styles['col-status']}>
                                                    <span className={[styles['status-dot'], dotClass].join(' ')} aria-label={toneLabel(tone)} />
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={styles['table-link']}
                                                        onClick={() => { setSelectedTable(table); setCart({}); }}
                                                    >
                                                        <strong>{table.name}</strong>
                                                        <small>{table.code}</small>
                                                    </button>
                                                </td>
                                                <td>{toneLabel(tone)}</td>
                                                <td className={styles['col-num']}>{related.length ? itemCount : '—'}</td>
                                                <td className={styles['col-num']}>
                                                    {related.length ? `${total.toLocaleString('vi-VN')} đ` : '—'}
                                                </td>
                                                <td className={styles['col-action']}>
                                                    {pending && canConfirm ? (
                                                        <button
                                                            type="button"
                                                            className={styles['send-btn']}
                                                            disabled={confirmingId === pending.id}
                                                            onClick={() => void sendOrderToKitchen(pending.id)}
                                                        >
                                                            {confirmingId === pending.id ? 'Đang gửi…' : 'Gửi bếp'}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className={styles['open-btn']}
                                                            onClick={() => { setSelectedTable(table); setCart({}); }}
                                                        >
                                                            Mở
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={styles['pos-shell']}>
            <OpsHeader
                kicker="POS"
                title={selectedTable.name}
                summary={`${headerCount} món · ${displayTotal.toLocaleString('vi-VN')} đ · ${live ? 'Live' : 'Offline'}`}
                onBack={() => { setSelectedTable(null); setCart({}); }}
                backLabel="Map"
                actions={navActions}
            />
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.workspace}>
                <section className={styles['menu-pane']}>
                    <div className={styles.categories}>
                        <button type="button" aria-pressed={categoryId === 'all'} onClick={() => setCategoryId('all')}>
                            Tất cả
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                aria-pressed={categoryId === category.id}
                                onClick={() => setCategoryId(category.id)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                    <div className={styles['product-grid']}>
                        {visibleProducts.map((product, index) => (
                            <button
                                key={product.id}
                                type="button"
                                disabled={!allowAppend}
                                onClick={() => addProduct(product.id)}
                            >
                                <span className={styles['product-thumb']}>
                                    {/* First row eager (avoid browser lazy-intervention); rest lazy. */}
                                    <ProductImage
                                        src={product.imageUrl}
                                        name={product.name}
                                        priority={index < 8}
                                    />
                                </span>
                                <strong>{product.name}</strong>
                                <small>
                                    {Number(product.price).toLocaleString('vi-VN')} đ
                                    {cart[product.id] ? ` · ×${cart[product.id]}` : ''}
                                </small>
                            </button>
                        ))}
                    </div>
                </section>

                <aside className={styles['cart-pane']}>
                    <div className={styles['cart-title']}>
                        <h2>Đơn hàng {selectedTable.name}</h2>
                        <p>
                            {selectedTable.code}
                            {activeOrder ? ` · ${activeOrder.orderNumber} · ${activeOrder.status}` : ''}
                        </p>
                    </div>

                    <div className={styles['cart-lines']}>
                        {!orderLines.length && !cartLines.length && (
                            <p className={styles.muted}>Chọn món bên trái để thêm vào đơn.</p>
                        )}

                        {!!pendingLines.length && (
                            <div className={styles['order-section']}>
                                <div className={styles['section-label']}>Chờ / sửa được (PENDING)</div>
                                {pendingLines.map((item) => renderPendingLine(item))}
                            </div>
                        )}

                        {!!lockedLines.length && (
                            <div className={styles['order-section']}>
                                <div className={styles['section-label']}>Đã vào bếp (khóa)</div>
                                {lockedLines.map((item) => (
                                    <div className={[styles['cart-line'], styles['line-locked']].join(' ')} key={item.id}>
                                        <div className={styles['line-main']}>
                                            <span>
                                                {item.isExtra ? 'Gọi thêm · ' : ''}
                                                {item.productName}
                                            </span>
                                            <small className={styles['item-status']}>
                                                {itemStatusLabel(item.status)}
                                            </small>
                                        </div>
                                        <small>×{item.quantity}</small>
                                        <span className={styles['line-price']}>
                                            {Number(item.total ?? 0).toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!!cancelledLines.length && (
                            <div className={styles['order-section']}>
                                <div className={styles['section-label']}>Đã hủy (giữ lịch sử)</div>
                                {cancelledLines.map((item) => (
                                    <div className={[styles['cart-line'], styles['line-cancelled']].join(' ')} key={item.id}>
                                        <span>{item.productName}</span>
                                        <small>×{item.quantity}</small>
                                        <span className={styles['line-price']}>Đã hủy</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!!cartLines.length && (
                            <div className={styles['order-section']}>
                                <div className={styles['section-label']}>
                                    {activeOrder ? 'Gọi thêm (chưa gửi)' : 'Chưa gửi'}
                                </div>
                                {cartLines.map((line) => (
                                    <div className={styles['cart-line']} key={line.product.id}>
                                        <span>{line.product.name}</span>
                                        <div className={styles['qty-controls']}>
                                            <button type="button" onClick={() => removeProduct(line.product.id)}>−</button>
                                            <b>×{line.quantity}</b>
                                            <button type="button" onClick={() => addProduct(line.product.id)}>+</button>
                                        </div>
                                        <span className={styles['line-price']}>{line.lineTotal.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles['cart-footer']}>
                        <div className={styles['total-row']}>
                            <span>Tổng</span>
                            <span>{displayTotal.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className={styles.actions}>
                            <button
                                className={styles.primary}
                                type="button"
                                disabled={!canSend || saving}
                                onClick={() => void sendToKitchen()}
                            >
                                {saving ? 'Đang gửi…' : sendLabel}
                            </button>
                            <button
                                className={styles.secondary}
                                type="button"
                                disabled={!canPay || !activeOrder || paying || !!cartLines.length || orderActiveTotal <= 0}
                                onClick={() => void payActiveOrder()}
                            >
                                {paying ? 'Đang thu…' : 'Thanh toán'}
                            </button>
                            {canCancelOrderRole && activeOrder && (
                                <button
                                    className={styles.danger}
                                    type="button"
                                    disabled={!allowCancelOrder || cancellingOrder}
                                    title={
                                        allowCancelOrder
                                            ? 'Hủy đơn (soft-cancel mọi PENDING)'
                                            : 'Không hủy được: đã vào bếp hoặc còn món gọi thêm chưa gửi'
                                    }
                                    onClick={() => void cancelActiveOrder()}
                                >
                                    {cancellingOrder ? 'Đang hủy…' : 'Hủy đơn'}
                                </button>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
