import { useEffect, useState } from 'react';
import { Link, Route, Routes, useSearchParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

const routes = [
    { path: '/', label: 'Home' },
    { path: '/customer', label: 'Customer' },
    { path: '/pos', label: 'POS' },
    { path: '/kitchen', label: 'Kitchen' },
    { path: '/admin', label: 'Merchant Admin' },
    { path: '/saas', label: 'SaaS Admin' },
];

export default function App() {
    return (
        <div className="app-shell">
            <aside className="sidebar">
                <h1>Restaurant SaaS</h1>
                <nav>
                    {routes.map((route) => (
                        <Link key={route.path} to={route.path}>
                            {route.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            <main className="content">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/customer" element={<CustomerPage />} />
                    <Route path="/pos" element={<SectionPage title="POS / Staff" description="Order management, payment, and staff operations." />} />
                    <Route path="/kitchen" element={<KitchenPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/admin" element={<SectionPage title="Merchant Admin" description="Menu, tables, staff, reports, and branch settings." />} />
                    <Route path="/saas" element={<SectionPage title="SaaS Admin" description="Tenant management, plans, subscriptions, and platform overview." />} />
                </Routes>
            </main>
        </div>
    );
}

function HomePage() {
    return (
        <section className="card">
            <p className="eyebrow">Multi-tenant restaurant platform</p>
            <h2>Architecture starter</h2>
            <p>
                This is the initial foundation for a modular monolith with tenant isolation,
                RBAC, branch scoping, order state management, and SaaS-ready structure.
            </p>
            <ul>
                <li>Tenant-aware backend design from the first line of code</li>
                <li>Prisma schema with multi-tenant core entities</li>
                <li>Web app shell split across customer, staff, kitchen, and admin views</li>
            </ul>
        </section>
    );
}

function SectionPage({ title, description }: { title: string; description: string }) {
    return (
        <section className="card">
            <p className="eyebrow">Module</p>
            <h2>{title}</h2>
            <p>{description}</p>
        </section>
    );
}

type Product = {
    id: string;
    name: string;
    description?: string | null;
    price: number | string;
};

type MenuCategory = {
    id: string;
    name: string;
    products: Product[];
};

type MenuResponse = {
    table: { name: string; branch: { name: string } };
    categories: MenuCategory[];
};

function CustomerPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? 'qr-b1';
    const [menu, setMenu] = useState<MenuResponse | null>(null);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(`${API_BASE_URL}/api/v1/public/menu/${token}`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Không tải được menu cho bàn này.');
                }
                return response.json() as Promise<MenuResponse>;
            })
            .then((data) => {
                if (!cancelled) {
                    setMenu(data);
                    setError('');
                }
            })
            .catch((requestError: Error) => {
                if (!cancelled) {
                    setError(requestError.message);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [token]);

    const products = menu?.categories.flatMap((category) => category.products) ?? [];
    const cartItems = products
        .filter((product) => cart[product.id])
        .map((product) => ({ product, quantity: cart[product.id] }));
    const total = cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

    function addToCart(productId: string) {
        setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }));
        setSubmitted(false);
    }

    function removeFromCart(productId: string) {
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

    async function submitOrder() {
        if (!cartItems.length) return;

        const response = await fetch(`${API_BASE_URL}/api/v1/public/orders/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
            }),
        });

        if (!response.ok) {
            setError('Không thể gửi order. Vui lòng thử lại.');
            return;
        }

        setCart({});
        setSubmitted(true);
    }

    if (loading) return <section className="card"><p>Đang tải menu...</p></section>;
    if (error && !menu) return <section className="card"><p className="error">{error}</p></section>;
    if (!menu) return null;

    return (
        <section className="customer-page">
            <header className="customer-header">
                <div>
                    <p className="eyebrow">{menu.table.branch.name}</p>
                    <h2>{menu.table.name}</h2>
                </div>
                <span className="table-badge">QR ordering</span>
            </header>

            {submitted && <div className="success">Order đã được gửi xuống bếp.</div>}
            {error && <div className="error">{error}</div>}

            <div className="menu-layout">
                <div className="menu-list">
                    {menu.categories.map((category) => (
                        <section className="menu-category" key={category.id}>
                            <h3>{category.name}</h3>
                            {category.products.map((product) => (
                                <article className="menu-item" key={product.id}>
                                    <div>
                                        <h4>{product.name}</h4>
                                        <p>{product.description ?? 'Món được chuẩn bị tươi tại bếp.'}</p>
                                        <strong>{Number(product.price).toLocaleString('vi-VN')} đ</strong>
                                    </div>
                                    <button type="button" onClick={() => addToCart(product.id)}>Thêm</button>
                                </article>
                            ))}
                        </section>
                    ))}
                </div>

                <aside className="cart-panel">
                    <p className="eyebrow">Your order</p>
                    <h3>Giỏ món</h3>
                    {!cartItems.length && <p>Chưa có món nào.</p>}
                    {cartItems.map(({ product, quantity }) => (
                        <div className="cart-item" key={product.id}>
                            <span>{product.name}</span>
                            <div>
                                <button type="button" onClick={() => removeFromCart(product.id)} aria-label={`Bớt ${product.name}`}>-</button>
                                <b>{quantity}</b>
                                <button type="button" onClick={() => addToCart(product.id)} aria-label={`Thêm ${product.name}`}>+</button>
                            </div>
                        </div>
                    ))}
                    <div className="cart-total"><span>Tạm tính</span><strong>{total.toLocaleString('vi-VN')} đ</strong></div>
                    <button className="submit-button" type="button" disabled={!cartItems.length} onClick={submitOrder}>Gửi order</button>
                </aside>
            </div>
        </section>
    );
}

type KitchenTicket = {
    id: string;
    orderNumber: string;
    status: string;
    note?: string | null;
    createdAt: string;
    items: Array<{ id: string; productName: string; quantity: number; note?: string | null; status: string }>;
};

function LoginPage() {
    const [email, setEmail] = useState('owner@pizzaabc.vn');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');

    async function login(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            setError('Email hoặc mật khẩu không đúng.');
            return;
        }
        const data = await response.json() as { accessToken: string };
        localStorage.setItem('restaurant_access_token', data.accessToken);
        window.location.href = '/kitchen';
    }

    return (
        <section className="card auth-card">
            <p className="eyebrow">Staff access</p>
            <h2>Đăng nhập</h2>
            <form onSubmit={login} className="auth-form">
                <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                <label>Mật khẩu<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                {error && <p className="error">{error}</p>}
                <button type="submit">Vào hệ thống</button>
            </form>
        </section>
    );
}

function KitchenPage() {
    const [accessToken, setAccessToken] = useState(() => localStorage.getItem('restaurant_access_token'));
    const [tickets, setTickets] = useState<KitchenTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!accessToken) return;

        let cancelled = false;
        setLoading(true);
        fetch(`${API_BASE_URL}/api/v1/kitchen/tickets`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then(async (response) => {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('restaurant_access_token');
                    setAccessToken(null);
                    throw new Error('Phiên đăng nhập đã hết hạn.');
                }
                if (!response.ok) throw new Error('Không tải được ticket bếp.');
                return response.json() as Promise<KitchenTicket[]>;
            })
            .then((data) => {
                if (!cancelled) {
                    setTickets(data);
                    setError('');
                }
            })
            .catch((requestError: Error) => {
                if (!cancelled) setError(requestError.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [accessToken]);

    if (!accessToken) return <LoginPage />;

    async function advanceTicket(ticket: KitchenTicket) {
        const nextStatus: Record<string, string> = {
            CONFIRMED: 'PREPARING',
            PREPARING: 'READY',
            READY: 'SERVED',
        };
        const status = nextStatus[ticket.status];
        if (!status) return;

        const response = await fetch(`${API_BASE_URL}/api/v1/kitchen/orders/${ticket.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) {
            setError('Không thể cập nhật trạng thái ticket.');
            return;
        }
        setTickets((current) => current.map((entry) => entry.id === ticket.id ? { ...entry, status } : entry));
    }

    return (
        <section className="kitchen-page">
            <header className="customer-header">
                <div><p className="eyebrow">Operations</p><h2>Kitchen display</h2></div>
                <button type="button" onClick={() => setAccessToken(null)}>Đăng xuất</button>
            </header>
            {error && <div className="error">{error}</div>}
            {loading && <p>Đang tải ticket...</p>}
            {!loading && !tickets.length && <section className="card"><p>Chưa có ticket đang xử lý.</p></section>}
            <div className="ticket-grid">
                {tickets.map((ticket) => (
                    <article className={`ticket ticket-${ticket.status.toLowerCase()}`} key={ticket.id}>
                        <div className="ticket-header"><strong>{ticket.orderNumber}</strong><span>{ticket.status}</span></div>
                        <p className="ticket-time">{new Date(ticket.createdAt).toLocaleTimeString('vi-VN')}</p>
                        {ticket.items.map((item) => <div className="ticket-item" key={item.id}><span>{item.quantity} × {item.productName}</span><small>{item.note ?? ''}</small></div>)}
                        <button type="button" disabled={!['CONFIRMED', 'PREPARING', 'READY'].includes(ticket.status)} onClick={() => advanceTicket(ticket)}>
                            {ticket.status === 'CONFIRMED' ? 'Bắt đầu làm' : ticket.status === 'PREPARING' ? 'Sẵn sàng' : ticket.status === 'READY' ? 'Đã phục vụ' : 'Hoàn tất'}
                        </button>
                    </article>
                ))}
            </div>
        </section>
    );
}
