export const TABLE_STATUSES = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'DISABLED'] as const;

export const STATUS_LABELS: Record<string, string> = {
    AVAILABLE: 'Trống',
    OCCUPIED: 'Có khách',
    RESERVED: 'Đã đặt',
    DISABLED: 'Ngưng dùng',
};
