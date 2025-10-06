import { ImageNode, $createImageNode, $isImageNode } from '@/components/drops/create/lexical/nodes/ImageNode';

jest.mock('lexical', () => {
  class DecoratorNode {
    constructor() {}
    createDOM() { return document.createElement('span'); }
    updateDOM() { return false; }
    exportJSON() { return {}; }
  }
  return { DecoratorNode, $applyNodeReplacement: (n: any) => n };
});

describe('ImageNode', () => {
  it('exports and imports JSON', () => {
    const node = $createImageNode({ src: 'img.png', altText: 'alt', width: 10, height: 20 });
    const json = node.exportJSON();
    expect(json).toEqual({ type: 'image', version: 1, src: 'img.png', altText: 'alt', width: 10, height: 20 });
    const imported = ImageNode.importJSON(json);
    expect(imported.getSrc()).toBe('img.png');
    expect($isImageNode(imported)).toBe(true);
  });

  it('createDOM adds class from theme', () => {
    const node = $createImageNode({ src: 'a.png' });
    const span = node.createDOM({ theme: { image: 'cls' } } as any);
    expect(span.className).toBe('cls');
    expect(node.updateDOM(node, span, {} as any)).toBe(false);
  });
});
