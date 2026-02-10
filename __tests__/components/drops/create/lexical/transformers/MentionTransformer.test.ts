import { MENTION_TRANSFORMER } from '@/components/drops/create/lexical/transformers/MentionTransformer';
import { $isMentionNode } from '@/components/drops/create/lexical/nodes/MentionNode';

jest.mock('@/components/drops/create/lexical/nodes/MentionNode', () => ({
  $isMentionNode: jest.fn((n: any) => n && n.type === 'mention'),
  $createMentionNode: jest.fn((text: string) => ({ type: 'mention', text })),
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
    // Both regExp and importRegExp should match bracketed format only
    expect(MENTION_TRANSFORMER.regExp.test('@[abc]')).toBe(true);
    expect(MENTION_TRANSFORMER.regExp.test('@abc')).toBe(false);
    expect(MENTION_TRANSFORMER.importRegExp.test('@[abc]')).toBe(true);
    expect(MENTION_TRANSFORMER.importRegExp.test('@abc')).toBe(false);
    expect(MENTION_TRANSFORMER.trigger).toBe('@');
    expect(MENTION_TRANSFORMER.type).toBe('text-match');
  });

  it('replace function handles bracketed mentions', () => {
    const mockTextNode = {
      getTextContent: jest.fn(() => '@[john]'),
      replace: jest.fn()
    };
    const match = ['@[john]'];
    
    MENTION_TRANSFORMER.replace(mockTextNode as any, match as any);
    
    expect(mockTextNode.replace).toHaveBeenCalledWith({
      type: 'mention',
      text: '@john'
    });
  });

  it('replace function skips when match not in text node', () => {
    const mockTextNode = {
      getTextContent: jest.fn(() => 'different text'),
      replace: jest.fn()
    };
    const match = ['@[john]'];
    
    MENTION_TRANSFORMER.replace(mockTextNode as any, match as any);
    
    // Should not call replace when match is not in text node
    expect(mockTextNode.replace).not.toHaveBeenCalled();
  });
});
