// src/components/admin/DataTable.jsx
import { Edit, Trash2, AlertCircle } from 'lucide-react';

function DataTable({
    data,
    columns,
    onEdit,
    onDelete,
    activeTab,
    onRefresh,
    searchTerm
}) {
    const getItemId = (item) => {
        switch (activeTab) {
            case 'songs': return item.songId || item.id;
            case 'users': return item.iduser || item.id;
            case 'artists': return item.idartist || item.id;
            case 'albums': return item.idalbum || item.id;
            case 'genres': return item.idgenre || item.id;
            default: return item.id;
        }
    };

    const renderTableRow = (item) => {
        switch (activeTab) {
            case 'songs':
                return (
                    <tr key={getItemId(item)}>
                        <td>{getItemId(item)}</td>
                        <td>{item.title || item.name || 'Không có tiêu đề'}</td>
                        <td>{item.artistName || 'Unknown Artist'}</td>
                        <td>{item.albumName || '-'}</td>
                        <td>{item.genreName || 'Unknown Genre'}</td>
                        <td>{item.duration || '00:00'}</td>
                        <td>{item.views || item.listens || 0}</td>
                        <td className="actions-cell">
                            <button className="btn-action edit" title="Sửa" onClick={() => onEdit(item)}>
                                <Edit size={14} />
                            </button>
                            <button className="btn-action delete" title="Xóa" onClick={() => onDelete('song', getItemId(item))}>
                                <Trash2 size={14} />
                            </button>
                        </td>
                    </tr>
                );

            case 'users':
                const canEdit = false; // Không cho sửa user
                const canDelete = item.role !== 'ADMIN'; // Chỉ xóa được user thường

                return (
                    <tr key={getItemId(item)}>
                        <td>{getItemId(item)}</td>
                        <td>{item.username || 'Unknown'}</td>
                        <td>{item.email || 'No email'}</td>
                        <td>
                            <span className={`role-badge ${(item.role || 'USER').toLowerCase()}`}>
                                {item.role || 'USER'}
                            </span>
                        </td>
                        <td className="actions-cell">
                            {canEdit && (
                                <button className="btn-action edit" title="Sửa" onClick={() => onEdit(item)}>
                                    <Edit size={14} />
                                </button>
                            )}
                            {canDelete && (
                                <button className="btn-action delete" title="Xóa" onClick={() => onDelete('user', getItemId(item))}>
                                    <Trash2 size={14} />
                                </button>
                            )}
                            {!canEdit && !canDelete && <span className="no-actions">-</span>}
                        </td>
                    </tr>
                );

            case 'artists':
                return (
                    <tr key={getItemId(item)}>
                        <td>{getItemId(item)}</td>
                        <td>{item.artistname || item.name || 'Unknown Artist'}</td>
                        <td>{item.infomation || 'Không có mô tả'}</td>
                        <td className="actions-cell">
                            <button className="btn-action edit" title="Sửa" onClick={() => onEdit(item)}>
                                <Edit size={14} />
                            </button>
                            <button className="btn-action delete" title="Xóa" onClick={() => onDelete('artist', getItemId(item))}>
                                <Trash2 size={14} />
                            </button>
                        </td>
                    </tr>
                );

            case 'albums':
                return (
                    <tr key={getItemId(item)}>
                        <td>{getItemId(item)}</td>
                        <td>{item.albumname || item.title || 'Unknown'}</td>
                        <td>{item.artistName || item.artistname || item.artist || '-'}</td>
                        <td>{item.releaseyear || item.year || '-'}</td>
                        <td className="actions-cell">
                            <button className="btn-action edit" title="Sửa" onClick={() => onEdit(item)}>
                                <Edit size={14} />
                            </button>
                            <button className="btn-action delete" title="Xóa" onClick={() => onDelete('album', getItemId(item))}>
                                <Trash2 size={14} />
                            </button>
                        </td>
                    </tr>
                );

            case 'genres':
                return (
                    <tr key={getItemId(item)}>
                        <td>{getItemId(item)}</td>
                        <td>{item.genrename || item.name || 'Unknown'}</td>
                        <td className="actions-cell">
                            <button className="btn-action edit" title="Sửa" onClick={() => onEdit(item)}>
                                <Edit size={14} />
                            </button>
                            <button className="btn-action delete" title="Xóa" onClick={() => onDelete('genre', getItemId(item))}>
                                <Trash2 size={14} />
                            </button>
                        </td>
                    </tr>
                );

            default:
                return null;
        }
    };

    return (
        <div className="data-table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((column, index) => (
                            <th key={index}>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map(item => renderTableRow(item))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="no-data">
                                <div className="empty-state">
                                    <AlertCircle size={32} />
                                    <p>{searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu. Thử tải lại?'}</p>
                                    {!searchTerm && <button onClick={onRefresh}>Tải lại</button>}
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable;