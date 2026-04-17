import {
  $applyNodeReplacement,
  TextNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
} from "lexical";

type SerializedGroupMentionNode = Spread<
  {
    groupMentionName: string;
  },
  SerializedTextNode
>;

function convertGroupMentionElement(domNode: Node): DOMConversionOutput | null {
  const textContent = domNode.textContent;

  if (textContent !== null) {
    return {
      node: $createGroupMentionNode(textContent),
    };
  }

  return null;
}

export class GroupMentionNode extends TextNode {
  __groupMention: string;

  static override getType(): string {
    return "group-mention";
  }

  static override clone(node: GroupMentionNode): GroupMentionNode {
    return new GroupMentionNode(node.__groupMention, node.__text, node.__key);
  }

  static override importJSON(
    serializedNode: SerializedGroupMentionNode
  ): GroupMentionNode {
    const node = $createGroupMentionNode(serializedNode.groupMentionName);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(groupMentionName: string, text?: string, key?: NodeKey) {
    super(text ?? groupMentionName, key);
    this.__groupMention = groupMentionName;
  }

  override exportJSON(): SerializedGroupMentionNode {
    return {
      ...super.exportJSON(),
      groupMentionName: this.__groupMention,
      type: "group-mention",
      version: 1,
    };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("editor-group-mention");
    return dom;
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-group-mention", "true");
    element.textContent = this.__text;
    return { element };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-group-mention")) {
          return null;
        }
        return {
          conversion: convertGroupMentionElement,
          priority: 1,
        };
      },
    };
  }

  override isTextEntity(): true {
    return true;
  }

  override canInsertTextBefore(): boolean {
    return false;
  }

  override canInsertTextAfter(): boolean {
    return false;
  }
}

export function $createGroupMentionNode(
  groupMentionName: string
): GroupMentionNode {
  const groupMentionNode = new GroupMentionNode(groupMentionName);
  groupMentionNode.setMode("segmented").toggleDirectionless();
  return $applyNodeReplacement(groupMentionNode);
}

export function $isGroupMentionNode(
  node: LexicalNode | null | undefined
): node is GroupMentionNode {
  return node instanceof GroupMentionNode;
}
