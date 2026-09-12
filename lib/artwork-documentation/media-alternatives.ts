import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationAsset } from "@/generated/models/ApiArtworkDocumentationAsset";
import type { ApiArtworkDocumentationPublicPreview } from "@/generated/models/ApiArtworkDocumentationPublicPreview";
import { ApiArtworkDocumentationAnswerStatusEnum } from "@/generated/models/ApiArtworkDocumentationAnswer";

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (row: unknown): row is Record<string, unknown> =>
          row !== null && typeof row === "object" && !Array.isArray(row)
      )
    : [];
}
function includes(value: unknown, id: string): boolean {
  return Array.isArray(value) && value.includes(id);
}

/** Resolve only recorded relationships within the supplied draft or publication projection. */
export function documentationMediaAlternatives(
  context: ApiArtworkDocumentationContext,
  asset: ApiArtworkDocumentationAsset,
  publication?: ApiArtworkDocumentationPublicPreview
) {
  const record = publication ?? context;
  const answerRows = (moduleId: string, fieldId: string) => {
    const answer = record.modules[moduleId]?.answers[fieldId];
    return answer?.status === ApiArtworkDocumentationAnswerStatusEnum.Provided
      ? rows(answer.value)
      : [];
  };
  const sessions = answerRows("interview", "sessions").filter((session) =>
    includes(session["recording_asset_ids"], asset.id)
  );
  const documents = answerRows("context", "documents");
  const captionLinks = record.asset_links.filter(
    (link) =>
      link.role === "captions" &&
      (link.derived_from_asset_ids.includes(asset.id) ||
        sessions.some((session) =>
          includes(session["caption_asset_ids"], link.asset_id)
        ))
  );
  const captions = captionLinks.flatMap((link) => {
    const file = context.assets.find(
      (candidate) => candidate.id === link.asset_id
    );
    if (
      file?.state !== "ready" ||
      !context.capabilities.read_archival_files ||
      !/\.vtt$/i.test(file.filename) ||
      !["text/vtt", "text/plain"].includes(file.detected_mime ?? "")
    )
      return [];
    const session = sessions.find((item) =>
      includes(item["caption_asset_ids"], file.id)
    );
    return [
      {
        asset: file,
        language:
          typeof session?.["language"] === "string"
            ? session["language"]
            : undefined,
      },
    ];
  });
  const transcripts = sessions.flatMap((session) => {
    const document = documents.find(
      (item) => item["id"] === session["transcript_document_id"]
    );
    const text = session["transcript_text"] ?? document?.["text"];
    if (typeof text !== "string" || !text.trim()) return [];
    const language = session["language"] ?? document?.["language"];
    return [
      {
        id: String(session["id"]),
        text,
        language: typeof language === "string" ? language : undefined,
      },
    ];
  });
  return { captions, transcripts };
}

const MAX_CAPTION_BYTES = 2 * 1024 * 1024;

/** Signed storage bytes are fetched without application credentials and bounded before decoding. */
export async function fetchDocumentationCaptions(
  url: string,
  signal: AbortSignal
): Promise<Blob> {
  if (new URL(url).protocol !== "https:")
    throw new Error("Invalid caption URL");
  const response = await fetch(url, {
    signal,
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok || !response.body)
    throw new Error("Caption download unavailable");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let length = 0;
  let text = "";
  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      length += chunk.value.byteLength;
      if (length > MAX_CAPTION_BYTES) throw new Error("Caption file too large");
      text += decoder.decode(chunk.value, { stream: true });
      chunk = await reader.read();
    }
    text += decoder.decode();
    const header = text.split("\n", 1)[0]?.replace(/\r$/, "") ?? "";
    const validHeader =
      header === "WEBVTT" ||
      header.startsWith("WEBVTT ") ||
      header.startsWith("WEBVTT\t");
    if (signal.aborted || !validHeader || text.includes("\0"))
      throw new Error("Invalid WebVTT");
    return new Blob([text], { type: "text/vtt" });
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
