type BarPoint = { label: string; value: number };

export function RevenueBars({ points }: { points: BarPoint[] }) {
    if (!points.length) {
        return <p className="dash-empty">Chưa có dữ liệu theo ngày.</p>;
    }

    const max = Math.max(...points.map((point) => point.value), 1);
    const width = 640;
    const height = 240;
    const padL = 56;
    const padR = 16;
    const padT = 16;
    const padB = 28;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const slot = chartW / points.length;
    const barW = Math.min(36, Math.max(10, slot * 0.55));

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="240"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Biểu đồ doanh thu theo ngày"
            style={{ display: 'block' }}
        >
            <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#e5e7eb" strokeWidth="1" />
            <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#e5e7eb" strokeWidth="1" />
            {[0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padT + chartH - chartH * ratio;
                return (
                    <g key={ratio}>
                        <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                        <text x={padL - 8} y={y + 3} textAnchor="end" fill="#9ca3af" fontSize="11">
                            {formatCompact(max * ratio)}
                        </text>
                    </g>
                );
            })}
            {points.map((point, index) => {
                const barH = (point.value / max) * chartH;
                const x = padL + index * slot + (slot - barW) / 2;
                const y = padT + chartH - Math.max(barH, point.value > 0 ? 4 : 0);
                return (
                    <g key={`${point.label}-${index}`}>
                        {point.value > 0 && (
                            <rect x={x} y={y} width={barW} height={Math.max(barH, 4)} rx="5" fill="#111827" />
                        )}
                        <text x={x + barW / 2} y={height - 8} textAnchor="middle" fill="#6b7280" fontSize="11">
                            {shortDate(point.label)}
                        </text>
                        <title>{`${point.label}: ${point.value.toLocaleString('vi-VN')} đ`}</title>
                    </g>
                );
            })}
        </svg>
    );
}

export function StatusBars({ points }: { points: BarPoint[] }) {
    if (!points.length) {
        return <p className="dash-empty">Chưa có phân bố trạng thái.</p>;
    }

    const max = Math.max(...points.map((point) => point.value), 1);
    const total = points.reduce((sum, point) => sum + point.value, 0);

    return (
        <div className="status-bars" role="img" aria-label="Biểu đồ đơn theo trạng thái">
            {points.map((point) => (
                <div className="status-bar-row" key={point.label}>
                    <div className="status-bar-label">
                        <span>{point.label}</span>
                        <strong>{point.value} · {total ? Math.round((point.value / total) * 100) : 0}%</strong>
                    </div>
                    <div className="status-bar-track">
                        <div className="status-bar-fill" style={{ width: `${Math.max((point.value / max) * 100, 3)}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Fill missing days so the chart shows a continuous recent window. */
export function fillDailyPoints(
    daily: Array<{ date: string; revenue: number }>,
    days = 7,
): BarPoint[] {
    const byDate = new Map(daily.map((entry) => [entry.date, entry.revenue]));
    const points: BarPoint[] = [];
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    for (let offset = days - 1; offset >= 0; offset -= 1) {
        const day = new Date(today);
        day.setDate(today.getDate() - offset);
        const key = day.toISOString().slice(0, 10);
        points.push({ label: key, value: byDate.get(key) ?? 0 });
    }
    return points;
}

function shortDate(value: string) {
    const parts = value.split('-');
    if (parts.length === 3) return `${Number(parts[2])}/${Number(parts[1])}`;
    return value.slice(5);
}

function formatCompact(value: number) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return `${Math.round(value)}`;
}
