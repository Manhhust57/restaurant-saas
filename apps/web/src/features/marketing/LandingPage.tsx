import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { getLandingByPath, LANDING_PAGES } from './landingContent';
import styles from './LandingPage.module.css';

const FAQ_SCRIPT_ID = 'tqm-landing-faq-jsonld';

export default function LandingPage() {
    const { pathname } = useLocation();
    const page = getLandingByPath(pathname);

    useEffect(() => {
        if (!page) return;

        const existing = document.getElementById(FAQ_SCRIPT_ID);
        if (existing) existing.remove();

        const script = document.createElement('script');
        script.id = FAQ_SCRIPT_ID;
        script.type = 'application/ld+json';
        script.text = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: page.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                },
            })),
        });
        document.head.appendChild(script);

        return () => {
            document.getElementById(FAQ_SCRIPT_ID)?.remove();
        };
    }, [page]);

    if (!page) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className={styles.page}>
            <header className={styles.topbar}>
                <Link to="/" className={styles.brand}>
                    <span className={styles.brandMark}>TQM</span>
                    <span className={styles.brandName}>TQM</span>
                </Link>
                <div className={styles.topActions}>
                    <Link to="/" className={styles.linkGhost}>
                        Trang chủ
                    </Link>
                    <Link to="/login" className={styles.btnPrimary}>
                        Đăng nhập
                    </Link>
                </div>
            </header>

            <section className={styles.hero}>
                <p className={styles.eyebrow}>{page.eyebrow}</p>
                <h1 className={styles.heroTitle}>
                    {page.title} <span>{page.titleHighlight}</span>
                </h1>
                <p className={styles.heroLead}>{page.lead}</p>
                <div className={styles.heroCta}>
                    <Link to="/login" className={styles.btnPrimary}>
                        Dùng thử ngay
                    </Link>
                    <a href="#loi-ich" className={styles.btnSecondary}>
                        Xem lợi ích
                    </a>
                </div>
            </section>

            <section id="loi-ich" className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2>{page.benefitsTitle}</h2>
                    <p>{page.benefitsLead}</p>
                </div>
                <div className={styles.benefitGrid}>
                    {page.benefits.map((benefit) => (
                        <article key={benefit.title} className={styles.benefitCard}>
                            <h3>{benefit.title}</h3>
                            <p>{benefit.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2>{page.howTitle}</h2>
                </div>
                <div className={styles.steps}>
                    {page.howSteps.map((step) => (
                        <article key={step.num} className={styles.step}>
                            <span className={styles.stepNum}>{step.num}</span>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2>{page.audienceTitle}</h2>
                </div>
                <ul className={styles.audienceList}>
                    {page.audience.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2>{page.faqTitle}</h2>
                </div>
                <div className={styles.faqList}>
                    {page.faqs.map((faq) => (
                        <article key={faq.question} className={styles.faqItem}>
                            <h3>{faq.question}</h3>
                            <p>{faq.answer}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2>Tìm hiểu thêm</h2>
                    <p>Các trang liên quan giúp bạn chọn đúng nhu cầu vận hành của quán.</p>
                </div>
                <div className={styles.relatedGrid}>
                    {page.related.map((item) => (
                        <Link key={item.path} to={item.path} className={styles.relatedCard}>
                            <strong>{item.label}</strong>
                            <span>{item.description}</span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className={styles.ctaBand}>
                <div>
                    <h2>{page.ctaTitle}</h2>
                    <p>{page.ctaLead}</p>
                </div>
                <Link to="/login" className={styles.btnPrimary}>
                    Đăng nhập ngay
                </Link>
            </section>

            <footer className={styles.footer}>
                <span>© {new Date().getFullYear()} TQM</span>
                <nav className={styles.footerNav} aria-label="Landing pages">
                    <Link to="/">Trang chủ</Link>
                    {LANDING_PAGES.map((item) => (
                        <Link key={item.path} to={item.path}>
                            {item.eyebrow}
                        </Link>
                    ))}
                </nav>
            </footer>
        </div>
    );
}
