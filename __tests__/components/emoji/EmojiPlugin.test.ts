import { EMOJI_MATCH_REGEX } from '../../../components/drops/create/lexical/plugins/emoji/EmojiPlugin';

describe('EmojiPlugin regex', () => {
  it('matches emoji shortcodes', () => {
    const text = 'hello :smile: world :wave:';
    const matches = Array.from(text.matchAll(EMOJI_MATCH_REGEX)).map(m => m[1]);
    expect(matches).toEqual(['smile','wave']);
  });

  it('returns empty when no emoji', () => {
    const text = 'no emoji here';
    expect(Array.from(text.matchAll(EMOJI_MATCH_REGEX))).toHaveLength(0);
  });
});
