import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmojiNode } from '@/components/drops/create/lexical/nodes/EmojiNode';

jest.mock('lexical', () => ({
  DecoratorNode: class MockDecoratorNode {
    __key?: string | undefined;
    constructor(key?: string) {
      this.__key = key;
    }
  }
}));

jest.mock('@/contexts/EmojiContext', () => ({
  useEmoji: jest.fn()
}));

const { useEmoji } = require('@/contexts/EmojiContext');

describe('EmojiNode', () => {
  it('exports and imports JSON correctly', () => {
    const node = new EmojiNode('smile');
    const json = node.exportJSON();
    expect(json).toEqual({ type:'emoji', version:1, emojiId:'smile' });
    const restored = EmojiNode.importJSON(json);
    expect(restored.exportJSON()).toEqual(json);
  });

  it('renders emoji image when found', () => {
    const emoji = { id:'smile', name:'smile', keywords:'smile', skins:[{ src:'img.png' }] };
    useEmoji.mockReturnValue({
      emojiMap:[{ id:'custom', name:'custom', category:'custom', emojis:[emoji] }],
      loading:false,
      categories:[],
      categoryIcons:{},
      findNativeEmoji: jest.fn(),
      findCustomEmoji: jest.fn((id:string) => (id.replaceAll(':','') === 'smile' ? emoji : null))
    });
    const node = new EmojiNode('smile');
    const element = node.decorate(null as any, {} as any);
    render(<>{element}</>);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'img.png');
    expect(img).toHaveAttribute('alt', 'smile');
  });

  it('renders placeholder when emoji missing', () => {
    useEmoji.mockReturnValue({
      emojiMap:[{ id:'custom', name:'custom', category:'custom', emojis:[] }],
      loading:false,
      categories:[],
      categoryIcons:{},
      findNativeEmoji: jest.fn().mockReturnValue(null),
      findCustomEmoji: jest.fn().mockReturnValue(null)
    });
    const node = new EmojiNode('unknown');
    const element = node.decorate(null as any, {} as any);
    render(<>{element}</>);
    expect(screen.getByText(':unknown:')).toBeInTheDocument();
  });
});
