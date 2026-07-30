import axios from './client';
export const aiCardToSavePayload = (card, status, sourceModel) => ({
    title: card.title,
    originalTitle: card.originalTitle,
    type: card.type,
    year: card.year,
    genres: card.genres,
    whyRecommended: card.whyRecommended,
    estimatedRating: card.estimatedRating,
    releasedRecently: card.releasedRecently,
    posterUrl: card.posterUrl,
    sourceModel,
    status,
});
export const libraryApi = {
    // SavedRecommendations
    listConsiderations: async () => {
        const res = await axios.get('/library/considerations');
        return res.data;
    },
    listSavedRecommendations: async (status) => {
        const res = await axios.get('/library/saved-recommendations', { params: status ? { status } : {} });
        return res.data;
    },
    saveRecommendation: async (payload) => {
        const res = await axios.post('/library/saved-recommendations', payload);
        return res.data;
    },
    updateSavedRecommendationStatus: async (id, status) => {
        const res = await axios.patch(`/library/saved-recommendations/${id}/status`, { status });
        return res.data;
    },
    removeSavedRecommendation: async (id) => {
        await axios.delete(`/library/saved-recommendations/${id}`);
    },
    // Media favorites
    listFavoriteMedia: async () => {
        const res = await axios.get('/library/favorites');
        return res.data;
    },
    listFavoriteMediaIds: async () => {
        const res = await axios.get('/library/favorites/ids');
        return res.data;
    },
    addMediaFavorite: async (mediaId) => {
        await axios.put(`/library/favorites/media/${mediaId}`);
    },
    removeMediaFavorite: async (mediaId) => {
        await axios.delete(`/library/favorites/media/${mediaId}`);
    },
};
