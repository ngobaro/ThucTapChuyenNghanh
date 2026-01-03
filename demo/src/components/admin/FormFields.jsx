// src/components/admin/FormFields.jsx
function FormFields({
    activeTab,
    formData,
    formErrors,
    onFormDataChange,
    isEdit,
    artists,
    albumsWithArtists,
    genres
}) {
    const handleChange = (field, value) => {
        onFormDataChange({ ...formData, [field]: value });
    };

    switch (activeTab) {
        case 'songs':
            return (
                <>
                    <div className="form-group">
                        <label>Tiêu đề *</label>
                        <input
                            type="text"
                            value={formData.title || ''}
                            onChange={e => handleChange('title', e.target.value)}
                            className={formErrors.title ? 'error' : ''}
                        />
                        {formErrors.title && <div className="error-text">{formErrors.title}</div>}
                    </div>

                    <div className="form-group">
                        <label>Nghệ sĩ *</label>
                        <select
                            value={formData.idartist || ''}
                            onChange={e => handleChange('idartist', e.target.value)}
                            className={formErrors.idartist ? 'error' : ''}
                        >
                            <option value="">-- Chọn nghệ sĩ --</option>
                            {artists.map(artist => (
                                <option
                                    key={artist.idartist || artist.id}
                                    value={artist.idartist || artist.id}
                                >
                                    {artist.artistname || artist.name}
                                </option>
                            ))}
                        </select>
                        {formErrors.idartist && <div className="error-text">{formErrors.idartist}</div>}
                    </div>

                    <div className="form-group">
                        <label>Album (tùy chọn)</label>
                        <select
                            value={formData.idalbum || ''}
                            onChange={e => handleChange('idalbum', e.target.value)}
                        >
                            <option value="">-- Không thuộc album --</option>
                            {albumsWithArtists.map(album => (
                                <option
                                    key={album.idalbum || album.id}
                                    value={album.idalbum || album.id}
                                >
                                    {album.albumname || album.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Thể loại (tùy chọn)</label>
                        <select
                            value={formData.idgenre || ''}
                            onChange={e => handleChange('idgenre', e.target.value)}
                        >
                            <option value="">-- Không có thể loại --</option>
                            {genres.map(genre => (
                                <option
                                    key={genre.idgenre || genre.id}
                                    value={genre.idgenre || genre.id}
                                >
                                    {genre.genrename || genre.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Thời lượng (tùy chọn)</label>
                        <input
                            type="text"
                            value={formData.duration || ''}
                            onChange={e => handleChange('duration', e.target.value)}
                            placeholder="VD: 04:12"
                        />
                    </div>

                    <div className="form-group">
                        <label>Ngày phát hành (tùy chọn)</label>
                        <input
                            type="date"
                            value={formData.releasedate || ''}
                            onChange={e => handleChange('releasedate', e.target.value)}
                        />
                    </div>

                    {/* ❌ KHÔNG CÓ INPUT VIEWS */}

                    <div className="form-group">
                        <label>Ảnh bìa (tùy chọn)</label>
                        <input
                            type="text"
                            value={formData.avatar || ''}
                            onChange={e => handleChange('avatar', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Đường dẫn file *</label>
                        <input
                            type="text"
                            value={formData.path || ''}
                            onChange={e => handleChange('path', e.target.value)}
                            className={formErrors.path ? 'error' : ''}
                        />
                        {formErrors.path && <div className="error-text">{formErrors.path}</div>}
                    </div>

                    <div className="form-group">
                        <label>Lời bài hát (tùy chọn)</label>
                        <textarea
                            value={formData.lyrics || ''}
                            onChange={e => handleChange('lyrics', e.target.value)}
                            rows={4}
                        />
                    </div>
                </>
            );

        case 'users':
            return (
                <>
                    <div className="form-group">
                        <label>Username *</label>
                        <input
                            type="text"
                            value={formData.username || ''}
                            onChange={e => handleChange('username', e.target.value)}
                            placeholder="Nhập username"
                            className={formErrors.username ? 'error' : ''}
                            disabled={isEdit}
                        />
                        {formErrors.username && <div className="error-text">{formErrors.username}</div>}
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            value={formData.email || ''}
                            onChange={e => handleChange('email', e.target.value)}
                            placeholder="Nhập email"
                            className={formErrors.email ? 'error' : ''}
                        />
                        {formErrors.email && <div className="error-text">{formErrors.email}</div>}
                    </div>

                    {!isEdit && (
                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                value={formData.password || ''}
                                onChange={e => handleChange('password', e.target.value)}
                                placeholder="Nhập mật khẩu"
                                className={formErrors.password ? 'error' : ''}
                            />
                            {formErrors.password && <div className="error-text">{formErrors.password}</div>}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Vai trò</label>
                        <select
                            value={formData.role || 'USER'}
                            onChange={e => handleChange('role', e.target.value)}
                        >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                </>
            );

        case 'artists':
            return (
                <>
                    <div className="form-group">
                        <label>Tên nghệ sĩ *</label>
                        <input
                            type="text"
                            value={formData.artistname || ''}
                            onChange={e => handleChange('artistname', e.target.value)}
                            placeholder="Nhập tên nghệ sĩ"
                            className={formErrors.artistname ? 'error' : ''}
                        />
                        {formErrors.artistname && <div className="error-text">{formErrors.artistname}</div>}
                    </div>

                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                            value={formData.infomation || ''}
                            onChange={e => handleChange('infomation', e.target.value)}
                            placeholder="Nhập mô tả về nghệ sĩ"
                            rows={3}
                        />
                    </div>
                </>
            );

        case 'albums':
            return (
                <>
                    <div className="form-group">
                        <label>Tên album *</label>
                        <input
                            type="text"
                            value={formData.albumname || ''}
                            onChange={e => handleChange('albumname', e.target.value)}
                            placeholder="Nhập tên album"
                            className={formErrors.albumname ? 'error' : ''}
                        />
                        {formErrors.albumname && <div className="error-text">{formErrors.albumname}</div>}
                    </div>

                    <div className="form-group">
                        <label>Năm phát hành</label>
                        <input
                            type="number"
                            value={formData.releaseyear || new Date().getFullYear()}
                            onChange={e => handleChange('releaseyear', parseInt(e.target.value) || '')}
                            placeholder="2024"
                        />
                    </div>

                    <div className="form-group">
                        <label>Nghệ sĩ</label>
                        <select
                            value={formData.idartist || ''}
                            onChange={e => handleChange('idartist', e.target.value)}
                        >
                            <option value="">-- Chọn nghệ sĩ --</option>
                            {artists.map(artist => (
                                <option
                                    key={artist.idartist || artist.id}
                                    value={artist.idartist || artist.id}
                                >
                                    {artist.artistname || artist.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            );

        case 'genres':
            return (
                <div className="form-group">
                    <label>Tên thể loại *</label>
                    <input
                        type="text"
                        value={formData.genrename || ''}
                        onChange={e => handleChange('genrename', e.target.value)}
                        placeholder="Nhập tên thể loại"
                        className={formErrors.genrename ? 'error' : ''}
                    />
                    {formErrors.genrename && <div className="error-text">{formErrors.genrename}</div>}
                </div>
            );

        default:
            return null;
    }
}

export default FormFields;