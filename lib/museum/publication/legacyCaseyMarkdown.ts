function withoutFrontMatter(markdown: string): string {
  let lineStart = -1;
  if (markdown.startsWith("---\r\n")) {
    lineStart = 5;
  } else if (markdown.startsWith("---\n")) {
    lineStart = 4;
  }
  if (lineStart === -1) {
    return markdown;
  }

  while (lineStart < markdown.length) {
    const lineEnd = markdown.indexOf("\n", lineStart);
    if (lineEnd === -1) {
      return markdown;
    }
    const line = markdown.slice(lineStart, lineEnd);
    if (line === "---" || line === "---\r") {
      return markdown.slice(lineEnd + 1);
    }
    lineStart = lineEnd + 1;
  }

  return markdown;
}

function stripBalancedDelimiter(value: string, delimiter: string): string {
  let result = "";
  let index = 0;
  while (index < value.length) {
    if (value[index] !== delimiter) {
      result += value[index];
      index += 1;
      continue;
    }
    let markerEnd = index + 1;
    while (value[markerEnd] === delimiter) {
      markerEnd += 1;
    }
    const marker = value.slice(index, markerEnd);
    const closingMarker = value.indexOf(marker, markerEnd);
    if (closingMarker === -1) {
      result += marker;
      index = markerEnd;
      continue;
    }
    result += value.slice(markerEnd, closingMarker);
    index = closingMarker + marker.length;
  }
  return result;
}

function stripBalancedInlineMarkdown(value: string): string {
  return stripBalancedDelimiter(stripBalancedDelimiter(value, "*"), "`");
}

export function parseHeading(markdown: string): string {
  for (const line of withoutFrontMatter(markdown).split("\n")) {
    const heading = line.slice(1);
    if (
      line.startsWith("#") &&
      heading.length > 0 &&
      heading.trimStart() !== heading
    ) {
      const title = stripBalancedInlineMarkdown(heading.trim()).trim();
      if (title.length > 0) {
        return title;
      }
    }
  }

  throw new Error("publication_markdown_heading_missing");
}
