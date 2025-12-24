// src/components/admin/FormModal.jsx
import { X, Save, Loader2 } from 'lucide-react';
import FormFields from './FormFields';

function FormModal({
    show,
    isEdit,
    activeTab,
    formData,
    formErrors,
    onClose,
    onSubmit,
    onFormDataChange,
    saving,
    artists,
    albumsWithArtists,
    genres
}) {
    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3>{isEdit ? 'Sửa' : 'Thêm mới'} {activeTab}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="modal-body">
                        <FormFields
                            activeTab={activeTab}
                            formData={formData}
                            formErrors={formErrors}
                            onFormDataChange={onFormDataChange}
                            isEdit={isEdit}
                            artists={artists}
                            albumsWithArtists={albumsWithArtists}
                            genres={genres}
                        />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 size={16} className="spinner-small" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    {isEdit ? 'Cập nhật' : 'Lưu'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default FormModal;