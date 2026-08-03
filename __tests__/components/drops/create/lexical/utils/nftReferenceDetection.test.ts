jest.unmock("lexical");

import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  type LexicalEditor,
} from "lexical";

import {
  $createHashtagNode,
  HashtagNode,
} from "@/components/drops/create/lexical/nodes/HashtagNode";
import {
  getReferencedNftsFromEditorState,
  mergeReferencedNfts,
} from "@/components/drops/create/lexical/utils/nftReferenceDetection";

const makeEditor = (): LexicalEditor =>
  createEditor({
    nodes: [HashtagNode],
    onError: (error) => {
      throw error;
    },
  });

const withNftReferences = (
  entries: readonly (
    | {
        readonly name: string;
        readonly contract: string | null;
        readonly token: string | null;
      }
    | { readonly text: string }
  )[]
): LexicalEditor => {
  const editor = makeEditor();
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      for (const entry of entries) {
        paragraph.append(
          "text" in entry
            ? $createTextNode(entry.text)
            : $createHashtagNode(
                `$${entry.name}`,
                entry.contract && entry.token
                  ? { contract: entry.contract, token: entry.token }
                  : null
              )
        );
      }
      $getRoot().append(paragraph);
    },
    { discrete: true }
  );
  return editor;
};

describe("getReferencedNftsFromEditorState", () => {
  it("recovers NFT metadata after the draft JSON round trip", () => {
    const original = withNftReferences([
      { text: "look at " },
      {
        name: "Test NFT",
        contract: "0x1234567890123456789012345678901234567890",
        token: "42",
      },
    ]);
    const persisted = JSON.stringify(original.getEditorState().toJSON());
    const restored = makeEditor();
    restored.setEditorState(restored.parseEditorState(persisted));

    expect(getReferencedNftsFromEditorState(restored.getEditorState())).toEqual([
      {
        contract: "0x1234567890123456789012345678901234567890",
        token: "42",
        name: "Test NFT",
      },
    ]);
  });

  it("skips imported or legacy NFT nodes without an identity", () => {
    const editor = withNftReferences([
      { name: "Legacy NFT", contract: null, token: null },
    ]);

    expect(getReferencedNftsFromEditorState(editor.getEditorState())).toEqual(
      []
    );
  });

  it("de-duplicates the same contract and token", () => {
    const editor = withNftReferences([
      { name: "First Name", contract: "0xABC", token: "1" },
      { text: " and " },
      { name: "Second Name", contract: "0xabc", token: "1" },
    ]);

    expect(getReferencedNftsFromEditorState(editor.getEditorState())).toEqual([
      { name: "First Name", contract: "0xABC", token: "1" },
    ]);
  });
});

describe("mergeReferencedNfts", () => {
  it("keeps registry-only NFTs and prefers restored editor metadata", () => {
    expect(
      mergeReferencedNfts(
        [{ contract: "0xABC", token: "1", name: "Current Name" }],
        [
          { contract: "0xabc", token: "1", name: "Old Name" },
          { contract: "0xdef", token: "2", name: "Registry Only" },
        ]
      )
    ).toEqual([
      { contract: "0xABC", token: "1", name: "Current Name" },
      { contract: "0xdef", token: "2", name: "Registry Only" },
    ]);
  });
});
