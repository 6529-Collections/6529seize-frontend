import React from 'react';
import { render } from '@testing-library/react';
import EmojiPlugin, { EMOJI_MATCH_REGEX } from '@/components/drops/create/lexical/plugins/emoji/EmojiPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEmoji } from '@/contexts/EmojiContext';

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: jest.fn(),
}));

jest.mock('@/components/drops/create/lexical/nodes/EmojiNode', () => ({
  EmojiNode: class {},
}));

jest.mock('@/contexts/EmojiContext', () => ({
  useEmoji: jest.fn(),
}));

jest.mock('lexical', () => {
  class MockTextNode {
    private text: string;

    constructor(text: string) {
      this.text = text;
    }

    getTextContent() {
      return this.text;
    }

    setTextContent(text: string) {
      this.text = text;
    }

    insertAfter() {}

    remove() {}

    getKey() {
      return 'key';
    }
  }

  return {
    $getRoot: jest.fn(() => ({ getAllTextNodes: () => [] })),
    $getSelection: jest.fn(() => null),
    $isRangeSelection: jest.fn(() => false),
    $createRangeSelection: jest.fn(() => ({
      anchor: { set: jest.fn() },
      focus: { set: jest.fn() },
    })),
    $setSelection: jest.fn(),
    TextNode: MockTextNode,
    LexicalEditor: class {},
  };
});

const useContextMock = useLexicalComposerContext as jest.Mock;
const useEmojiMock = useEmoji as jest.Mock;

beforeEach(() => {
  useEmojiMock.mockReturnValue({
    emojiMap: [
      {
        id: 'custom',
        name: 'custom',
        category: 'custom',
        emojis: [{ id: 'smile', name: 'Smile', keywords: 'happy', skins: [{ src: '' }] }],
      },
    ],
    findNativeEmoji: jest.fn(() => null),
  });
});

describe('EmojiPlugin', () => {
  it('matches emoji regex correctly', () => {
    const text = 'say :smile: and :joy:';
    const matches = Array.from(text.matchAll(EMOJI_MATCH_REGEX)).map((match) => match[1]);
    expect(matches).toEqual(['smile', 'joy']);
  });

  it('calls update when emoji text detected', () => {
    let listener: (text: string) => void = () => undefined;
    const update = jest.fn((callback: () => void) => callback());
    const editor = {
      update,
      registerTextContentListener: jest.fn((cb: typeof listener) => {
        listener = cb;
        return () => undefined;
      }),
    } as any;

    useContextMock.mockReturnValue([editor]);
    render(<EmojiPlugin />);

    expect(update).toHaveBeenCalledTimes(1);

    listener('hello :smile:');
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('does not update when listener text has no colon', () => {
    const update = jest.fn((callback: () => void) => callback());
    const register = jest.fn(() => () => undefined);

    useContextMock.mockReturnValue([
      {
        update,
        registerTextContentListener: register,
      },
    ]);

    render(<EmojiPlugin />);

    const listener = register.mock.calls[0][0] as (text: string) => void;
    listener('nothing');

    expect(update).toHaveBeenCalledTimes(1);
  });

  it('regex captures id including surrounding colons', () => {
    const match = ':smile:'.match(EMOJI_MATCH_REGEX);
    expect(match?.[0]).toBe(':smile:');
  });
});
