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
    const trailing = marker?.[2] ?? "";
    if (fence === null) {
      if (delimiter.startsWith("`") && trailing.includes("`")) continue;
      parts.push(transform(markdown.slice(cursor, match.index)));
      codeStart = match.index;
      fence = delimiter;
    } else if (
      delimiter[0] === fence[0] &&
      delimiter.length >= fence.length &&
      trailing.trim().length === 0
    ) {
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
