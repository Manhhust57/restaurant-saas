export type OrderChangedReason =
    | 'created'
    | 'confirmed'
    | 'status'
    | 'paid'
    | 'items_added'
    | 'item_updated'
    | 'item_cancelled'
    | 'cancelled';

export type OrderChangedEvent = {
    reason: OrderChangedReason;
    orderId: string;
    status: string;
    branchId?: string | null;
    tableId?: string | null;
};
