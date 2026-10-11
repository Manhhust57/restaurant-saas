import styles from '../MerchantAdminPage.module.css';
import type { Branch } from '../merchant.types';
export default function BranchList({ branches, selectedId, onSelect }: { branches: Branch[]; selectedId?: string; onSelect: (id: string) => void; }) { return <>{branches.map((branch) => (
                        <button className={[styles['admin-row'], selectedId === branch.id ? styles.active : ''].join(' ')} type="button" key={branch.id} onClick={() => onSelect(branch.id)}>
                            <span>{branch.name}</span>
                            <small>{branch.code}</small>
                        </button>
                    ))}</>; }
