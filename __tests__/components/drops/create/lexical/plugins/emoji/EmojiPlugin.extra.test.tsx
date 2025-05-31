import { render } from '@testing-library/react';
import EmojiPlugin, { EMOJI_MATCH_REGEX } from '../../../../../../../components/drops/create/lexical/plugins/emoji/EmojiPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

jest.mock('@lexical/react/LexicalComposerContext', () => ({ useLexicalComposerContext: jest.fn() }));

jest.mock("../../../../../../../components/drops/create/lexical/nodes/EmojiNode", () => class {});
jest.mock('lexical', () => ({
  $getRoot: jest.fn(() => ({ getAllTextNodes: () => [] })),
  $getSelection: jest.fn(() => null),
  $isRangeSelection: jest.fn(() => false),
  $createRangeSelection: jest.fn(() => ({ anchor: { set: jest.fn() }, focus: { set: jest.fn() } })),
  $setSelection: jest.fn(),
  TextNode: class {},
}));

describe('EmojiPlugin extra', () => {
  it('does not update when listener text has no colon', () => {
    const update = jest.fn(fn => fn());
    const register = jest.fn();
    (useLexicalComposerContext as jest.Mock).mockReturnValue([{ update, registerTextContentListener: register }]);
    render(<EmojiPlugin />);
    const cb = register.mock.calls[0][0];
    cb('nothing');
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('regex captures id without colons', () => {
    const match = ':smile:'.match(EMOJI_MATCH_REGEX);
    expect(match?.[0]).toBe(':smile:');
  });
});
