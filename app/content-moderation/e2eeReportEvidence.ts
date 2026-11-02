import { decodePayload } from "@/lib/e2ee/payload";

/** About 96 KiB of base64: above the server's 64 KiB report body cap. */
const MAX_EVIDENCE_BASE64_LENGTH = 96 * 1024;

interface E2eeReportEvidence {
  readonly readable: boolean;
  readonly text: string;
  readonly attachments: readonly string[];
}

/**
 * The reported body is the message payload as the reporter decrypted it.
 * Only its text and attachment names are shown, never as markup; attachment
 * keys in the payload are not displayed.
 */
export function readE2eeReportEvidence(body: string): E2eeReportEvidence {
  // The server caps a report body at 64 KiB; refuse anything larger before
  // decoding reporter-controlled bytes (defense in depth).
  if (body.length > MAX_EVIDENCE_BASE64_LENGTH) {
    return { readable: false, text: "", attachments: [] };
  }
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(body), (char) => char.codePointAt(0) ?? 0);
  } catch {
    return { readable: false, text: "", attachments: [] };
  }
  const payload = decodePayload(bytes);
  if (payload?.t === "msg") {
    return {
      readable: true,
      text: payload.text,
      attachments: (payload.att ?? []).map((item) => item.name),
    };
  }
  let decoded: string;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { readable: false, text: "", attachments: [] };
  }
  return {
    readable: true,
    text: bareText(decoded) ?? decoded,
    attachments: [],
  };
}

/** The `text` of a JSON object that is not a full message payload. */
function bareText(decoded: string): string | null {
  try {
    const parsed: unknown = JSON.parse(decoded);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      typeof (parsed as { text?: unknown }).text === "string"
    ) {
      return (parsed as { text: string }).text;
    }
  } catch {
    // Not JSON: show the decoded text as it is.
  }
  return null;
}
