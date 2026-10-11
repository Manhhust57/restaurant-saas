import type { ReactNode } from 'react';
import styles from './OpsHeader.module.css';

type Props = {
    kicker?: string;
    title: string;
    summary?: string;
    onBack?: () => void;
    backLabel?: string;
    actions?: ReactNode;
    variant?: 'light' | 'dark';
};

export default function OpsHeader({
    kicker = 'Restaurant SaaS',
    title,
    summary,
    onBack,
    backLabel = 'Quay lại',
    actions,
    variant = 'light',
}: Props) {
    return (
        <header className={[styles.header, variant === 'dark' ? styles.headerDark : ''].filter(Boolean).join(' ')}>
            <div className={styles.left}>
                {onBack && (
                    <button className={styles.back} type="button" onClick={onBack}>
                        ← {backLabel}
                    </button>
                )}
                <div className={styles.titleBlock}>
                    <p className={styles.kicker}>{kicker}</p>
                    <h1 className={styles.title}>{title}</h1>
                </div>
                {summary && <div className={styles.summary}>{summary}</div>}
            </div>
            <div className={styles.actions}>{actions}</div>
        </header>
    );
}
