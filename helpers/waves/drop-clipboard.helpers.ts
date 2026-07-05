import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMetadata } from "@/generated/models/ApiDropMetadata";
import { ApiDropType } from "@/generated/models/ApiDropType";

export type ClipboardFormat = "plain" | "markdown";

export interface ClipboardMessage {
  readonly id: string;
  readonly author: string;
  readonly timestamp: number;
  readonly plainContent: string;
  readonly markdownContent: string;
  readonly embedPlainLines: string[];
  readonly embedMarkdownLines: string[];
  readonly attachmentPlainLines: string[];
  readonly attachmentMarkdownLines: string[];
}

type ClipboardDropSource = ApiDrop & {
  readonly stableHash?: string | undefined;
};

const replaceMarkdownLinks = (input: string): string => {
  if (!input.includes("[")) {
    return input;
  }

  let result = "";
  let cursor = 0;

  while (cursor < input.length) {
    const openBracket = input.indexOf("[", cursor);
    if (openBracket === -1) {
      result += input.slice(cursor);
      break;
    }

    const isImage = openBracket > cursor && input[openBracket - 1] === "!";
    const segmentEnd = isImage ? openBracket - 1 : openBracket;

    result += input.slice(cursor, segmentEnd);

    const closeBracket = input.indexOf("]", openBracket + 1);
    if (closeBracket === -1) {
      result += input.slice(segmentEnd);
      break;
    }

    if (closeBracket + 1 >= input.length || input[closeBracket + 1] !== "(") {
      result += input.slice(segmentEnd, closeBracket + 1);
      cursor = closeBracket + 1;
      continue;
    }

    let depth = 1;
    let urlCursor = closeBracket + 2;

    while (urlCursor < input.length && depth > 0) {
      const char = input[urlCursor];
      if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
      }
      urlCursor += 1;
    }

    if (depth !== 0) {
      result += input.slice(segmentEnd, urlCursor);
      cursor = urlCursor;
      continue;
    }

    const urlEnd = urlCursor - 1;
    const label = input.slice(openBracket + 1, closeBracket);
    const url = input.slice(closeBracket + 2, urlEnd);

    if (isImage) {
      result += url;
    } else if (label && url) {
      result += `${label} (${url})`;
    } else {
      result += label || url;
    }

    cursor = urlCursor;
  }

  return result;
};

const toPlainText = (markdown: string): string => {
  const withoutLinkMarkup = replaceMarkdownLinks(markdown);

  return withoutLinkMarkup
    .replaceAll(/```([\s\S]*?)```/g, (_, code) => code.trim())
    .replaceAll(/`([^`]+)`/g, "$1")
    .replaceAll(/(\*\*|__)(.*?)\1/g, "$2")
    .replaceAll(/([*_])(.*?)\1/g, "$2")
    .replaceAll(/~~(.*?)~~/g, "$1")
    .replaceAll(/(^|\n)#{1,6}\s+/g, "$1")
    .replaceAll(/(^|\n)\s*[-*+]\s+/g, "$1")
    .replaceAll(/(^|\n)\s*\d+[.)]\s+/g, "$1")
    .replaceAll(/(^|\n)>\s?/g, "$1")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();
};

type EmbedInfo = {
  readonly title?: string | undefined;
  readonly url?: string | undefined;
  readonly description?: string | undefined;
  readonly extras: string[];
};

const EMBED_KEY_SEPARATORS = [":", "::", ".", "-", "_"] as const;

const createEmptyEmbed = (): EmbedInfo => ({ extras: [] });

const ensureFieldValue = <K extends "title" | "url" | "description">(
  group: EmbedInfo,
  field: K,
  value: string
): EmbedInfo => {
  if (group[field]) {
    return group;
  }
  return { ...group, [field]: value };
};

const appendUniqueExtra = (group: EmbedInfo, value: string): EmbedInfo => {
  if (group.extras.includes(value)) {
    return group;
  }
  return { ...group, extras: [...group.extras, value] };
};

const splitEmbedKey = (normalizedKey: string) => {
  for (const separator of EMBED_KEY_SEPARATORS) {
    const index = normalizedKey.lastIndexOf(separator);
    if (index > -1) {
      return {
        groupKey: normalizedKey.slice(0, index) || "default",
        fieldKey: normalizedKey.slice(index + separator.length),
      };
    }
  }

  return { groupKey: "default", fieldKey: normalizedKey };
};

const applyMetadataToGroup = (
  group: EmbedInfo,
  fieldKey: string,
  dataKey: string | undefined,
  dataValue: string
): EmbedInfo => {
  if (fieldKey.includes("title")) {
    return ensureFieldValue(group, "title", dataValue);
  }

  if (fieldKey.includes("url")) {
    return ensureFieldValue(group, "url", dataValue);
  }

  if (fieldKey.includes("description")) {
    return ensureFieldValue(group, "description", dataValue);
  }

  if (dataValue.startsWith("http")) {
    if (!group.url) {
      return ensureFieldValue(group, "url", dataValue);
    }
    return appendUniqueExtra(group, dataValue);
  }

  const extraLabel = `${dataKey}: ${dataValue}`;
  return appendUniqueExtra(group, extraLabel);
};

const extractEmbeds = (metadata: ApiDropMetadata[]): EmbedInfo[] => {
  if (!metadata.length) {
    return [];
  }

  const groups = new Map<string, EmbedInfo>();

  for (const { data_key, data_value } of metadata) {
    if (!data_value) {
      continue;
    }

    const normalizedKey = data_key?.toLowerCase?.() ?? "";
    const { groupKey, fieldKey } = splitEmbedKey(normalizedKey);
    const group = groups.get(groupKey) ?? createEmptyEmbed();

    groups.set(
      groupKey,
      applyMetadataToGroup(group, fieldKey, data_key, data_value)
    );
  }

  return Array.from(groups.values()).filter(
    (group) =>
      !!group.title ||
      !!group.url ||
      !!group.description ||
      group.extras.length > 0
  );
};

type QuoteDropSource = {
  readonly author?: { readonly handle?: string | null | undefined } | undefined;
  readonly parts?: ReadonlyArray<{
    readonly part_id: number;
    readonly content: string | null;
  }> | undefined;
  readonly created_at?: number | null | undefined;
  readonly wave?: { readonly name?: string | null | undefined } | null | undefined;
};

const mergeQuoteDropSources = (
  primary?: QuoteDropSource | null,
  secondary?: QuoteDropSource | null
): QuoteDropSource | undefined => {
  if (!primary && !secondary) {
    return undefined;
  }

  if (!primary) {
    return secondary ?? undefined;
  }

  if (!secondary) {
    return primary;
  }

  return {
    author: primary.author ?? secondary.author,
    parts: primary.parts ?? secondary.parts,
    created_at: primary.created_at ?? secondary.created_at,
    wave: primary.wave ?? secondary.wave,
  };
};

const registerQuoteDropSource = (
  registry: Map<string, QuoteDropSource>,
  dropId: string,
  source: QuoteDropSource | null | undefined
): void => {
  if (!source) {
    return;
  }

  const merged = mergeQuoteDropSources(registry.get(dropId), source);
  if (merged) {
    registry.set(dropId, merged);
  }
};

export const buildQuoteDropLookup = (
  drops: ReadonlyArray<ClipboardDropSource>
): Map<string, QuoteDropSource> => {
  const registry = new Map<string, QuoteDropSource>();

  for (const drop of drops) {
    registerQuoteDropSource(registry, drop.id, {
      author: drop.author,
      parts: drop.parts,
      created_at: drop.created_at,
      wave: drop.wave,
    });

    if (drop.reply_to?.drop) {
      registerQuoteDropSource(registry, drop.reply_to.drop_id, {
        author: drop.reply_to.drop.author,
        parts: drop.reply_to.drop.parts,
        created_at: drop.reply_to.drop.created_at,
        wave: drop.wave,
      });
    }

    for (const part of drop.parts) {
      const quoted = part.quoted_drop;
      if (quoted?.drop) {
        registerQuoteDropSource(registry, quoted.drop_id, {
          author: quoted.drop.author,
          parts: quoted.drop.parts,
          created_at: quoted.drop.created_at,
          wave: drop.wave,
        });
      }
    }
  }

  return registry;
};

type DropReferenceDescriptor = {
  readonly label: string;
  readonly dropId: string;
  readonly dropPartId: number;
  readonly isDeleted?: boolean | undefined;
  readonly drop?: QuoteDropSource | null | undefined;
};

const formatDeletedReference = (
  descriptor: DropReferenceDescriptor
): string =>
  `> **${descriptor.label}** (original message deleted: ${descriptor.dropId}#${descriptor.dropPartId})`;

const formatFallbackReference = (
  descriptor: DropReferenceDescriptor
): string =>
  `> **${descriptor.label}** (${descriptor.dropId}#${descriptor.dropPartId})`;

const resolveReferenceDetails = (
  descriptor: DropReferenceDescriptor,
  quoteLookup: Map<string, QuoteDropSource>
) => {
  const mergedDrop = mergeQuoteDropSources(
    descriptor.drop ?? undefined,
    quoteLookup.get(descriptor.dropId)
  );

  const authorHandle = mergedDrop?.author?.handle?.trim() ?? "";
  const referencedPartContent = mergedDrop?.parts?.find(
    (part) => part.part_id === descriptor.dropPartId
  )?.content;
  const normalizedContent =
    typeof referencedPartContent === "string"
      ? referencedPartContent.trim()
      : "";
  const waveName = mergedDrop?.wave?.name?.trim() ?? "";

  return { authorHandle, normalizedContent, waveName };
};

const buildReferenceContentLines = (content: string): string[] => {
  if (!content) {
    return [];
  }

  const contentLines = content.split("\n");
  return contentLines.map((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 ? `> ${line}` : ">";
  });
};

const buildReferenceHeading = (
  label: string,
  authorHandle: string,
  hasContent: boolean
): string => {
  const headingParts = [label, authorHandle]
    .filter((part) => part && part.length > 0)
    .join(" ")
    .trim();

  const suffix = hasContent ? ":" : "";

  return `> **${headingParts}${suffix}**`;
};

const formatReference = (
  descriptor: DropReferenceDescriptor,
  quoteLookup: Map<string, QuoteDropSource>
): string | null => {
  if (descriptor.isDeleted) {
    return formatDeletedReference(descriptor);
  }

  const { authorHandle, normalizedContent, waveName } =
    resolveReferenceDetails(descriptor, quoteLookup);

  if (!authorHandle && !normalizedContent && !waveName) {
    return formatFallbackReference(descriptor);
  }

  const lines = [
    buildReferenceHeading(descriptor.label, authorHandle, normalizedContent.length > 0),
    ...buildReferenceContentLines(normalizedContent),
  ];

  if (waveName) {
    lines.push(`> in ${waveName}`);
  }

  return lines.join("\n");
};

type EmbedLineBuilder = (embed: EmbedInfo) => string[];

const buildEmbedLines = (
  embedInfos: EmbedInfo[],
  builder: EmbedLineBuilder
): string[] => embedInfos.flatMap(builder);

const createPlainEmbedLines: EmbedLineBuilder = (embed) => {
  const lines: string[] = [];
  if (embed.title && embed.url) {
    lines.push(`${embed.title} — ${embed.url}`);
  } else if (embed.title) {
    lines.push(embed.title);
  } else if (embed.url) {
    lines.push(embed.url);
  }

  if (embed.description) {
    lines.push(embed.description);
  }

  lines.push(...embed.extras);

  return lines;
};

const createMarkdownEmbedLines: EmbedLineBuilder = (embed) => {
  const lines: string[] = [];
  if (embed.title && embed.url) {
    lines.push(`[${embed.title}](${embed.url})`);
  } else if (embed.title) {
    lines.push(`**${embed.title}**`);
  } else if (embed.url) {
    lines.push(embed.url);
  }

  if (embed.description) {
    lines.push(embed.description);
  }

  lines.push(...embed.extras);

  return lines;
};

type DropPart = ApiDrop["parts"][number];

const buildPartSegments = (
  part: DropPart,
  quoteLookup: Map<string, QuoteDropSource>
): string[] => {
  const segments: string[] = [];
  const content = (part.content ?? "").trim();

  if (content.length > 0) {
    segments.push(content);
  }

  const quoted = part.quoted_drop;
  if (!quoted) {
    return segments;
  }

  const quoteSegment = formatReference(
    {
      label: "Quote from",
      dropId: quoted.drop_id,
      dropPartId: quoted.drop_part_id,
      drop: quoted.drop,
    },
    quoteLookup
  );

  if (quoteSegment) {
    segments.push(quoteSegment);
  }

  return segments;
};

export const buildClipboardMessage = (
  drop: ClipboardDropSource,
  quoteLookup: Map<string, QuoteDropSource>
): ClipboardMessage => {
  const markdownSegments: string[] = [];

  const replySegment = drop.reply_to
    ? formatReference(
        {
          label: "Replying to",
          dropId: drop.reply_to.drop_id,
          dropPartId: drop.reply_to.drop_part_id,
          isDeleted: drop.reply_to.is_deleted,
          drop: drop.reply_to.drop,
        },
        quoteLookup
      )
    : null;

  if (replySegment) {
    markdownSegments.push(replySegment);
  }

  for (const part of drop.parts) {
    markdownSegments.push(...buildPartSegments(part, quoteLookup));
  }

  const markdownContent = markdownSegments.join("\n\n").trim();

  const plainContent = markdownContent ? toPlainText(markdownContent) : "";

  const embedInfos = extractEmbeds(drop.metadata ?? []);

  const summaryPlainLines: string[] = [];
  const summaryMarkdownLines: string[] = [];

  if (drop.drop_type !== ApiDropType.Chat) {
    summaryPlainLines.push(`Type: ${drop.drop_type}`);
    summaryMarkdownLines.push(`**Type:** ${drop.drop_type}`);
  }

  if (drop.drop_type === ApiDropType.Winner) {
    const winnerRank = drop.winning_context?.place ?? drop.rank;
    if (winnerRank !== null && winnerRank !== undefined) {
      summaryPlainLines.push(`Rank: ${winnerRank}`);
      summaryMarkdownLines.push(`**Rank:** ${winnerRank}`);
    }
  }

  const embedPlainLines = [
    ...summaryPlainLines,
    ...buildEmbedLines(embedInfos, createPlainEmbedLines),
  ].filter(Boolean);
  const embedMarkdownLines = [
    ...summaryMarkdownLines,
    ...buildEmbedLines(embedInfos, createMarkdownEmbedLines),
  ].filter(Boolean);

  const mediaUrls = drop.parts.flatMap((part) =>
    part.media
      .map((media) => media.url)
      .filter((url): url is string => !!url && url.length > 0)
  );

  const uniqueAttachments = Array.from(new Set(mediaUrls));

  return {
    id: drop.stableHash ?? drop.id,
    author: drop.author?.handle ?? "Unknown",
    timestamp: drop.created_at,
    markdownContent,
    plainContent,
    embedPlainLines,
    embedMarkdownLines,
    attachmentPlainLines: uniqueAttachments,
    attachmentMarkdownLines: uniqueAttachments.map(
      (url) => `[attachment](${url})`
    ),
  };
};

const formatTimestamp = (timestamp: number): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
};

type FormatContent = {
  primaryContent: string;
  embedLines: string[];
  attachmentLines: string[];
};

const resolveFormatContent = (
  message: ClipboardMessage,
  format: ClipboardFormat
): FormatContent => {
  const isMarkdown = format === "markdown";
  let primarySource: string | null | undefined;
  let embedSource: string[] | null | undefined;
  let attachmentSource: string[] | null | undefined;

  if (isMarkdown) {
    primarySource = message.markdownContent;
    embedSource = message.embedMarkdownLines;
    attachmentSource = message.attachmentMarkdownLines;
  } else {
    primarySource = message.plainContent;
    embedSource = message.embedPlainLines;
    attachmentSource = message.attachmentPlainLines;
  }

  const primaryContent = (primarySource ?? "").trim();
  const embedLines = embedSource ?? [];
  const attachmentLines = attachmentSource ?? [];

  return {
    primaryContent,
    embedLines,
    attachmentLines,
  };
};

const createHeading = (
  authorLabel: string,
  timeLabel: string,
  format: ClipboardFormat,
  isSingle: boolean
): string => {
  const timeSuffix = timeLabel ? " (" + timeLabel + ")" : "";
  const markdownTimePrefix = timeLabel ? "**" + timeLabel + "** " : "";
  const plainTimePrefix = timeLabel ? timeLabel + " " : "";
  const markdownAuthorLabel = "**" + authorLabel + "**";

  if (format === "markdown") {
    if (isSingle) {
      return markdownAuthorLabel + timeSuffix + ":";
    }

    return markdownTimePrefix + markdownAuthorLabel + ":";
  }

  if (isSingle) {
    return authorLabel + timeSuffix + ":";
  }

  return plainTimePrefix + authorLabel + ":";
};

export const formatMessage = (
  message: ClipboardMessage,
  format: ClipboardFormat,
  isSingle: boolean
): string => {
  const timeLabel = formatTimestamp(message.timestamp);
  const authorLabel = message.author || "Unknown";
  const formatContent = resolveFormatContent(message, format);
  const heading = createHeading(authorLabel, timeLabel, format, isSingle);

  const sections = [
    formatContent.primaryContent,
    ...formatContent.embedLines,
    ...formatContent.attachmentLines,
  ].filter((section) => section.length > 0);

  if (sections.length === 0) {
    return heading;
  }

  const [firstSection, ...rest] = sections;
  let block = (heading + " " + firstSection).trimEnd();

  if (rest.length > 0) {
    block += "\n\n" + rest.join("\n\n");
  }

  return block;
};

export const formatMessages = (
  messages: ClipboardMessage[],
  format: ClipboardFormat
): string => {
  if (messages.length === 0) {
    return "";
  }

  const isSingle = messages.length === 1;
  const segments = messages.map((message) =>
    formatMessage(message, format, isSingle)
  );

  return segments.join("\n\n");
};

export const buildDropClipboardText = (
  drop: ClipboardDropSource,
  format: ClipboardFormat = "plain"
): string => {
  const quoteLookup = buildQuoteDropLookup([drop]);
  const message = buildClipboardMessage(drop, quoteLookup);
  return formatMessage(message, format, true);
};
