jest.mock('lexical', () => ({
  TextNode: class {
    __text: string; format:any; detail:any; mode:string = 'segmented'; style:any; constructor(text = '') { this.__text = text; }
    setMode(m:string) { this.mode = m; return this; }
    toggleDirectionless() { return this; }
    getTextContent() { return this.__text; }
    getMode() { return this.mode; }
    isDirectionless() { return true; }
    setTextContent(t:string){ this.__text = t; return this; }
    setFormat(f:any){ this.format = f; return this; }
    setDetail(d:any){ this.detail = d; return this; }
    setStyle(s:any){ this.style = s; return this; }
    exportJSON(){ return { text:this.__text, format:this.format, detail:this.detail, mode:this.mode, style:this.style }; }
    exportDOM(){ const el=document.createElement('span'); el.setAttribute('data-lexical-hashtag','true'); el.textContent=this.__text; return { element: el }; }
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

  it('clones and imports from json', () => {
    const node = $createHashtagNode('#foo');
    const cloned = HashtagNode.clone(node);
    expect(cloned).not.toBe(node);
    expect(cloned.getTextContent()).toBe('#foo');

    const imported = HashtagNode.importJSON({
      hashtagName:'#bar', text:'#bar', format:0, detail:0, mode:'segmented', style:'', type:'hashtag', version:1
    } as any);
    expect(imported.getTextContent()).toBe('#bar');
  });
});
