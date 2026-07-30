import api from './client';
export const searchCovers = async (query, page = 0) => {
    const response = await api.get('/media/search-covers', {
        params: { query, page },
    });
    return response.data;
};
export const downloadCover = async (url, thumbnail) => {
    const response = await api.post('/media/download-cover', { url, thumbnail });
    // Backend returns { base64: "..." }
    return `data:image/jpeg;base64,${response.data.base64}`;
};
