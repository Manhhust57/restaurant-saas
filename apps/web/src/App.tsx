import styles from './app/App.module.css';
import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import MerchantAdminPage from './features/merchant/MerchantAdminPage';
import SaaSAdminPage from './features/tenant/SaaSAdminPage';
import CustomerPage from './features/customer/CustomerPage';
import PosPage from './features/pos/PosPage';
import KitchenPage from './features/kitchen/KitchenPage';
import LoginPage from './features/auth/LoginPage';
import HomePage from './features/home/HomePage';
import LandingPage from './features/marketing/LandingPage';
import { MARKETING_PATHS } from './features/marketing/landingContent';
import { navItemsForRole } from './features/auth/roleAccess';
import { loadSession, type Session } from './shared/auth/session';
import { applyDocumentMeta } from './shared/seo/documentMeta';

function isPublicPath(pathname: string) {
    return (
        pathname === '/' ||
        MARKETING_PATHS.includes(pathname) ||
        pathname === '/customer' ||
        pathname.startsWith('/customer/')
    );
}

export default function App() {
    const { pathname } = useLocation();
    const [session, setSession] = useState<Session | null | undefined>(undefined);

    useEffect(() => {
        applyDocumentMeta(pathname);
    }, [pathname]);

    useEffect(() => {
        // Public marketing/customer pages do not need auth; skip /auth/me entirely.
        if (isPublicPath(pathname)) {
            setSession(null);
            return;
        }

        let cancelled = false;
        loadSession().then((value) => {
            if (!cancelled) setSession(value);
        });
        return () => {
            cancelled = true;
        };
    }, [pathname]);

    if (pathname === '/') return <HomePage />;
    if (MARKETING_PATHS.includes(pathname)) return <LandingPage />;
    if (pathname === '/customer') return <CustomerPage />;
    if (pathname === '/kitchen') return <KitchenPage />;
    if (pathname === '/pos') return <PosPage />;
    if (pathname === '/admin') return <MerchantAdminPage />;

    const management = ['/saas', '/login'].some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    const routes = session === undefined ? [] : navItemsForRole(session?.role);

    return (
        <div className={[styles['app-shell'], management ? styles.management : ''].join(' ')}>
            <aside className={styles['sidebar']}>
                <h1>Restaurant SaaS</h1>
                <nav>
                    {routes.map((route) => (
                        <NavLink key={route.path} to={route.path} end>
                            {route.label}
                        </NavLink>
                    ))}
                    {session === null && (
                        <NavLink to="/login">Login</NavLink>
                    )}
                </nav>
            </aside>

            <main className={styles['content']}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    {MARKETING_PATHS.map((path) => (
                        <Route key={path} path={path} element={<LandingPage />} />
                    ))}
                    <Route path="/customer" element={<CustomerPage />} />
                    <Route path="/pos" element={<PosPage />} />
                    <Route path="/kitchen" element={<KitchenPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/admin" element={<MerchantAdminPage />} />
                    <Route path="/saas" element={<SaaSAdminPage />} />
                </Routes>
            </main>
        </div>
    );
}
