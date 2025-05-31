import { render } from '@testing-library/react';
import React from 'react';
import EmojiPlugin, { EMOJI_MATCH_REGEX } from '../../../../../../../components/drops/create/lexical/plugins/emoji/EmojiPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

jest.mock('@lexical/react/LexicalComposerContext');

// minimal lexical mocks
jest.mock('lexical', () => ({
  $getRoot: jest.fn(() => ({ getAllTextNodes: () => [] })),
  $getSelection: jest.fn(() => null),
  $isRangeSelection: jest.fn(() => false),
  $createRangeSelection: jest.fn(() => ({ anchor: { set: jest.fn() }, focus: { set: jest.fn() } })),
  $setSelection: jest.fn(),
  TextNode: class {
    private text: string;
    constructor(text: string) { this.text = text; }
    getTextContent() { return this.text; }
    setTextContent(_t: string) { this.text = _t; }
    insertAfter() {}
    remove() {}
    getKey() { return 'k'; }
  },
  LexicalEditor: class {},
}));

jest.mock('../../../../../../../components/drops/create/lexical/nodes/EmojiNode', () => ({
  EmojiNode: class {},
}));

const useContextMock = useLexicalComposerContext as jest.Mock;

describe('EmojiPlugin', () => {
  it('matches emoji regex correctly', () => {
    const text = 'say :smile: and :joy:';
    const matches = Array.from(text.matchAll(EMOJI_MATCH_REGEX)).map(m => m[1]);
    expect(matches).toEqual(['smile', 'joy']);
  });

  it('calls update when emoji text detected', () => {
    let listener: (t: string) => void = () => {};
    const update = jest.fn((cb: any) => cb());
    const editor = {
      update,
      registerTextContentListener: jest.fn((cb: any) => { listener = cb; return () => {}; })
    } as any;
    useContextMock.mockReturnValue([editor]);
    render(<EmojiPlugin />);
    expect(update).toHaveBeenCalledTimes(1);
    listener('hello :smile:');
    expect(update).toHaveBeenCalledTimes(2);
  });
});
