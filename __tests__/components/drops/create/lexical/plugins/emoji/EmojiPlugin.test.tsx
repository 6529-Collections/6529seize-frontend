import { render } from '@testing-library/react';
import EmojiPlugin from '../../../../../../../components/drops/create/lexical/plugins/emoji/EmojiPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

jest.mock('@lexical/react/LexicalComposerContext', () => ({ useLexicalComposerContext: jest.fn() }));
jest.mock('../../../../../../../components/drops/create/lexical/nodes/EmojiNode', () => class {});

jest.mock('lexical', () => ({
  $getRoot: jest.fn(() => ({ getAllTextNodes: () => [] })),
  $getSelection: jest.fn(() => null),
  $isRangeSelection: jest.fn(() => false),
  $createRangeSelection: jest.fn(() => ({ anchor: { set: jest.fn() }, focus: { set: jest.fn() } })),
  $setSelection: jest.fn(),
  TextNode: class {},
}));

describe('EmojiPlugin', () => {
  it('registers listener and triggers update', () => {
    const update = jest.fn((fn) => fn());
    const register = jest.fn();
    (useLexicalComposerContext as jest.Mock).mockReturnValue([{ update, registerTextContentListener: register }]);

    render(<EmojiPlugin />);
    expect(update).toHaveBeenCalled();

    const cb = register.mock.calls[0][0];
    cb(':smile:');
    expect(update).toHaveBeenCalledTimes(2);
  });
});
import { EMOJI_MATCH_REGEX } from '../../../../../../../components/drops/create/lexical/plugins/emoji/EmojiPlugin';

describe('EmojiPlugin additional', () => {
  it('ignores text without emoji pattern', () => {
    const update = jest.fn((fn) => fn());
    const register = jest.fn();
    (useLexicalComposerContext as jest.Mock).mockReturnValue([{ update, registerTextContentListener: register }]);
    render(<EmojiPlugin />);
    const cb = register.mock.calls[0][0];
    cb('hello');
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('EMOJI_MATCH_REGEX matches correctly', () => {
    const str = 'a :smile: b :wave:';
    const matches = str.match(EMOJI_MATCH_REGEX) || [];
    expect(matches).toEqual([':smile:', ':wave:']);
  });
});
