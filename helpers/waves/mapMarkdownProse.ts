const closesFence = (
  delimiter: string,
  fence: string,
  trailing: string
): boolean =>
  delimiter[0] === fence[0] &&
  delimiter.length >= fence.length &&
  trailing.trim().length === 0;

const invalidOpeningFence = (delimiter: string, trailing: string): boolean =>
  delimiter.startsWith("`") && trailing.includes("`");

/** Apply spacing transforms to prose without changing fenced code bytes. */
export function mapMarkdownProse(
  markdown: string,
  transform: (text: string) => string
): string {
  const parts: string[] = [];
  let fence: string | null = null;
  let codeStart = 0;
  let cursor = 0;
  for (const match of markdown.matchAll(/[^\n]*(?:\n|$)/g)) {
    const line = match[0];
    const marker = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)/.exec(line);
    const delimiter = marker?.[1];
    if (!delimiter) continue;
    const trailing = marker[2] ?? "";
    if (fence === null) {
      if (invalidOpeningFence(delimiter, trailing)) continue;
      parts.push(transform(markdown.slice(cursor, match.index)));
      codeStart = match.index;
      fence = delimiter;
    } else if (closesFence(delimiter, fence, trailing)) {
      // Leave the closing line's newline in prose so extra spacing after code survives.
      const newlineLength = line.endsWith("\r\n")
        ? 2
        : Number(line.endsWith("\n"));
      cursor = match.index + line.length - newlineLength;
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
