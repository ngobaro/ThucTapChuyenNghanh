// src/components/admin/TableToolbar.jsx
import { Search, X, Plus } from 'lucide-react';

function TableToolbar({
    searchTerm,
    onSearchChange,
    onClearSearch,
    onCreateNew,
    activeTab
}) {
    // Ẩn nút Thêm mới khi tab là 'users'
    const showCreateButton = activeTab !== 'users';

    return (
        <div className="table-toolbar">
            <div className="search-container">
                <Search size={18} />
                <input
                    type="text"
                    placeholder={`Tìm kiếm ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchTerm && (
                    <button className="clear-btn" onClick={onClearSearch}>
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="toolbar-actions">
                {showCreateButton && (
                    <button className="btn-create" onClick={onCreateNew}>
                        <Plus size={16} />
                        Thêm mới
                    </button>
                )}
            </div>
        </div>
    );
}

export default TableToolbar;