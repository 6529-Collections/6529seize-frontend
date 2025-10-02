import { MentionNode, $createMentionNode, $isMentionNode } from '@/components/drops/create/lexical/nodes/MentionNode';
import { $applyNodeReplacement } from 'lexical';

jest.mock('lexical', () => {
  return {
    TextNode: class {
      __text: string;
      __key: any;
      __format = 0;
      __detail = 0;
      __mode = '';
      __style = '';
      constructor(text = '', key?: any) { this.__text = text; this.__key = key; }
      setMode(m: string) { this.__mode = m; return this; }
      toggleDirectionless() { return this; }
      getTextContent() { return this.__text; }
      setTextContent(t: string) { this.__text = t; return this; }
      setFormat(f: any) { this.__format = f; return this; }
      setDetail(d: any) { this.__detail = d; return this; }
      setStyle(s: any) { this.__style = s; return this; }
      exportJSON() { return { text: this.__text, format: this.__format, detail: this.__detail, mode: this.__mode, style: this.__style }; }
      createDOM() { return document.createElement('span'); }
    },
    $applyNodeReplacement: jest.fn((n: any) => n),
  };
});

const applyMock = $applyNodeReplacement as jest.Mock;

describe('MentionNode', () => {
  it('creates and exports correctly', () => {
    const node = $createMentionNode('@bob');
    expect(applyMock).toHaveBeenCalledWith(node);
    expect(node).toBeInstanceOf(MentionNode);
    expect($isMentionNode(node)).toBe(true);

    const json = node.exportJSON();
    expect(json.mentionName).toBe('@bob');
    expect(json.type).toBe('mention');

    const { element } = node.exportDOM();
    expect(element.getAttribute('data-lexical-mention')).toBe('true');
    expect(element.textContent).toBe('@bob');

    const mapping = MentionNode.importDOM()!;
    const span = document.createElement('span');
    span.setAttribute('data-lexical-mention', 'true');
    span.textContent = '@alice';
    const conv = mapping.span!(span)!;
    const newNode = conv.conversion(span).node;
    expect(newNode.__mention).toBe('@alice');
    expect(conv.priority).toBe(1);
    expect(MentionNode.clone(node)).toBeInstanceOf(MentionNode);
    expect(node.isTextEntity()).toBe(true);
    expect(node.canInsertTextBefore()).toBe(false);
    expect(node.canInsertTextAfter()).toBe(false);
  });

  it('$isMentionNode rejects others', () => {
    expect($isMentionNode(null)).toBe(false);
    expect($isMentionNode({} as any)).toBe(false);
  });
});
