/**
 * Shared marker protocol for CLI adapters (Claude / Codex).
 * Each recommendation is emitted as:
 *
 *   <<<CARD>>>
 *   { ...json... }
 *   <<</CARD>>>
 *
 * After all cards: <<<DONE>>>
 */

export const CARD_OPEN = '<<<CARD>>>';
export const CARD_CLOSE = '<<</CARD>>>';
export const DONE_MARKER = '<<<DONE>>>';

export const CLI_CARD_FORMAT_SUFFIX = `
=== ВЫХОДНОЙ ФОРМАТ — ВАЖНО ===
Каждую рекомендацию отдавай в виде блока ровно такого вида (включая маркеры):

${CARD_OPEN}
{"title":"...","originalTitle":"...","type":"movie","year":2024,"genres":["..."],"whyRecommended":"...","estimatedRating":8.5,"releasedRecently":false}
${CARD_CLOSE}

Поля внутри JSON:
- title (обязательно): строка
- originalTitle (опционально): строка
- type (обязательно): один из 'movie' | 'series' | 'anime' | 'book' | 'game' | 'other'
- year (опционально): число
- genres (обязательно): массив строк
- whyRecommended (обязательно): строка ≤ 300 символов
- estimatedRating (опционально): число 1..10
- releasedRecently (опционально): boolean

Между блоками не пиши ничего лишнего. После всех блоков выведи строку: ${DONE_MARKER}.

Если для оценки актуальности нужен веб-поиск — используй встроенный инструмент поиска.
`;

export interface CardStreamParserState {
  inCard: boolean;
  cardBuf: string;
  sawDoneMarker: boolean;
}

export function createCardStreamParserState(): CardStreamParserState {
  return { inCard: false, cardBuf: '', sawDoneMarker: false };
}

/**
 * Tries to extract the first balanced JSON object from a string. Useful when
 * the model adds whitespace/prose around the JSON.
 */
export function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\') {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return trimmed.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Incremental marker parser. Yields parsed JSON objects (as unknown) each time
 * a complete <<<CARD>>>…<<</CARD>>> block is closed. Updates `state` in place.
 */
export function* feedCardText(
  state: CardStreamParserState,
  text: string,
): Generator<unknown> {
  let cursor = 0;
  while (cursor < text.length) {
    if (!state.inCard) {
      const open = text.indexOf(CARD_OPEN, cursor);
      if (open < 0) {
        if (text.includes(DONE_MARKER, cursor)) state.sawDoneMarker = true;
        break;
      }
      cursor = open + CARD_OPEN.length;
      state.inCard = true;
      state.cardBuf = '';
    } else {
      const close = text.indexOf(CARD_CLOSE, cursor);
      if (close < 0) {
        state.cardBuf += text.slice(cursor);
        break;
      }
      state.cardBuf += text.slice(cursor, close);
      cursor = close + CARD_CLOSE.length;
      state.inCard = false;
      const trimmed = extractJsonObject(state.cardBuf);
      state.cardBuf = '';
      if (!trimmed) continue;
      try {
        yield JSON.parse(trimmed) as unknown;
      } catch {
        // skip malformed card JSON
      }
    }
  }
}

/**
 * Strip card markers from free-form model text so leftovers can be surfaced
 * as "thinking" progress detail.
 */
export function stripCardMarkers(text: string): string {
  return text
    .replace(/<<<\/?CARD>>>/g, '')
    .replace(/<<<DONE>>>/g, '')
    .trim();
}
