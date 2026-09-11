const getMarkdownNodeOffset = (
  node: unknown,
  edge: "start" | "end"
): number | null => {
  if (typeof node !== "object" || node === null || !("position" in node)) {
    return null;
  }

  const position = (
    node as {
      readonly position?: {
        readonly end?: { readonly offset?: unknown } | undefined;
        readonly start?: { readonly offset?: unknown } | undefined;
      };
    }
  ).position;
  const offset = position?.[edge]?.offset;

  return typeof offset === "number" && offset >= 0 ? offset : null;
};

export const getMarkdownNodeStartOffset = (node: unknown): number | null =>
  getMarkdownNodeOffset(node, "start");

const getFirstTextChildOffsets = (
  node: unknown
): { readonly end: number; readonly start: number } | null => {
  if (typeof node !== "object" || node === null || !("children" in node)) {
    return null;
  }

  const children = (node as { readonly children?: readonly unknown[] })
    .children;
  const firstChild = children?.[0];
  if (
    typeof firstChild !== "object" ||
    firstChild === null ||
    !("type" in firstChild) ||
    !("position" in firstChild)
  ) {
    return null;
  }

  if ((firstChild as { readonly type?: unknown }).type !== "text") {
    return null;
  }

  const start = getMarkdownNodeOffset(firstChild, "start");
  const end = getMarkdownNodeOffset(firstChild, "end");

  return start !== null && end !== null ? { end, start } : null;
};

export const isPreviewableHrefSource = (node: unknown): boolean => {
  const nodeStartOffset = getMarkdownNodeOffset(node, "start");
  const nodeEndOffset = getMarkdownNodeOffset(node, "end");
  const firstTextOffsets = getFirstTextChildOffsets(node);

  if (
    nodeStartOffset === null ||
    nodeEndOffset === null ||
    firstTextOffsets === null
  ) {
    return false;
  }

  if (nodeStartOffset === firstTextOffsets.start) {
    return true;
  }

  return (
    nodeStartOffset + 1 === firstTextOffsets.start &&
    nodeEndOffset - 1 === firstTextOffsets.end
  );
};
