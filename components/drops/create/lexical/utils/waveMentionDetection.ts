import { $getRoot, type EditorState } from "lexical";

import { $isWaveMentionNode } from "@/components/drops/create/lexical/nodes/WaveMentionNode";
import type { MentionedWave } from "@/entities/IDrop";

/**
 * Reads tracked wave mentions from the editor state that survives draft
 * persistence. Markdown-imported nodes have no wave id and stay untracked.
 */
export const getMentionedWavesFromEditorState = (
  editorState: EditorState
): MentionedWave[] => {
  return editorState.read(() => {
    const byWaveId = new Map<string, MentionedWave>();

    for (const node of $getRoot().getAllTextNodes()) {
      if (!$isWaveMentionNode(node)) {
        continue;
      }
      const waveId = node.getMentionedWaveId();
      const waveNameInContent = node.getTextContent().replace(/^#/, "");
      if (!waveId || !waveNameInContent || byWaveId.has(waveId)) {
        continue;
      }
      byWaveId.set(waveId, {
        wave_id: waveId,
        wave_name_in_content: waveNameInContent,
      });
    }

    return [...byWaveId.values()];
  });
};

/** Keeps registry-only entries while preferring names restored in the editor. */
export const mergeMentionedWaves = (
  editorMentions: readonly MentionedWave[],
  registryMentions: readonly MentionedWave[]
): MentionedWave[] => {
  const byWaveId = new Map<string, MentionedWave>();
  for (const mention of [...registryMentions, ...editorMentions]) {
    byWaveId.set(mention.wave_id, mention);
  }
  return [...byWaveId.values()];
};
