import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

export interface CoverImage {
  id: string;
  url: string;
  thumbnail: string;
  source: string;
}

@Injectable()
export class ImageSearchService {
  private readonly logger = new Logger(ImageSearchService.name);

  // Кеш результатов: query -> все найденные URL изображений
  private searchCache = new Map<string, CoverImage[]>();

  /**
   * Поиск изображений через Google Images
   * @param query Поисковый запрос
   * @param page Страница (смещение)
   * @returns Список изображений для текущей страницы
   */
  async searchImages(query: string, page: number): Promise<CoverImage[]> {
    // 1. Проверяем наличие в кеше
    if (this.searchCache.has(query)) {
      const cachedImages = this.searchCache.get(query)!;
      return this.paginateResults(cachedImages, page);
    }

    // 2. Если нет в кеше, делаем запрос к Google Images
    try {
      this.logger.log(`Fetching images for query: "${query}"`);

      // Используем современный параметр udm=2 для Google Images
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://www.google.com/search?udm=2&q=${encodedQuery}`;

      this.logger.debug(`Request URL: ${searchUrl}`);

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: 'https://www.google.com/',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Google returned ${response.status} for "${query}".`);
        return [];
      }

      const html = await response.text();

      // Сохраним небольшой фрагмент HTML для отладки
      if (html.length < 500) {
        this.logger.warn(
          `Received suspiciously short response (${html.length} bytes). Possible block/captcha.`,
        );
      }

      const allImages = this.parseImageUrls(html);

      this.logger.log(`Found ${allImages.length} images for query: "${query}"`);

      if (allImages.length > 0) {
        this.searchCache.set(query, allImages);
      } else {
        this.logger.warn(
          `No images parsed. HTML length: ${html.length}. First 500 chars: ${html.substring(0, 500)}`,
        );
      }

      return this.paginateResults(allImages, page);
    } catch (error) {
      this.logger.error(
        `Critical error in searchImages: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (error instanceof Error && error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
      return [];
    }
  }

  /**
   * Пагинация результатов из кеша
   */
  private paginateResults(images: CoverImage[], page: number): CoverImage[] {
    const pageSize = 8; // Показываем по 8 изображений за раз (2 ряда по 4)
    const start = page * pageSize;
    return images.slice(start, start + pageSize);
  }

  /**
   * Парсинг HTML для извлечения ссылок на изображения
   * Google Images отдает разный HTML для разных User-Agent.
   * Для десктопного Chrome (gbv=1) обычно используются паттерны с JSON внутри скриптов или атрибуты данных.
   */
  private parseImageUrls(html: string): CoverImage[] {
    const $ = cheerio.load(html);
    const images: CoverImage[] = [];

    // Стратегия 1: Извлечение из JSON в script тегах
    // Google Images часто встраивает данные в AF_initDataCallback или подобные функции
    try {
      const scripts = $('script').toArray();

      for (const script of scripts) {
        const scriptContent = $(script).html() || '';

        // Ищем паттерны с URL изображений
        // Google использует различные форматы, попробуем найти массивы с URL
        const urlMatches = scriptContent.match(
          /https?:\/\/[^"'\s)]+\.(?:jpg|jpeg|png|webp|gif)/gi,
        );

        if (urlMatches && urlMatches.length > 0) {
          // Фильтруем только уникальные и релевантные URL
          const uniqueUrls = [...new Set(urlMatches)].filter((url) => {
            // Исключаем служебные изображения Google
            return (
              !url.includes('gstatic.com') &&
              !url.includes('google.com/images/') &&
              !url.includes('googleusercontent.com/gadgets') &&
              url.length < 2000
            ); // Слишком длинные URL скорее всего data:image
          });

          uniqueUrls.forEach((url, index) => {
            if (images.length < 100) {
              // Ограничиваем до 100 изображений
              images.push({
                id: `img-json-${Date.now()}-${index}`,
                url: url,
                thumbnail: url, // Используем тот же URL для миниатюры
                source: 'Google Images',
              });
            }
          });
        }
      }
    } catch (e) {
      this.logger.debug('Failed to extract from scripts: ' + e);
    }

    // Стратегия 2: Парсинг img тегов (для старой версии)
    if (images.length === 0) {
      $('img').each((i, el) => {
        const img = $(el);
        const src = img.attr('src') || img.attr('data-src');

        if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
          // Пропускаем служебные изображения
          if (
            !src.includes('gstatic.com') &&
            !src.includes('google.com/images/branding')
          ) {
            images.push({
              id: `img-tag-${Date.now()}-${i}`,
              url: src,
              thumbnail: src,
              source: 'Google Images',
            });
          }
        }
      });
    }

    // Стратегия 3: Поиск ссылок на изображения в href
    if (images.length === 0) {
      $('a[href*="imgurl="]').each((i, el) => {
        try {
          const href = $(el).attr('href');
          if (href) {
            const urlObj = new URL(href, 'https://www.google.com');
            const imgUrl = urlObj.searchParams.get('imgurl');

            if (
              imgUrl &&
              (imgUrl.startsWith('http://') || imgUrl.startsWith('https://'))
            ) {
              images.push({
                id: `img-href-${Date.now()}-${i}`,
                url: imgUrl,
                thumbnail: imgUrl,
                source: 'Google Images',
              });
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
    }

    // Debug: если ничего не нашли
    if (images.length === 0) {
      this.logger.warn(
        'Failed all parsing strategies. Checking for captcha/block indicators...',
      );
      if (html.includes('captcha') || html.includes('unusual traffic')) {
        this.logger.error(
          'Google CAPTCHA detected! Consider using proxy or different approach.',
        );
      }
    }

    return images;
  }

  /**
   * Загрузка изображения и конвертация в base64
   * @param url URL изображения
   */
  async downloadImage(url: string): Promise<{ base64: string }> {
    try {
      this.logger.log(`Downloading image: ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to download image: ${response.status} ${response.statusText}`,
        );
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      // Определяем mime type (попробуем из заголовков или дефолтный)
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return { base64: base64 };
    } catch (error) {
      this.logger.error(`Failed to download image: ${url}`, error);
      throw error;
    }
  }

  /**
   * Очистка кеша
   */
  clearCache(query?: string) {
    if (query) {
      this.searchCache.delete(query);
      this.logger.log(`Cache cleared for query: "${query}"`);
    } else {
      this.searchCache.clear();
      this.logger.log('Cache cleared completely');
    }
  }
}
