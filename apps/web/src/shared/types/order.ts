export type OrderItemLine = {
    id: string;
    productName: string;
    quantity: number;
    note?: string | null;
    status: string;
    /** Appended after kitchen already started the order. */
    isExtra?: boolean;
    unitPrice?: number | string;
    total?: number | string;
    productId?: string;
};

export type KitchenTicket = {
    id: string;
    orderNumber: string;
    status: string;
    note?: string | null;
    createdAt: string;
    tableId?: string | null;
    table?: { id: string; name: string; code: string } | null;
    items: OrderItemLine[];
};

export type PosOrder = KitchenTicket & {
    branchId: string;
    total: number | string;
    subtotal?: number | string;
};
