import styles from './LoginPage.module.css';
import { useState } from 'react';
import { login as loginRequest } from './auth.api';
import { homePathForRole } from './homePathForRole';
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function login(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            const result = await loginRequest(email, password);
            localStorage.removeItem('restaurant_access_token');
            window.location.href = homePathForRole(result.user.role);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không đăng nhập được.');
        }
    }

    return (
        <section className={['card', styles['auth-card']].join(' ')}>
            <p className={'eyebrow'}>Staff access</p>
            <h2>Đăng nhập</h2>
            <form onSubmit={login} className={styles['auth-form']}>
                <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                <label>Mật khẩu<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                {error && <p className={'error'}>{error}</p>}
                <button type="submit">Vào hệ thống</button>
            </form>
        </section>
    );
}
