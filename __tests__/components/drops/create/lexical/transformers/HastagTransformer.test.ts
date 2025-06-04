import { HASHTAG_TRANSFORMER } from '../../../../../../components/drops/create/lexical/transformers/HastagTransformer';
import { $createHashtagNode } from '../../../../../../components/drops/create/lexical/nodes/HashtagNode';

jest.mock('../../../../../../components/drops/create/lexical/nodes/HashtagNode', () => ({
  $createHashtagNode: jest.fn((text) => ({ type: 'hashtag', getTextContent: () => text })),
  $isHashtagNode: jest.fn((n) => n && n.type === 'hashtag'),
  HashtagNode: class {},
}));

describe('HASHTAG_TRANSFORMER', () => {
  it('exports hashtag nodes correctly', () => {
    const node = { type: 'hashtag', getTextContent: () => '#tag' };
    expect(HASHTAG_TRANSFORMER.export(node)).toBe('#[tag]');
    expect(HASHTAG_TRANSFORMER.export({} as any)).toBeNull();
  });

  it('matches hashtags with regex', () => {
    expect('#hello'.match(HASHTAG_TRANSFORMER.regExp)).toBeTruthy();
    expect(HASHTAG_TRANSFORMER.importRegExp.test('#hello')).toBe(true);
    expect(HASHTAG_TRANSFORMER.trigger).toBe('#');
    expect(HASHTAG_TRANSFORMER.type).toBe('text-match');
  });
});
