// src/utils/dashboardUtils.js

/**
 * Normalize dữ liệu trả về từ API
 */
export const normalizeApiResponse = (response) => {
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.result)) return response.data.result;
    if (Array.isArray(response.data?.data)) return response.data.data;
    return [];
};

/**
 * Lấy ID từ item dựa trên tab type
 */
export const getItemId = (item, tabType) => {
    switch (tabType) {
        case 'songs': return item.songId || item.id;
        case 'users': return item.iduser || item.id;
        case 'artists': return item.idartist || item.id;
        case 'albums': return item.idalbum || item.id;
        case 'genres': return item.idgenre || item.id;
        default: return item.id;
    }
};

/**
 * Format duration string
 */
export const formatDuration = (duration) => {
    if (!duration) return '00:00';
    let dur = duration.trim();
    if (!dur.includes(':')) dur = '00:' + dur;
    if (dur.split(':').length === 2) dur += ':00';
    return dur;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Get empty form data based on tab type
 */
export const getEmptyFormDataByTab = (tabType) => {
    switch (tabType) {
        case 'songs':
            return {
                title: '',
                idartist: '',
                idalbum: '',
                idgenre: '',
                duration: '',
                releasedate: new Date().toISOString().split('T')[0],
                views: '0',
                avatar: '',
                path: '',
                lyrics: ''
            };
        case 'users':
            return { username: '', email: '', password: '', role: 'USER' };
        case 'artists':
            return { artistname: '', infomation: '' };
        case 'albums':
            return { albumname: '', releaseyear: new Date().getFullYear(), idartist: '' };
        case 'genres':
            return { genrename: '' };
        default:
            return {};
    }
};

/**
 * Clean form data before sending to API
 */
export const cleanFormData = (data) => {
    const cleaned = { ...data };

    // Convert to numbers
    if (cleaned.idalbum && cleaned.idalbum !== '') cleaned.idalbum = Number(cleaned.idalbum);
    if (cleaned.idgenre && cleaned.idgenre !== '') cleaned.idgenre = Number(cleaned.idgenre);
    if (cleaned.releaseyear) cleaned.releaseyear = Number(cleaned.releaseyear);

    // Format duration
    if (cleaned.duration) {
        cleaned.duration = formatDuration(cleaned.duration);
    }

    // Remove empty optional fields
    ['avatar', 'releasedate'].forEach(key => {
        if (cleaned[key] === '' || cleaned[key] == null) delete cleaned[key];
    });

    return cleaned;
};

/**
 * Table columns by tab type
 */
export const getTableColumnsByTab = (tabType) => {
    switch (tabType) {
        case 'songs':
            return ['ID', 'Tiêu đề', 'Nghệ sĩ', 'Album', 'Thể loại', 'Thời lượng', 'Lượt nghe', 'Actions'];
        case 'users':
            return ['ID', 'Username', 'Email', 'Vai trò', 'Actions'];
        case 'artists':
            return ['ID', 'Tên nghệ sĩ', 'Mô tả', 'Actions'];
        case 'albums':
            return ['ID', 'Tên album', 'Nghệ sĩ', 'Năm', 'Actions'];
        case 'genres':
            return ['ID', 'Tên thể loại', 'Actions'];
        default:
            return [];
    }
};