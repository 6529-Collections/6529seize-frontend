interface MuseumMarkdownSection {
  readonly title: string;
  readonly markdown: string;
}

interface MuseumMarkdownFence {
  readonly character: "`" | "~";
  readonly length: number;
}

function nextMarkdownFence(
  line: string,
  fence: MuseumMarkdownFence | null
): MuseumMarkdownFence | null | undefined {
  const match = /^\s{0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
  if (match === null) return undefined;

  const marker = match[1] ?? "";
  const character = marker[0] as "`" | "~";
  if (fence === null) return { character, length: marker.length };

  if (
    fence.character === character &&
    marker.length >= fence.length &&
    (match[2] ?? "").trim() === ""
  ) {
    return null;
  }
  return undefined;
}

function withoutFootnoteReferencesOutsideInlineCode(line: string): string {
  const parts: string[] = [];
  let cursor = 0;

  while (cursor < line.length) {
    const openingStart = line.indexOf("`", cursor);
    if (openingStart === -1) {
      parts.push(line.slice(cursor).replace(/\[\^[^\]\r\n]+\]/gu, ""));
      break;
    }

    parts.push(
      line.slice(cursor, openingStart).replace(/\[\^[^\]\r\n]+\]/gu, "")
    );
    let openingEnd = openingStart;
    while (line[openingEnd] === "`") openingEnd += 1;
    const marker = line.slice(openingStart, openingEnd);
    const closingStart = line.indexOf(marker, openingEnd);
    if (closingStart === -1) {
      parts.push(line.slice(openingStart).replace(/\[\^[^\]\r\n]+\]/gu, ""));
      break;
    }

    const closingEnd = closingStart + marker.length;
    parts.push(line.slice(openingStart, closingEnd));
    cursor = closingEnd;
  }

  return parts.join("");
}

function normalizeHeading(value: string): string {
  return value
    .replace(/[*_`]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase();
}

function museumMarkdownSections(
  markdown: string
): readonly MuseumMarkdownSection[] {
  const lines = markdown.replace(/^\uFEFF/u, "").split(/\r?\n/u);
  const sections: MuseumMarkdownSection[] = [];
  let start = -1;
  let title = "";
  let fence: MuseumMarkdownFence | null = null;

  const flush = (end: number) => {
    if (start === -1) return;
    sections.push({
      title,
      markdown: lines.slice(start, end).join("\n").trim(),
    });
  };

  for (const [index, line] of lines.entries()) {
    const nextFence = nextMarkdownFence(line, fence);
    if (nextFence !== undefined) {
      fence = nextFence;
      continue;
    }
    if (fence !== null) continue;
    const match = /^#{2,3}\s+(.+?)\s*$/u.exec(line);
    if (match === null) continue;
    flush(index);
    start = index;
    title = match[1] ?? "";
  }
  flush(lines.length);
  return sections;
}

function withoutUnresolvedFootnoteReferences(markdown: string): string {
  const lines = markdown.split(/\r?\n/u);
  let fence: MuseumMarkdownFence | null = null;
  const projectedLines: string[] = [];

  for (const line of lines) {
    const nextFence = nextMarkdownFence(line, fence);
    if (nextFence !== undefined) {
      fence = nextFence;
      projectedLines.push(line);
      continue;
    }
    if (fence !== null) {
      projectedLines.push(line);
      continue;
    }

    if (/^\s{0,3}\[\^[^\]\r\n]+\]:/u.test(line)) continue;
    projectedLines.push(withoutFootnoteReferencesOutsideInlineCode(line));
  }

  return projectedLines.join("\n").trim();
}

export function projectMuseumResearchReading(
  markdown: string,
  requestedSections: readonly string[]
): string | null {
  const sections = museumMarkdownSections(markdown);
  const requested = requestedSections.map(normalizeHeading);
  if (new Set(requested).size !== requested.length) return null;
  const selected = requested.map((normalized) => {
    const matches = sections.filter(
      (section) => normalizeHeading(section.title) === normalized
    );
    return matches.length === 1 ? matches[0] : undefined;
  });
  if (selected.some((section) => section === undefined)) return null;
  return withoutUnresolvedFootnoteReferences(
    selected
      .map((section) => section?.markdown ?? "")
      .join("\n\n")
      .trim()
  );
}
