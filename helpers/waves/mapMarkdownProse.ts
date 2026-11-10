const closesFence = (
  delimiter: string,
  fence: string,
  trailing: string
): boolean =>
  delimiter.startsWith(fence.charAt(0)) &&
  delimiter.length >= fence.length &&
  trailing.trim().length === 0;

const invalidOpeningFence = (delimiter: string, trailing: string): boolean =>
  delimiter.startsWith("`") && trailing.includes("`");

function* markdownLines(markdown: string) {
  let start = 0;
  while (start < markdown.length) {
    const newline = markdown.indexOf("\n", start);
    const end = newline === -1 ? markdown.length : newline + 1;
    yield { line: markdown.slice(start, end), index: start };
    start = end;
  }
}

/** Apply spacing transforms to prose without changing fenced code bytes. */
export function mapMarkdownProse(
  markdown: string,
  transform: (text: string) => string
): string {
  const parts: string[] = [];
  let fence: string | null = null;
  let codeStart = 0;
  let cursor = 0;
  for (const { line, index } of markdownLines(markdown)) {
    const marker = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)/.exec(line);
    const delimiter = marker?.[1];
    if (!delimiter) continue;
    const trailing = marker[2] ?? "";
    if (fence === null) {
      if (invalidOpeningFence(delimiter, trailing)) continue;
      parts.push(transform(markdown.slice(cursor, index)));
      codeStart = index;
      fence = delimiter;
    } else if (closesFence(delimiter, fence, trailing)) {
      // Leave the closing line's newline in prose so extra spacing after code survives.
      const newlineLength = line.endsWith("\r\n")
        ? 2
        : Number(line.endsWith("\n"));
      cursor = index + line.length - newlineLength;
      parts.push(markdown.slice(codeStart, cursor));
      fence = null;
    }
  }
  parts.push(
    fence === null
      ? transform(markdown.slice(cursor))
      : markdown.slice(codeStart)
  );
  return parts.join("");
}
