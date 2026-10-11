import styles from '../MerchantAdminPage.module.css';
import type { TableItem } from '../merchant.types';
import { STATUS_LABELS } from './table.constants';
export default function TableList({ tables, selectedId, onSelect, branchName }: { tables: TableItem[]; selectedId?: string; onSelect: (id: string) => void; branchName: Map<string, string>; }) { return <>{tables.map((table) => (
                        <button className={[styles['admin-row'], selectedId === table.id ? styles.active : ''].join(' ')} type="button" key={table.id} onClick={() => onSelect(table.id)}>
                            <span>{table.name}</span>
                            <small>{STATUS_LABELS[table.status] ?? table.status} · {branchName.get(table.branchId) ?? table.code}</small>
                        </button>
                    ))}</>; }
