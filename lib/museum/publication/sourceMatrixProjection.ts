const VISITOR_START_HEADING = "## 2. Canonical accession facts";
const VISITOR_END_HEADING = "## 12. Notes style shared across lanes";

function exactHeadingOffsets(markdown: string, heading: string): number[] {
  const offsets: number[] = [];
  let searchFrom = 0;
  while (searchFrom < markdown.length) {
    const offset = markdown.indexOf(heading, searchFrom);
    if (offset === -1) {
      break;
    }
    const beforeIsBoundary = offset === 0 || markdown[offset - 1] === "\n";
    const after = markdown[offset + heading.length];
    const afterIsBoundary =
      after === undefined || after === "\r" || after === "\n";
    if (beforeIsBoundary && afterIsBoundary) {
      offsets.push(offset);
    }
    searchFrom = offset + heading.length;
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
