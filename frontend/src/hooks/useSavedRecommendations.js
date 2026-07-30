import { useQuery } from '@tanstack/react-query';
import { libraryApi } from '@/api/library';
export const SAVED_RECS_QUERY_KEY = ['saved-recommendations'];
// Все сохранённые AI-рекомендации (considering + favorited) одним кэшем:
// consume-флоу (добавление карточки в библиотеку) инвалидирует этот ключ,
// и бейджи 📌/⭐ на карточках сбрасываются без ручной синхронизации.
export function useSavedRecommendations() {
    return useQuery({
        queryKey: SAVED_RECS_QUERY_KEY,
        queryFn: () => libraryApi.listSavedRecommendations(),
        staleTime: 30 * 1000,
    });
}
