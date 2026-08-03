const VISITOR_START_HEADING = "## 2. Canonical accession facts";
const VISITOR_END_HEADING = "## 12. Notes style shared across lanes";

interface MarkdownFence {
  readonly marker: "`" | "~";
  readonly length: number;
  readonly trailing: string;
}

function markdownFence(line: string): MarkdownFence | null {
  let markerStart = 0;
  while (markerStart < 4 && line[markerStart] === " ") {
    markerStart += 1;
  }
  if (markerStart > 3) {
    return null;
  }
  const marker = line[markerStart];
  if (marker !== "`" && marker !== "~") {
    return null;
  }
  let markerEnd = markerStart;
  while (line[markerEnd] === marker) {
    markerEnd += 1;
  }
  const length = markerEnd - markerStart;
  return length >= 3
    ? { marker, length, trailing: line.slice(markerEnd) }
    : null;
}

function exactHeadingOffsets(markdown: string, heading: string): number[] {
  const offsets: number[] = [];
  let activeFence: MarkdownFence | null = null;
  let lineStart = 0;
  while (lineStart <= markdown.length) {
    const nextLineBreak = markdown.indexOf("\n", lineStart);
    const lineEnd = nextLineBreak === -1 ? markdown.length : nextLineBreak;
    const line = markdown.slice(lineStart, lineEnd).replace(/\r$/u, "");
    const fence = markdownFence(line);
    if (activeFence !== null) {
      if (
        fence?.marker === activeFence.marker &&
        fence.length >= activeFence.length &&
        fence.trailing.trim().length === 0
      ) {
        activeFence = null;
      }
    } else if (fence !== null) {
      activeFence = fence;
    } else if (line === heading) {
      offsets.push(lineStart);
    }
    if (nextLineBreak === -1) {
      break;
    }
    lineStart = nextLineBreak + 1;
  }
  return offsets;
}

export function projectSourceMatrixForVisitors(
  markdown: string
): string | null {
  const startOffsets = exactHeadingOffsets(markdown, VISITOR_START_HEADING);
  const endOffsets = exactHeadingOffsets(markdown, VISITOR_END_HEADING);
  if (startOffsets.length !== 1 || endOffsets.length !== 1) {
    return null;
  }
  const start = startOffsets[0];
  const end = endOffsets[0];
  if (start === undefined || end === undefined || end <= start) {
    return null;
  }
  return markdown.slice(start, end);
}
