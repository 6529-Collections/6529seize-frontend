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

const NFT_CONTRACT = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const NFT_CONTRACT_UPPER = "0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD";
const OTHER_NFT_CONTRACT = "0x0000000000000000000000000000000000000001";

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
        contract: NFT_CONTRACT,
        token: "42",
      },
    ]);
    const persisted = JSON.stringify(original.getEditorState().toJSON());
    const restored = makeEditor();
    restored.setEditorState(restored.parseEditorState(persisted));

    expect(getReferencedNftsFromEditorState(restored.getEditorState())).toEqual(
      [
        {
          contract: NFT_CONTRACT,
          token: "42",
          name: "Test NFT",
        },
      ]
    );
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
      { name: "First Name", contract: NFT_CONTRACT_UPPER, token: "1" },
      { text: " and " },
      { name: "Second Name", contract: NFT_CONTRACT, token: "1" },
    ]);

    expect(getReferencedNftsFromEditorState(editor.getEditorState())).toEqual([
      { name: "First Name", contract: NFT_CONTRACT_UPPER, token: "1" },
    ]);
  });

  it("skips malformed NFT contracts restored from draft JSON", () => {
    const editor = withNftReferences([
      { name: "Invalid", contract: "not-an-address", token: "1" },
    ]);

    expect(getReferencedNftsFromEditorState(editor.getEditorState())).toEqual(
      []
    );
  });
});

describe("mergeReferencedNfts", () => {
  it("keeps registry-only NFTs and prefers restored editor metadata", () => {
    expect(
      mergeReferencedNfts(
        [{ contract: NFT_CONTRACT_UPPER, token: "1", name: "Current Name" }],
        [
          { contract: NFT_CONTRACT, token: "1", name: "Old Name" },
          { contract: OTHER_NFT_CONTRACT, token: "2", name: "Registry Only" },
          { contract: "invalid", token: "3", name: "Invalid" },
        ]
      )
    ).toEqual([
      { contract: NFT_CONTRACT_UPPER, token: "1", name: "Current Name" },
      { contract: OTHER_NFT_CONTRACT, token: "2", name: "Registry Only" },
    ]);
  });
});
