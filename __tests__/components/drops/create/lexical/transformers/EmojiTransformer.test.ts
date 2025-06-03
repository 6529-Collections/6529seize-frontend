import { EMOJI_TRANSFORMER } from '../../../../../../components/drops/create/lexical/transformers/EmojiTransformer';
import { EmojiNode } from '../../../../../../components/drops/create/lexical/nodes/EmojiNode';
import { $applyNodeReplacement } from 'lexical';

jest.mock('lexical', () => ({
  $applyNodeReplacement: jest.fn((n:any)=>n)
}));

const mockEmojiNodeInstance = { __emojiId: 'smile' };

jest.mock('../../../../../../components/drops/create/lexical/nodes/EmojiNode', () => ({
  EmojiNode: jest.fn().mockImplementation(function(this: any, id: string) {
    this.__emojiId = id;
  })
}));

test('exports correct transformer and replaces node', () => {
  const textNode = { replace: jest.fn() } as any;
  ($applyNodeReplacement as jest.Mock).mockReturnValue(mockEmojiNodeInstance);
  
  EMOJI_TRANSFORMER.replace!(textNode, [':smile:', 'smile']);
  
  expect(EmojiNode).toHaveBeenCalledWith('smile');
  expect($applyNodeReplacement).toHaveBeenCalledWith({__emojiId:'smile'});
  expect(textNode.replace).toHaveBeenCalledWith(mockEmojiNodeInstance);
});

test('export function returns emoji markdown only for EmojiNode', () => {
  const node = new (EmojiNode as any)('laugh');
  expect(EMOJI_TRANSFORMER.export!(node as any)).toBe(':laugh:');
  expect(EMOJI_TRANSFORMER.export!({} as any)).toBeNull();
});
