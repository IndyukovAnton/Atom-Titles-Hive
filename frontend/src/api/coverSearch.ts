import api from './client';

export interface CoverImage {
  id: string;
  url: string;
  thumbnail: string;
  source: string;
}

export const searchCovers = async (
  query: string,
  page: number = 0,
): Promise<CoverImage[]> => {
  const response = await api.get('/media/search-covers', {
    params: { query, page },
  });
  return response.data;
};

export const downloadCover = async (url: string): Promise<string> => {
  const response = await api.post('/media/download-cover', { url });
  // Backend returns { base64: "..." }
  return `data:image/jpeg;base64,${response.data.base64}`;
};
