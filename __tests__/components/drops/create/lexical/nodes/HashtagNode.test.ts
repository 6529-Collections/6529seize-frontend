jest.mock('lexical', () => ({
  TextNode: class {
    __text: string; constructor(text = '') { this.__text = text; }
    setMode() { return this; }
    toggleDirectionless() { return this; }
    getTextContent() { return this.__text; }
    getMode() { return 'segmented'; }
    isDirectionless() { return true; }
    exportDOM() { const el = document.createElement('span'); el.setAttribute('data-lexical-hashtag', 'true'); el.textContent = this.__text; return { element: el }; }
  },
  $applyNodeReplacement: (n: any) => n,
}));

import { $createHashtagNode, $isHashtagNode, HashtagNode } from '../../../../../../components/drops/create/lexical/nodes/HashtagNode';

describe('HashtagNode', () => {
  it('creates hashtag node with correct properties', () => {
    const node = $createHashtagNode('#test');
    expect($isHashtagNode(node)).toBe(true);
    expect(node.getTextContent()).toBe('#test');
    expect(node.getMode()).toBe('segmented');
    expect(node.isDirectionless()).toBe(true);
  });

  it('exports and imports DOM correctly', () => {
    const node = $createHashtagNode('#foo');
    const { element } = node.exportDOM();
    expect(element.getAttribute('data-lexical-hashtag')).toBe('true');

    const map = HashtagNode.importDOM()!;
    const entry = map.span!(element);
    expect(entry).not.toBeNull();
    const result = entry!.conversion(element);
    expect($isHashtagNode(result!.node)).toBe(true);
    expect(result!.node.getTextContent()).toBe('#foo');
  });

  it('identifies non hashtag node', () => {
    expect($isHashtagNode(null)).toBe(false);
    expect($isHashtagNode({} as any)).toBe(false);
  });
});
