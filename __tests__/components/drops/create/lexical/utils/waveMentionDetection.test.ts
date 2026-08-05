jest.unmock("lexical");

import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  type LexicalEditor,
} from "lexical";

import {
  $createWaveMentionNode,
  WaveMentionNode,
} from "@/components/drops/create/lexical/nodes/WaveMentionNode";
import {
  getMentionedWavesFromEditorState,
  mergeMentionedWaves,
} from "@/components/drops/create/lexical/utils/waveMentionDetection";

const makeEditor = (): LexicalEditor =>
  createEditor({
    nodes: [WaveMentionNode],
    onError: (error) => {
      throw error;
    },
  });

const withWaveMentions = (
  entries: readonly (
    | { readonly name: string; readonly waveId: string | null }
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
            : $createWaveMentionNode(`#${entry.name}`, entry.waveId)
        );
      }
      $getRoot().append(paragraph);
    },
    { discrete: true }
  );
  return editor;
};

describe("getMentionedWavesFromEditorState", () => {
  it("recovers tracked wave metadata after the draft JSON round trip", () => {
    const original = withWaveMentions([
      { text: "check out " },
      { name: "test from desktop-web", waveId: "wave-1" },
    ]);
    const persisted = JSON.stringify(original.getEditorState().toJSON());
    const restored = makeEditor();
    restored.setEditorState(restored.parseEditorState(persisted));

    expect(getMentionedWavesFromEditorState(restored.getEditorState())).toEqual([
      {
        wave_id: "wave-1",
        wave_name_in_content: "test from desktop-web",
      },
    ]);
  });

  it("skips imported or legacy wave nodes that have no wave id", () => {
    const editor = withWaveMentions([
      { name: "untracked wave", waveId: null },
    ]);

    expect(getMentionedWavesFromEditorState(editor.getEditorState())).toEqual(
      []
    );
  });

  it("de-duplicates repeated mentions of the same wave", () => {
    const editor = withWaveMentions([
      { name: "Wave One", waveId: "wave-1" },
      { text: " and " },
      { name: "Wave One", waveId: "wave-1" },
    ]);

    expect(getMentionedWavesFromEditorState(editor.getEditorState())).toHaveLength(
      1
    );
  });
});

describe("mergeMentionedWaves", () => {
  it("keeps registry-only waves and prefers the editor name for duplicates", () => {
    expect(
      mergeMentionedWaves(
        [{ wave_id: "wave-1", wave_name_in_content: "Current Name" }],
        [
          { wave_id: "wave-1", wave_name_in_content: "Old Name" },
          { wave_id: "wave-2", wave_name_in_content: "Registry Only" },
        ]
      )
    ).toEqual([
      { wave_id: "wave-1", wave_name_in_content: "Current Name" },
      { wave_id: "wave-2", wave_name_in_content: "Registry Only" },
    ]);
  });
});
