export type Branch = { id: string; name: string; code: string; address?: string | null };
export type BranchDetail = Branch & { tables?: TableItem[] };
export type TableItem = {
    id: string;
    name: string;
    code: string;
    status: string;
    branchId: string;
    capacity?: number | null;
    qrToken?: string;
};
export type TableDetail = TableItem & { branch?: { id: string; name: string; code: string } };
export type Tenant = { id: string; name: string; slug: string; status: string; branches?: Branch[] };
export type Category = { id: string; name: string; sortOrder: number };
export type Product = { id: string; categoryId: string; name: string; description?: string | null; price: number | string; imageUrl?: string | null; isActive: boolean };
export type BranchForm = { name: string; code: string; address: string };
export type TableForm = { branchId: string; name: string; code: string; capacity: string; status: string };
