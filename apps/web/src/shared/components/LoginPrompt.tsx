import { Link } from 'react-router-dom';
export default function LoginPrompt({ title, description }: { title: string; description: string }) {
    return (
        <section className="card">
            <p className="eyebrow">Module</p>
            <h2>{title}</h2>
            <p>{description}</p>
            <Link to="/login">Đăng nhập</Link>
        </section>
    );
}
