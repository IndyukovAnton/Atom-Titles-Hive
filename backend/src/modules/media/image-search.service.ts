import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

export interface CoverImage {
  id: string;
  url: string;
  thumbnail: string;
  source: string;
}

interface BingImageMetadata {
  murl?: string;
  turl?: string;
}

@Injectable()
export class ImageSearchService {
  private readonly logger = new Logger(ImageSearchService.name);

  // Кеш результатов: query -> все найденные URL изображений
  private searchCache = new Map<string, CoverImage[]>();

  /**
   * Поиск обложек через Bing Images.
   *
   * Почему Bing, а не Google: с 2024 года Google Images (udm=2) возвращает
   * noscript-оболочку для любых non-JS клиентов — данные приходят только через
   * последующие XHR, которые невозможно повторить без headless-браузера.
   * Bing отдаёт готовые результаты прямо в HTML: `<a class="iusc" m="{...json...}">`,
   * где JSON содержит `murl` (оригинал) и `turl` (Bing-CDN thumbnail).
   */
  async searchImages(query: string, page: number): Promise<CoverImage[]> {
    if (this.searchCache.has(query)) {
      const cachedImages = this.searchCache.get(query)!;
      return this.paginateResults(cachedImages, page);
    }

    try {
      this.logger.log(`Fetching images for query: "${query}"`);

      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://www.bing.com/images/search?q=${encodedQuery}&first=1&count=35&form=HDRSC2`;

      this.logger.debug(`Request URL: ${searchUrl}`);

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Bing returned ${response.status} for "${query}".`);
        return [];
      }

      const html = await response.text();

      if (html.length < 500) {
        this.logger.warn(
          `Received suspiciously short response (${html.length} bytes). Possible block/captcha.`,
        );
      }

      const allImages = this.parseBingImages(html);

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

  private paginateResults(images: CoverImage[], page: number): CoverImage[] {
    const pageSize = 8;
    const start = page * pageSize;
    return images.slice(start, start + pageSize);
  }

  /**
   * Парсинг Bing Images. Каждая карточка — `<a class="iusc" m='{"murl":..., "turl":...}'>`.
   * Cheerio декодирует HTML-entities в значении атрибута, так что в `m` уже чистый JSON.
   */
  private parseBingImages(html: string): CoverImage[] {
    const $ = cheerio.load(html);
    const images: CoverImage[] = [];
    const seen = new Set<string>();

    $('a.iusc').each((i, el) => {
      if (images.length >= 100) return false;

      const rawMeta = $(el).attr('m');
      if (!rawMeta) return;

      let meta: BingImageMetadata;
      try {
        meta = JSON.parse(rawMeta) as BingImageMetadata;
      } catch {
        return;
      }

      const full = meta.murl;
      const thumb = meta.turl || meta.murl;

      if (!full || !thumb) return;
      if (!/^https?:\/\//i.test(full)) return;
      if (seen.has(full)) return;

      seen.add(full);
      images.push({
        id: `bing-${Date.now()}-${i}`,
        url: full,
        thumbnail: thumb,
        source: 'Bing Images',
      });
    });

    if (images.length === 0) {
      this.logger.warn(
        'No a.iusc entries matched. Checking for captcha/block indicators...',
      );
      if (html.includes('captcha') || html.includes('unusual traffic')) {
        this.logger.error(
          'Bing block detected! Consider using proxy or different approach.',
        );
      }
    }

    return images;
  }

  /**
   * Загрузка изображения и конвертация в base64
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

      return { base64 };
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
