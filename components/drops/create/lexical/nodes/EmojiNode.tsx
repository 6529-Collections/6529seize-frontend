import {
  DecoratorNode,
  SerializedLexicalNode,
  Spread,
  LexicalEditor,
  EditorConfig,
  NodeKey,
  RangeSelection,
} from "lexical";
import { EMOJI_MAP } from "../../../../../6529-emoji";

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

  selectionTransform(_selection: RangeSelection) {}

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
    const emojiCategory = EMOJI_MAP.find((cat) =>
      cat.emojis.find((e) => e.id === this.__emojiId)
    );
    const emoji = emojiCategory?.emojis.find((e) => e.id === this.__emojiId);

    if (!emoji) {
      return <span>{`:${this.__emojiId}:`}</span>;
    }

    return (
      <img
        src={emoji.skins[0].src}
        alt={this.__emojiId}
        className="emoji-node"
      />
    );
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
