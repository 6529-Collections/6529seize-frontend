import { MENTION_TRANSFORMER } from '../../../../../../components/drops/create/lexical/transformers/MentionTransformer';
import { $isMentionNode } from '../../../../../../components/drops/create/lexical/nodes/MentionNode';

jest.mock('../../../../../../components/drops/create/lexical/nodes/MentionNode', () => ({
  $isMentionNode: jest.fn((n: any) => n && n.type === 'mention'),
  MentionNode: class {},
}));

const isMentionNode = $isMentionNode as jest.Mock;

describe('MENTION_TRANSFORMER', () => {
  it('exports mention nodes correctly', () => {
    const node = { type: 'mention', getTextContent: () => '@john' } as any;
    expect(MENTION_TRANSFORMER.export(node)).toBe('@[john]');
    expect(MENTION_TRANSFORMER.export({} as any)).toBeNull();
    expect(isMentionNode).toHaveBeenCalled();
  });

  it('basic config', () => {
    expect(MENTION_TRANSFORMER.regExp.test('@abc')).toBe(true);
    expect(MENTION_TRANSFORMER.importRegExp.test('@abc')).toBe(true);
    const obj = {} as any;
    expect(MENTION_TRANSFORMER.replace(obj)).toBe(obj);
    expect(MENTION_TRANSFORMER.trigger).toBe('@');
    expect(MENTION_TRANSFORMER.type).toBe('text-match');
  });
});
