import {
  DecoratorNode,
  SerializedLexicalNode,
  Spread,
  LexicalEditor,
  EditorConfig,
  NodeKey,
} from "lexical";
import { createElement, type JSX } from "react";
import { useEmoji } from "../../../../../contexts/EmojiContext";

type SerializedEmojiNode = Spread<{ emojiId: string }, SerializedLexicalNode>;

export class EmojiNode extends DecoratorNode<JSX.Element> {
  __emojiId: string;

  constructor(emojiId: string, key?: NodeKey) {
    super(key);
    this.__emojiId = emojiId;
  }

  static getType(): string {
    return "emoji";
  }

  static clone(node: EmojiNode): EmojiNode {
    return new EmojiNode(node.__emojiId, node.__key);
  }

  isInline(): boolean {
    return true;
  }

  canInsertTextBefore(): boolean {
    return true;
  }

  canInsertTextAfter(): boolean {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    return span;
  }

  updateDOM(
    _prevNode: EmojiNode,
    _dom: HTMLElement,
    _config: EditorConfig
  ): boolean {
    return false;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return createElement(EmojiComponent, { emojiId: this.__emojiId });
  }

  static importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
    return new EmojiNode(serializedNode.emojiId);
  }

  exportJSON(): SerializedEmojiNode {
    return {
      type: "emoji",
      version: 1,
      emojiId: this.__emojiId,
    };
  }
}

const EmojiComponent = ({ emojiId }: { emojiId: string }) => {
  const { emojiMap } = useEmoji();

  const emoji = emojiMap
    .flatMap((cat) => cat.emojis)
    .find((e) => e.id === emojiId);

  if (!emoji) {
    return <span>{`:${emojiId}:`}</span>;
  }

  return <img src={emoji.skins[0].src} alt={emojiId} className="emoji-node" />;
};
