import React from "react";
import { render, screen } from "@testing-library/react";

// Stub out lexical's DecoratorNode to avoid constructor issues
jest.mock("lexical", () => {
  class DecoratorNode {
    __key?: unknown;
    constructor(key?: unknown) {
      this.__key = key;
    }
    // You can stub other methods if needed
  }
  return {
    DecoratorNode,
    // Runtime stand-ins for type-only exports
    SerializedLexicalNode: {},
    Spread: (x: any) => x,
    LexicalEditor: {},
    EditorConfig: {},
    NodeKey: undefined,
  };
});

// Adjust the import paths below to match your project structure
import { EmojiNode } from "@/components/drops/create/lexical/nodes/EmojiNode";
import { useEmoji } from "@/contexts/EmojiContext";

jest.mock("@/contexts/EmojiContext");

describe("EmojiNode class", () => {
  const TEST_ID = "smile";
  let node: EmojiNode;

  beforeEach(() => {
    node = new EmojiNode(TEST_ID, "node-key");
  });

  it('getType() -> "emoji"', () => {
    expect(EmojiNode.getType()).toBe("emoji");
  });

  it("clone() copies emojiId and key", () => {
    const clone = EmojiNode.clone(node);
    expect(clone).toBeInstanceOf(EmojiNode);
    // @ts-ignore
    expect(clone.__emojiId).toBe(TEST_ID);
    // @ts-ignore
    expect(clone.__key).toBe("node-key");
  });

  it("isInline, canInsertTextBefore, canInsertTextAfter are true", () => {
    expect(node.isInline()).toBe(true);
    expect(node.canInsertTextBefore()).toBe(true);
    expect(node.canInsertTextAfter()).toBe(true);
  });

  it("createDOM returns a <span>", () => {
    const span = node.createDOM({} as any);
    expect(span).toBeInstanceOf(HTMLElement);
    expect(span.tagName).toBe("SPAN");
  });

  it("updateDOM always returns false", () => {
    const span = document.createElement("span");
    expect(node.updateDOM(node, span, {} as any)).toBe(false);
  });

  it("decorate() returns a React element of EmojiComponent", () => {
    const el = node.decorate({} as any, {} as any);
    expect(React.isValidElement(el)).toBe(true);
    // @ts-ignore
    expect((el.type as any).name).toBe("EmojiComponent");
    // @ts-ignore
    expect(el.props.emojiId).toBe(TEST_ID);
  });

  it("importJSON & exportJSON round-trip", () => {
    const serialized = {
      type: "emoji",
      version: 1,
      emojiId: TEST_ID,
    } as const;
    const imported = EmojiNode.importJSON(serialized);
    expect(imported).toBeInstanceOf(EmojiNode);
    // @ts-ignore
    expect(imported.__emojiId).toBe(TEST_ID);

    const exported = imported.exportJSON();
    expect(exported).toEqual(serialized);
  });
});

describe("EmojiComponent", () => {
  const mockUseEmoji = useEmoji as jest.MockedFunction<typeof useEmoji>;

  afterEach(() => {
    jest.resetAllMocks();
  });

  const renderEmojiComponent = (emojiId: string) => {
    const emojiNode = new EmojiNode(emojiId);
    const element = emojiNode.decorate({} as any, {} as any);
    render(element);
  };

  it("renders <img> when emoji found in emojiMap", () => {
    const fakeEmoji = {
      id: "heart",
      name: "Heart",
      keywords: "heart",
      skins: [{ src: "https://cdn/heart.png", native: "❤️" }],
    };
    mockUseEmoji.mockReturnValue({
      emojiMap: [
        {
          id: "people",
          name: "Smileys & People",
          category: "Smileys & People",
          emojis: [fakeEmoji],
        },
      ],
      loading: false,
      categories: [],
      categoryIcons: {},
      findNativeEmoji: jest.fn(),
    });

    renderEmojiComponent("heart");
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", fakeEmoji.skins[0].src);
    expect(img).toHaveAttribute("alt", "heart");
    expect(img).toHaveClass("emoji-node");
  });

  it("renders native fallback when not in map but findNativeEmoji returns one", () => {
    const native = {
      id: "wave",
      name: "Wave",
      keywords: ["hi", "wave"],
      skins: [{ native: "👋" }],
    };
    mockUseEmoji.mockReturnValue({
      emojiMap: [
        {
          id: "people",
          name: "Smileys & People",
          category: "Smileys & People",
          emojis: [],
        },
      ],
      loading: false,
      categories: [],
      categoryIcons: {},
      findNativeEmoji: jest.fn().mockReturnValue(native),
    });

    renderEmojiComponent("wave");
    expect(screen.getByText("👋")).toBeInTheDocument();
  });

  it("renders literal `:id:` when nothing found", () => {
    mockUseEmoji.mockReturnValue({
      emojiMap: [],
      loading: false,
      categories: [],
      categoryIcons: {},
      findNativeEmoji: jest.fn().mockReturnValue(null),
    });

    renderEmojiComponent("unknown");
    expect(screen.getByText(":unknown:")).toBeInTheDocument();
  });
});
