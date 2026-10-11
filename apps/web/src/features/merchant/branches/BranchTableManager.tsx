import TableList from '../tables/TableList';
import BranchList from './BranchList';
import BranchFormFields from './BranchForm';
import TableFormFields from '../tables/TableForm';
import styles from '../MerchantAdminPage.module.css';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listBranches, getBranch, createBranch as createBranchRequest, updateBranch as updateBranchRequest, deleteBranch as deleteBranchRequest } from './branch.api';
import { listTables, getTable, createTable as createTableRequest, updateTable as updateTableRequest } from '../tables/table.api';
import type { Branch, BranchDetail, TableItem, TableDetail, BranchForm, TableForm } from '../merchant.types';
const emptyBranchForm: BranchForm = { name: '', code: '', address: '' };
const emptyTableForm: TableForm = { branchId: '', name: '', code: '', capacity: '', status: 'AVAILABLE' };
function tableToForm(table: TableItem): TableForm {
    return {
        branchId: table.branchId,
        name: table.name,
        code: table.code,
        capacity: table.capacity ? String(table.capacity) : '',
        status: table.status,
    };
}

function tablePayload(form: TableForm) {
    return {
        branchId: form.branchId,
        name: form.name.trim(),
        code: form.code.trim(),
        status: form.status,
        ...(form.capacity.trim() ? { capacity: Number(form.capacity) } : {}),
    };
}
export default function BranchTableManager({ role }: { role: string }) {
    const canManage = role === 'OWNER' || role === 'MANAGER';
    const [branches, setBranches] = useState<Branch[]>([]);
    const [tables, setTables] = useState<TableItem[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<BranchDetail | null>(null);
    const [selectedTable, setSelectedTable] = useState<TableDetail | null>(null);
    const [branchForm, setBranchForm] = useState<BranchForm>(emptyBranchForm);
    const [branchEdit, setBranchEdit] = useState<BranchForm>(emptyBranchForm);
    const [tableForm, setTableForm] = useState<TableForm>(emptyTableForm);
    const [tableEdit, setTableEdit] = useState<TableForm>(emptyTableForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    async function reload(branchId?: string, tableId?: string) {
        const [nextBranches, nextTables] = await Promise.all([
            listBranches(),
            listTables(),
        ]);
        setBranches(nextBranches);
        setTables(nextTables);
        setTableForm((current) => ({ ...current, branchId: current.branchId || nextBranches[0]?.id || '' }));

        if (branchId) {
            const detail = await getBranch(branchId) as BranchDetail;
            setSelectedBranch(detail);
            setBranchEdit({ name: detail.name, code: detail.code, address: detail.address ?? '' });
        }
        if (tableId) {
            const detail = await getTable(tableId) as TableDetail;
            setSelectedTable(detail);
            setTableEdit(tableToForm(detail));
        }
    }

    useEffect(() => {
        let cancelled = false;
        reload()
            .catch((requestError: Error) => {
                if (!cancelled) setError(requestError.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    async function run(action: () => Promise<void>) {
        setSaving(true);
        setError('');
        setNotice('');
        try {
            await action();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không thực hiện được thao tác.');
        } finally {
            setSaving(false);
        }
    }

    function createBranch(event: FormEvent) {
        event.preventDefault();
        void run(async () => {
            const created = await createBranchRequest({ name: branchForm.name.trim(), code: branchForm.code.trim(), address: branchForm.address.trim() || null });
            setBranchForm(emptyBranchForm);
            setNotice(`Đã tạo chi nhánh ${created.name}.`);
            await reload(created.id, selectedTable?.id);
        });
    }

    function saveBranch(event: FormEvent) {
        event.preventDefault();
        if (!selectedBranch) return;
        const branchId = selectedBranch.id;
        void run(async () => {
            await updateBranchRequest(branchId, { name: branchEdit.name.trim(), code: branchEdit.code.trim(), address: branchEdit.address.trim() });
            setNotice('Đã cập nhật chi nhánh.');
            await reload(branchId, selectedTable?.id);
        });
    }

    function removeBranch() {
        if (!selectedBranch) return;
        if (!window.confirm(`Xóa chi nhánh ${selectedBranch.name}? Bàn của chi nhánh cũng bị xóa. Chi nhánh đã có đơn thì không xóa được.`)) return;
        const branchId = selectedBranch.id;
        void run(async () => {
            await deleteBranchRequest(branchId);
            setSelectedBranch(null);
            if (selectedTable?.branchId === branchId) setSelectedTable(null);
            setNotice('Đã xóa chi nhánh.');
            await reload();
        });
    }

    function openBranch(id: string) {
        void run(async () => {
            const detail = await getBranch(id) as BranchDetail;
            setSelectedBranch(detail);
            setBranchEdit({ name: detail.name, code: detail.code, address: detail.address ?? '' });
            setTableForm((current) => ({ ...current, branchId: id }));
        });
    }

    function createTable(event: FormEvent) {
        event.preventDefault();
        void run(async () => {
            const created = await createTableRequest(tablePayload(tableForm)) as TableItem;
            setTableForm({ ...emptyTableForm, branchId: tableForm.branchId });
            setNotice(`Đã tạo bàn ${created.name}.`);
            await reload(selectedBranch?.id, created.id);
        });
    }

    function saveTable(event: FormEvent) {
        event.preventDefault();
        if (!selectedTable) return;
        const tableId = selectedTable.id;
        void run(async () => {
            await updateTableRequest(tableId, tablePayload(tableEdit));
            setNotice('Đã cập nhật bàn.');
            await reload(selectedBranch?.id, tableId);
        });
    }

    function openTable(id: string) {
        void run(async () => {
            const detail = await getTable(id) as TableDetail;
            setSelectedTable(detail);
            setTableEdit(tableToForm(detail));
        });
    }

    const branchName = new Map(branches.map((branch) => [branch.id, `${branch.name} · ${branch.code}`]));

    return (
        <>
            {error && <div className={['error', styles['admin-message']].join(' ')}>{error}</div>}
            {notice && <div className={'success'}>{notice}</div>}
            {loading && <p>Đang tải chi nhánh và bàn...</p>}
            <div className={styles['admin-grid']}>
                <section className={styles['admin-panel']}>
                    <h3>Chi nhánh ({branches.length})</h3>
                    {canManage && <BranchFormFields value={branchForm} onChange={setBranchForm} onSubmit={createBranch} saving={saving} submitLabel="Thêm chi nhánh" />}
                    <BranchList branches={branches} selectedId={selectedBranch?.id} onSelect={openBranch} />
                    {selectedBranch && canManage && (
                        <div className={styles.editor}>
                            <BranchFormFields value={branchEdit} onChange={setBranchEdit} onSubmit={saveBranch} saving={saving} submitLabel="Lưu chi nhánh"><p className={styles['admin-meta']}>{selectedBranch.tables?.length ?? 0} bàn trong chi nhánh này</p></BranchFormFields>
                            <button className={[styles['ghost-button'], styles['row-action']].join(' ')} type="button" disabled={saving} onClick={removeBranch}>Xóa chi nhánh</button>
                        </div>
                    )}
                </section>

                <section className={styles['admin-panel']}>
                    <h3>Bàn ({tables.length})</h3>
                    {canManage && <TableFormFields value={tableForm} onChange={setTableForm} onSubmit={createTable} saving={saving} submitLabel="Thêm bàn" branches={branches} />}
                    <TableList tables={tables} selectedId={selectedTable?.id} onSelect={openTable} branchName={branchName} />
                    {selectedTable && canManage && (
                        <div className={styles.editor}><TableFormFields value={tableEdit} onChange={setTableEdit} onSubmit={saveTable} saving={saving} submitLabel="Lưu bàn" branches={branches}>{selectedTable.branch && <p className={styles['admin-meta']}>Thuộc {selectedTable.branch.name} ({selectedTable.branch.code})</p>}
                            {selectedTable.qrToken && <p className={styles['admin-meta']}>QR: <Link to={`/customer?token=${selectedTable.qrToken}`}>{selectedTable.qrToken}</Link></p>}
                            </TableFormFields></div>
                    )}
                </section>
            </div>
        </>
    );
}
