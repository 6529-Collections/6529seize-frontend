import { base64ToBytes } from "../bytes";
import { decodePayload } from "../payload";
import type { SignedVersion, StoredMessage } from "../records";
import type { E2eeReportPreview, E2eeReportVersion } from "../types";
import { requireMls, type EngineContext } from "./context";
import { E2eeError } from "./errors";

/**
 * Reports send signed payloads exactly as received, so trust and safety can
 * verify the sender. An edited message is reported as its latest edit, the
 * text the reader saw; the original (with its attachment keys) goes along
 * only when the reporter chooses to include it.
 */

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/** Backups restore records as stored, so the shape is checked before use. */
function isSignedVersion(value: unknown): value is SignedVersion {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const version = value as Record<string, unknown>;
  return (
    typeof version["epoch"] === "number" &&
    isText(version["body"]) &&
    isText(version["sig"]) &&
    isText(version["senderDeviceKey"])
  );
}

function originalVersion(message: StoredMessage): SignedVersion | null {
  if (
    message.body === null ||
    message.sig === null ||
    message.epoch === null ||
    message.senderDeviceKey === null
  ) {
    return null;
  }
  return {
    epoch: message.epoch,
    body: message.body,
    sig: message.sig,
    senderDeviceKey: message.senderDeviceKey,
  };
}

interface ReportVersions {
  /** The version shown now; null when no signed copy of it is held. */
  readonly latest: SignedVersion | null;
  /** The original as first sent; null unless the message was edited. */
  readonly original: SignedVersion | null;
}

function reportVersions(message: StoredMessage): ReportVersions {
  const original = originalVersion(message);
  if (message.editedAt === null) {
    return { latest: original, original: null };
  }
  const latest = isSignedVersion(message.latestEdit)
    ? message.latestEdit
    : null;
  return { latest, original };
}

/** What one signed payload carries, decoded from the bytes a report sends. */
function describe(version: SignedVersion | null): E2eeReportVersion | null {
  if (version === null) {
    return null;
  }
  let payload;
  try {
    payload = decodePayload(base64ToBytes(version.body));
  } catch {
    return null;
  }
  if (payload?.t === "msg") {
    return {
      text: payload.text,
      attachmentNames: (payload.att ?? []).map((att) => att.name),
    };
  }
  if (payload?.t === "edit") {
    return { text: payload.text, attachmentNames: [] };
  }
  return null;
}

export function previewReport(message: StoredMessage): E2eeReportPreview {
  const versions = reportVersions(message);
  return {
    latest: describe(versions.latest),
    original: describe(versions.original),
  };
}

export async function sendReport(
  ctx: EngineContext,
  g: string,
  message: StoredMessage,
  input: {
    readonly reason: string;
    readonly notes?: string | undefined;
    readonly includeOriginal?: boolean | undefined;
  }
): Promise<void> {
  const { latest, original } = reportVersions(message);
  if (latest === null) {
    throw new E2eeError("E2EE_REPORT_UNAVAILABLE");
  }
  const versions =
    input.includeOriginal && original !== null ? [latest, original] : [latest];
  const reporterDeviceKey = requireMls(ctx).deviceKey();
  const notes = input.notes ? input.notes.slice(0, 1000) : undefined;
  for (const version of versions) {
    await ctx.api.report({
      group: g.toLowerCase(),
      epoch: version.epoch,
      body: version.body,
      signature: version.sig,
      sender_device_key: version.senderDeviceKey,
      reporter_device_key: reporterDeviceKey,
      reason: input.reason,
      ...(notes ? { notes } : {}),
    });
  }
}
