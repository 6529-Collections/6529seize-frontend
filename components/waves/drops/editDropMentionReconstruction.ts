import { $createMentionNode } from "@/components/drops/create/lexical/nodes/MentionNode";
import { $createWaveMentionNode } from "@/components/drops/create/lexical/nodes/WaveMentionNode";
import type { TextNode } from "lexical";

function replaceSplitTextWithMention(
  currentNode: TextNode,
  nextNode: TextNode,
  mentionNode: TextNode,
  mentionStartLength: number,
  mentionEndLength: number
): void {
  const currentText = currentNode.getTextContent();
  const nextText = nextNode.getTextContent();
  const beforeMention = currentText.substring(
    0,
    currentText.length - mentionStartLength
  );
  const afterMention = nextText.substring(mentionEndLength);

  if (beforeMention) {
    currentNode.setTextContent(beforeMention);
    currentNode.insertAfter(mentionNode);
  } else {
    currentNode.remove();
    nextNode.insertBefore(mentionNode);
  }

  if (afterMention) {
    nextNode.setTextContent(afterMention);
  } else {
    nextNode.remove();
  }
}

function reconstructSplitMention(
  currentNode: TextNode,
  nextNode: TextNode,
  mentionStart: RegExpMatchArray,
  mentionEnd: RegExpMatchArray,
  mentionedProfileIdsByHandle: ReadonlyMap<string, string>
) {
  const fullMention = mentionStart[0] + mentionEnd[0];
  const mentionMatch = /@\[(\w+)\]/.exec(fullMention);

  if (!mentionMatch) return false;

  const handle = mentionMatch[1];
  if (!handle) return false;
  const mentionNode = $createMentionNode(
    `@${handle}`,
    mentionedProfileIdsByHandle.get(handle.toLowerCase()) ?? null
  );

  replaceSplitTextWithMention(
    currentNode,
    nextNode,
    mentionNode,
    mentionStart[0].length,
    mentionEnd[0].length
  );

  return true;
}

function reconstructSplitWaveMention(
  currentNode: TextNode,
  nextNode: TextNode,
  mentionStart: RegExpMatchArray,
  mentionEnd: RegExpMatchArray
) {
  const fullMention = mentionStart[0] + mentionEnd[0];
  const mentionMatch = /#\[([^\]]+)\]/.exec(fullMention);

  if (!mentionMatch) return false;

  const waveName = mentionMatch[1];
  if (!waveName) return false;
  const mentionNode = $createWaveMentionNode(`#${waveName}`);

  replaceSplitTextWithMention(
    currentNode,
    nextNode,
    mentionNode,
    mentionStart[0].length,
    mentionEnd[0].length
  );

  return true;
}

function tryReconstructSplitProfileMention(
  currentNode: TextNode,
  nextNode: TextNode,
  mentionedProfileIdsByHandle: ReadonlyMap<string, string>
): boolean {
  const mentionStart = currentNode.getTextContent().match(/@\[\w*$/);
  const mentionEnd = nextNode.getTextContent().match(/^\w*\]/);
  if (!mentionStart || !mentionEnd) {
    return false;
  }

  try {
    return reconstructSplitMention(
      currentNode,
      nextNode,
      mentionStart,
      mentionEnd,
      mentionedProfileIdsByHandle
    );
  } catch (error) {
    console.warn("Failed to reconstruct split mention", error);
    return false;
  }
}

function tryReconstructSplitWaveMention(
  currentNode: TextNode,
  nextNode: TextNode
): boolean {
  const mentionStart = currentNode.getTextContent().match(/#\[[^\]]*$/);
  const mentionEnd = nextNode.getTextContent().match(/^[^\]]*\]/);
  if (!mentionStart || !mentionEnd) {
    return false;
  }

  try {
    return reconstructSplitWaveMention(
      currentNode,
      nextNode,
      mentionStart,
      mentionEnd
    );
  } catch (error) {
    console.warn("Failed to reconstruct split wave mention", error);
    return false;
  }
}

export function processSplitMentions(
  textNodes: Array<TextNode>,
  mentionedProfileIdsByHandle: ReadonlyMap<string, string>
): boolean {
  for (let index = 0; index < textNodes.length - 1; index += 1) {
    const currentNode = textNodes[index];
    const nextNode = textNodes[index + 1];
    if (!currentNode || !nextNode) {
      continue;
    }

    const currentParent = currentNode.getParent();
    if (
      !currentParent ||
      currentParent !== nextNode.getParent() ||
      currentNode.getNextSibling() !== nextNode
    ) {
      continue;
    }

    if (
      tryReconstructSplitProfileMention(
        currentNode,
        nextNode,
        mentionedProfileIdsByHandle
      ) ||
      tryReconstructSplitWaveMention(currentNode, nextNode)
    ) {
      return true;
    }
  }

  return false;
}
