import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

const FEATURES = [
    {
        icon: 'QR',
        title: 'Gọi món bằng QR',
        description:
            'Khách quét mã tại bàn để xem menu và đặt món, giảm chờ đợi và tăng tốc phục vụ.',
    },
    {
        icon: 'MN',
        title: 'Quản lý thực đơn',
        description:
            'Danh mục, món ăn và hình ảnh được quản lý tập trung, cập nhật nhanh theo từng chi nhánh.',
    },
    {
        icon: 'OD',
        title: 'Đơn hàng realtime',
        description:
            'Theo dõi trạng thái đơn từ lúc nhận đến khi hoàn thành, đồng bộ giữa thu ngân và bếp.',
    },
    {
        icon: 'KB',
        title: 'Màn hình bếp',
        description:
            'Bếp nhận món mới ngay lập tức, ưu tiên xử lý và giảm sót đơn trong giờ cao điểm.',
    },
    {
        icon: 'TN',
        title: 'Đa tenant',
        description:
            'Mỗi nhà hàng có dữ liệu riêng biệt, vận hành độc lập trên cùng một nền tảng SaaS.',
    },
    {
        icon: 'RP',
        title: 'Báo cáo vận hành',
        description:
            'Nắm nhanh số đơn, doanh thu và hiệu suất phục vụ để điều chỉnh vận hành mỗi ngày.',
    },
] as const;

const STEPS = [
    {
        num: '01',
        title: 'Thiết lập nhà hàng',
        description: 'Tạo chi nhánh, bàn và thực đơn trên hệ thống quản trị.',
    },
    {
        num: '02',
        title: 'Mở QR cho khách',
        description: 'Khách quét mã, chọn món và gửi đơn ngay tại bàn.',
    },
    {
        num: '03',
        title: 'Bếp & thu ngân xử lý',
        description: 'Đơn đồng bộ realtime tới bếp, POS và quản lý.',
    },
    {
        num: '04',
        title: 'Theo dõi & tối ưu',
        description: 'Xem báo cáo để cải thiện tốc độ phục vụ và doanh thu.',
    },
] as const;

export default function HomePage() {
    return (
        <div className={styles.page}>
            <header className={styles.topbar}>
                <Link to="/" className={styles.brand}>
                    <span className={styles.brandMark}>TQM</span>
                    <span className={styles.brandName}>TQM</span>
                </Link>
                <div className={styles.topActions}>
                    <Link to="/login" className={styles.linkGhost}>
                        Đăng nhập
                    </Link>
                    <Link to="/login" className={styles.btnPrimary}>
                        Vào hệ thống
                    </Link>
                </div>
            </header>

            <section className={styles.hero}>
                <div>
                    <p className={styles.eyebrow}>Phần mềm gọi món cho quán ăn</p>
                    <h1 className={styles.heroTitle}>
                        Phần mềm gọi món QR <span>cho quán ăn, nhà hàng</span>
                    </h1>
                    <p className={styles.heroLead}>
                        TQM là phần mềm quản lý nhà hàng giúp khách gọi món bằng QR, đồng bộ đơn
                        realtime tới POS thu ngân và màn hình bếp trên một hệ thống duy nhất.
                    </p>
                    <div className={styles.heroCta}>
                        <Link to="/login" className={styles.btnPrimary}>
                            Đăng nhập quản trị
                        </Link>
                        <a href="#features" className={styles.btnSecondary}>
                            Xem tính năng
                        </a>
                    </div>
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>QR Menu</span>
                            <span className={styles.statLabel}>Đặt món tại bàn không cần app</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>Realtime</span>
                            <span className={styles.statLabel}>Đồng bộ đơn POS &amp; bếp</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>Multi-tenant</span>
                            <span className={styles.statLabel}>Dữ liệu riêng từng nhà hàng</span>
                        </div>
                    </div>
                </div>

                <aside className={styles.preview} aria-hidden="true">
                    <div className={styles.previewHeader}>
                        <div className={styles.dots}>
                            <span className={`${styles.dot} ${styles.dotGold}`} />
                            <span className={`${styles.dot} ${styles.dotBlue}`} />
                            <span className={styles.dot} />
                        </div>
                        <span className={styles.previewLabel}>Dashboard</span>
                    </div>
                    <div className={styles.previewBody}>
                        <div className={styles.previewRow}>
                            <div className={styles.miniCard}>
                                <span className={styles.miniLabel}>Đơn hôm nay</span>
                                <span className={`${styles.miniValue} ${styles.miniValueGold}`}>
                                    128
                                </span>
                            </div>
                            <div className={styles.miniCard}>
                                <span className={styles.miniLabel}>Bàn đang phục vụ</span>
                                <span className={styles.miniValue}>18</span>
                            </div>
                        </div>
                        <div className={styles.listItem}>
                            <span className={styles.listIcon}>QR</span>
                            <div>
                                <p className={styles.listTitle}>Gọi món bằng QR</p>
                                <p className={styles.listSub}>Khách quét mã tại bàn</p>
                            </div>
                        </div>
                        <div className={styles.listItem}>
                            <span className={`${styles.listIcon} ${styles.listIconBlue}`}>MN</span>
                            <div>
                                <p className={styles.listTitle}>Quản lý thực đơn</p>
                                <p className={styles.listSub}>Menu &amp; danh mục tập trung</p>
                            </div>
                        </div>
                        <div className={styles.listItem}>
                            <span className={`${styles.listIcon} ${styles.listIconSlate}`}>KB</span>
                            <div>
                                <p className={styles.listTitle}>Quy trình bếp</p>
                                <p className={styles.listSub}>Theo dõi đơn theo thời gian thực</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </section>

            <section id="features" className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2>Phần mềm quản lý quán ăn đầy đủ tính năng</h2>
                    <p>
                        Từ gọi món QR đến vận hành nội bộ, TQM giúp quán ăn và nhà hàng giảm thao
                        tác thủ công, tăng tốc phục vụ và kiểm soát đơn hàng rõ ràng.
                    </p>
                </div>
                <div className={styles.featureGrid}>
                    {FEATURES.map((feature) => (
                        <article key={feature.title} className={styles.featureCard}>
                            <div className={styles.featureIcon}>{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2>Cách triển khai phần mềm gọi món QR</h2>
                    <p>Thiết lập nhanh, dùng ngay trong ca phục vụ thực tế.</p>
                </div>
                <div className={styles.steps}>
                    {STEPS.map((step) => (
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
                    <h2>Tìm hiểu theo nhu cầu của quán</h2>
                    <p>
                        Mỗi trang đi sâu một bài toán vận hành để bạn chọn đúng phần mềm phù hợp.
                    </p>
                </div>
                <div className={styles.featureGrid}>
                    <article className={styles.featureCard}>
                        <div className={styles.featureIcon}>QR</div>
                        <h3>Phần mềm gọi món QR</h3>
                        <p>Khách tự đặt món tại bàn, đơn về bếp và thu ngân realtime.</p>
                        <Link to="/phan-mem-goi-mon-qr" className={styles.cardLink}>
                            Xem chi tiết →
                        </Link>
                    </article>
                    <article className={styles.featureCard}>
                        <div className={styles.featureIcon}>QL</div>
                        <h3>Phần mềm quản lý nhà hàng</h3>
                        <p>Menu, bàn, đơn, báo cáo gom trên một hệ thống vận hành.</p>
                        <Link to="/phan-mem-quan-ly-nha-hang" className={styles.cardLink}>
                            Xem chi tiết →
                        </Link>
                    </article>
                    <article className={styles.featureCard}>
                        <div className={styles.featureIcon}>POS</div>
                        <h3>POS nhà hàng</h3>
                        <p>Thu ngân nhận đơn QR, chỉnh order và đồng bộ bếp.</p>
                        <Link to="/pos-nha-hang" className={styles.cardLink}>
                            Xem chi tiết →
                        </Link>
                    </article>
                </div>
            </section>

            <section className={styles.ctaBand}>
                <div>
                    <h2>Dùng thử phần mềm gọi món TQM</h2>
                    <p>
                        Đăng nhập để quản lý menu, bàn, đơn hàng, POS và bếp trên cùng một hệ
                        thống.
                    </p>
                </div>
                <Link to="/login" className={styles.btnPrimary}>
                    Đăng nhập ngay
                </Link>
            </section>

            <footer className={styles.footer}>
                <span>© {new Date().getFullYear()} TQM</span>
                <span>
                    <Link to="/phan-mem-goi-mon-qr">Gọi món QR</Link>
                    {' · '}
                    <Link to="/phan-mem-quan-ly-nha-hang">Quản lý nhà hàng</Link>
                    {' · '}
                    <Link to="/pos-nha-hang">POS nhà hàng</Link>
                </span>
            </footer>
        </div>
    );
}
