import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import { commonApiFetchWithRetry } from "@/services/api/common-api";
import { LEGACY_DM_DELETION_AT } from "./legacyDmRetention";

/**
 * Export of an unencrypted DM, built in the member's own browser from what
 * the API already lets them read (D146). `LegacyDmItem` is also the item
 * shape the import into an encrypted chat carries, so an export and an
 * import describe a message the same way.
 */
export const LEGACY_DM_EXPORT_FORMAT = "6529.legacy-dm-export.v1";

export interface LegacyDmPerson {
  readonly profile_id: string;
  readonly handle: string | null;
}

interface LegacyDmMedia {
  readonly url: string;
  readonly mime_type: string;
}

interface LegacyDmAttachment {
  readonly file_name: string;
  readonly mime_type: string;
  readonly url: string | null;
}

interface LegacyDmPart {
  readonly text: string;
  readonly quoted_drop_id: string | null;
  readonly media: readonly LegacyDmMedia[];
  readonly attachments: readonly LegacyDmAttachment[];
}

export interface LegacyDmItem {
  readonly legacy_drop_id: string;
  readonly serial_no: number;
  readonly author: LegacyDmPerson;
  /** Server receive time, epoch milliseconds (claimed, not proved). */
  readonly created_at: number;
  readonly updated_at: number | null;
  readonly title: string | null;
  readonly reply_to: string | null;
  readonly parts: readonly LegacyDmPart[];
  readonly mentions: readonly LegacyDmPerson[];
  readonly reactions: readonly {
    readonly reaction: string;
    readonly profile_ids: readonly string[];
  }[];
}

export interface LegacyDmExport {
  readonly format: typeof LEGACY_DM_EXPORT_FORMAT;
  readonly exported_at: string;
  readonly exported_by: LegacyDmPerson;
  readonly server_deletion_at: string;
  /** Plain statement of what this file is; also shown in the HTML. */
  readonly notice: string;
  readonly conversation: {
    readonly wave_id: string;
    readonly name: string;
    readonly participants: readonly LegacyDmPerson[];
  };
  readonly messages: readonly LegacyDmItem[];
}

type FeedDrop = ApiDrop | ApiDropWithoutWave;

/** One API drop as an export item. */
export function toLegacyDmItem(drop: FeedDrop): LegacyDmItem {
  return {
    legacy_drop_id: drop.id,
    serial_no: drop.serial_no,
    author: { profile_id: drop.author.id, handle: drop.author.handle },
    created_at: drop.created_at,
    updated_at: drop.updated_at,
    title: drop.title,
    reply_to: drop.reply_to?.drop_id ?? null,
    parts: drop.parts.map((part) => ({
      text: part.content ?? "",
      quoted_drop_id: part.quoted_drop?.drop_id ?? null,
      media: part.media.map((media) => ({
        url: media.url,
        mime_type: media.mime_type,
      })),
      attachments: part.attachments.map((attachment) => ({
        file_name: attachment.file_name,
        mime_type: String(attachment.mime_type),
        url: attachment.url ?? null,
      })),
    })),
    mentions: drop.mentioned_users.map((mention) => ({
      profile_id: mention.mentioned_profile_id,
      handle: mention.current_handle ?? mention.handle_in_content,
    })),
    reactions: drop.reactions.map((reaction) => ({
      reaction: reaction.reaction,
      profile_ids: reaction.profiles.map((profile) => profile.id),
    })),
  };
}

/** Sorted by serial number, one item per drop. */
export function collectLegacyDmItems(
  drops: readonly FeedDrop[]
): LegacyDmItem[] {
  const byId = new Map<string, LegacyDmItem>();
  for (const drop of drops) {
    byId.set(drop.id, toLegacyDmItem(drop));
  }
  return [...byId.values()].sort((a, b) => a.serial_no - b.serial_no);
}

/** Everyone who wrote in the conversation, in order of first message. */
export function participantsOf(drops: readonly FeedDrop[]): LegacyDmPerson[] {
  const people = new Map<string, LegacyDmPerson>();
  for (const drop of [...drops].sort((a, b) => a.serial_no - b.serial_no)) {
    if (!people.has(drop.author.id)) {
      people.set(drop.author.id, {
        profile_id: drop.author.id,
        handle: drop.author.handle,
      });
    }
  }
  return [...people.values()];
}

export function buildLegacyDmExport(input: {
  readonly waveId: string;
  readonly name: string;
  readonly participants: readonly LegacyDmPerson[];
  readonly exportedBy: LegacyDmPerson;
  readonly exportedAt: Date;
  readonly notice: string;
  readonly drops: readonly FeedDrop[];
}): LegacyDmExport {
  return {
    format: LEGACY_DM_EXPORT_FORMAT,
    exported_at: input.exportedAt.toISOString(),
    exported_by: input.exportedBy,
    server_deletion_at: LEGACY_DM_DELETION_AT,
    notice: input.notice,
    conversation: {
      wave_id: input.waveId,
      name: input.name,
      participants: input.participants,
    },
    messages: collectLegacyDmItems(input.drops),
  };
}

/** Page size the waves feed accepts (it falls back to 50 at 200 or more). */
const LEGACY_DM_EXPORT_PAGE_SIZE = 199;

/**
 * Reads the whole conversation, newest first, through the existing feed.
 * Reports progress after each page; an aborted signal stops it.
 */
export async function fetchLegacyDmDrops(input: {
  readonly waveId: string;
  readonly signal?: AbortSignal | undefined;
  readonly onProgress?: ((count: number) => void) | undefined;
  readonly fetchPage?: typeof fetchFeedPage | undefined;
}): Promise<ApiDropWithoutWave[]> {
  const fetchPage = input.fetchPage ?? fetchFeedPage;
  const drops: ApiDropWithoutWave[] = [];
  let before: number | null = null;
  let fresh: ApiDropWithoutWave[];
  do {
    const after: number | null = before;
    const page = await fetchPage(input.waveId, after, input.signal);
    fresh = page.drops.filter(
      (drop) => after === null || drop.serial_no < after
    );
    if (fresh.length > 0) {
      drops.push(...fresh);
      input.onProgress?.(drops.length);
      before = fresh.reduce(
        (lowest, drop) => Math.min(lowest, drop.serial_no),
        Number.POSITIVE_INFINITY
      );
    }
  } while (fresh.length > 0);
  return drops;
}

async function fetchFeedPage(
  waveId: string,
  serialNoLessThan: number | null,
  signal: AbortSignal | undefined
): Promise<ApiWaveDropsFeed> {
  const params: Record<string, string> = {
    limit: String(LEGACY_DM_EXPORT_PAGE_SIZE),
  };
  if (serialNoLessThan !== null) {
    params["serial_no_less_than"] = String(serialNoLessThan);
  }
  return commonApiFetchWithRetry<ApiWaveDropsFeed>({
    endpoint: `waves/${encodeURIComponent(waveId)}/drops`,
    params,
    signal,
    retryOptions: { maxRetries: 3, initialDelayMs: 1000 },
  });
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/** Only http(s) links become anchors in the HTML file. */
function safeHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

interface LegacyDmHtmlLabels {
  readonly lang: string;
  readonly title: string;
  readonly exportedAt: string;
  readonly participants: string;
  readonly replyTo: string;
  readonly edited: string;
  readonly media: string;
  readonly unknownAuthor: string;
  readonly formatTime: (ms: number) => string;
}

function personName(person: LegacyDmPerson, unknown: string): string {
  return person.handle ? `@${person.handle}` : unknown;
}

function renderLink(url: string | null, label: string): string {
  const href = url ? safeHref(url) : null;
  return href
    ? `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${escapeHtml(label)}</a>`
    : escapeHtml(label);
}

function renderItem(item: LegacyDmItem, labels: LegacyDmHtmlLabels): string {
  const author = personName(item.author, labels.unknownAuthor);
  const meta = [
    `<strong>${escapeHtml(author)}</strong>`,
    `<time datetime="${new Date(item.created_at).toISOString()}">${escapeHtml(labels.formatTime(item.created_at))}</time>`,
    item.updated_at === null ? "" : `<span>${escapeHtml(labels.edited)}</span>`,
    item.reply_to
      ? `<a href="#m-${escapeHtml(item.reply_to)}">${escapeHtml(labels.replyTo)}</a>`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const parts = item.parts
    .map((part) => {
      const files = [
        ...part.media.map((media) => renderLink(media.url, media.mime_type)),
        ...part.attachments.map((file) => renderLink(file.url, file.file_name)),
      ];
      return [
        part.text ? `<p>${escapeHtml(part.text)}</p>` : "",
        files.length
          ? `<p class="files">${escapeHtml(labels.media)}: ${files.join(", ")}</p>`
          : "",
      ].join("");
    })
    .join("");
  const reactions = item.reactions.length
    ? `<p class="reactions">${item.reactions
        .map((r) => `${escapeHtml(r.reaction)} ${r.profile_ids.length}`)
        .join(" ")}</p>`
    : "";
  const title = item.title ? `<h2>${escapeHtml(item.title)}</h2>` : "";
  return `<article id="m-${escapeHtml(item.legacy_drop_id)}"><header>${meta}</header>${title}${parts}${reactions}</article>`;
}

/** A self-contained, readable page: no scripts, no remote loads. */
export function renderLegacyDmHtml(
  data: LegacyDmExport,
  labels: LegacyDmHtmlLabels
): string {
  const participants = data.conversation.participants
    .map((p) => escapeHtml(personName(p, labels.unknownAuthor)))
    .join(", ");
  return `<!doctype html>
<html lang="${escapeHtml(labels.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>${escapeHtml(labels.title)}</title>
<style>
body{font:15px/1.5 system-ui,sans-serif;max-width:46rem;margin:0 auto;padding:1rem;color:#1b1b1f;background:#fff}
@media (prefers-color-scheme:dark){body{color:#e8e8ec;background:#121214}a{color:#9cc4ff}}
.notice{border:1px solid #c98a00;border-radius:8px;padding:.75rem}
article{border-top:1px solid #8884;padding:.5rem 0}
article p{margin:.25rem 0;white-space:pre-wrap;overflow-wrap:anywhere}
header{font-size:13px;opacity:.85}
</style>
</head>
<body>
<h1>${escapeHtml(labels.title)}</h1>
<p class="notice">${escapeHtml(data.notice)}</p>
<p>${escapeHtml(labels.participants)}: ${participants}</p>
<p>${escapeHtml(labels.exportedAt)}</p>
${data.messages.map((item) => renderItem(item, labels)).join("\n")}
</body>
</html>
`;
}

/** `6529-dm-<name>-<yyyy-mm-dd>.<ext>`, safe on every filesystem. */
export function legacyDmExportFileName(
  name: string,
  exportedAt: Date,
  extension: "json" | "html"
): string {
  // Linear: one replace with a single character class, then a trim loop.
  const dashed = name.normalize("NFKD").replace(/[^\w-]+/g, "-");
  let start = 0;
  let end = dashed.length;
  while (start < end && dashed[start] === "-") {
    start += 1;
  }
  while (end > start && dashed[end - 1] === "-") {
    end -= 1;
  }
  const slug =
    dashed.slice(start, end).slice(0, 60).toLowerCase() || "conversation";
  return `6529-dm-${slug}-${exportedAt.toISOString().slice(0, 10)}.${extension}`;
}

/** Hands a file to the browser's download flow. */
export function downloadTextFile(
  fileName: string,
  content: string,
  mimeType: string
): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
