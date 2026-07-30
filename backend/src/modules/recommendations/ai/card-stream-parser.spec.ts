import {
  CARD_CLOSE,
  CARD_OPEN,
  DONE_MARKER,
  createCardStreamParserState,
  extractJsonObject,
  feedCardText,
  stripCardMarkers,
} from './card-stream-parser';

describe('card-stream-parser', () => {
  describe('extractJsonObject', () => {
    it('extracts a simple object', () => {
      expect(extractJsonObject('{"a":1}')).toBe('{"a":1}');
    });

    it('ignores prose around the object', () => {
      expect(extractJsonObject('here: {"a":1} trailing')).toBe('{"a":1}');
    });

    it('handles nested braces and strings with braces', () => {
      const raw = '{"title":"A {B}","nested":{"x":1}}';
      expect(extractJsonObject(`xx ${raw} yy`)).toBe(raw);
    });

    it('returns null when no object', () => {
      expect(extractJsonObject('no json here')).toBeNull();
    });

    it('returns null for incomplete object', () => {
      expect(extractJsonObject('{"a":')).toBeNull();
    });
  });

  describe('feedCardText', () => {
    it('parses a complete card block', () => {
      const state = createCardStreamParserState();
      const text = `${CARD_OPEN}\n{"title":"Inception","type":"movie","genres":["Sci-Fi"],"whyRecommended":"great"}\n${CARD_CLOSE}`;
      const cards = [...feedCardText(state, text)];
      expect(cards).toHaveLength(1);
      expect(cards[0]).toMatchObject({ title: 'Inception', type: 'movie' });
      expect(state.inCard).toBe(false);
    });

    it('handles incremental chunks across calls', () => {
      const state = createCardStreamParserState();
      expect([...feedCardText(state, `${CARD_OPEN}\n{"title":"Part`)]).toEqual(
        [],
      );
      expect(state.inCard).toBe(true);
      const cards = [
        ...feedCardText(
          state,
          `","type":"anime","genres":[],"whyRecommended":"x"}\n${CARD_CLOSE}`,
        ),
      ];
      expect(cards).toHaveLength(1);
      expect(cards[0]).toMatchObject({ title: 'Part', type: 'anime' });
    });

    it('skips malformed JSON inside markers', () => {
      const state = createCardStreamParserState();
      const text = `${CARD_OPEN}\n{not-json}\n${CARD_CLOSE}`;
      expect([...feedCardText(state, text)]).toEqual([]);
    });

    it('detects DONE marker', () => {
      const state = createCardStreamParserState();
      Array.from(feedCardText(state, `some text ${DONE_MARKER}`));
      expect(state.sawDoneMarker).toBe(true);
    });

    it('parses multiple cards in one chunk', () => {
      const state = createCardStreamParserState();
      const card = (t: string) =>
        `${CARD_OPEN}{"title":"${t}","type":"movie","genres":[],"whyRecommended":"r"}${CARD_CLOSE}`;
      const cards = [...feedCardText(state, card('A') + card('B'))];
      expect(cards.map((c) => (c as { title: string }).title)).toEqual([
        'A',
        'B',
      ]);
    });
  });

  describe('stripCardMarkers', () => {
    it('removes markers and DONE', () => {
      expect(
        stripCardMarkers(`${CARD_OPEN} hello ${CARD_CLOSE} ${DONE_MARKER}`),
      ).toBe('hello');
    });
  });
});
