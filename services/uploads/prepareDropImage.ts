import { getWalletAddress, getWalletRole } from "@/services/auth/auth.utils";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import type { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import { getContentType } from "@/services/uploads/mediaUploadMimeType";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

// A prepared upload can only be reused by the account/proxy that uploaded it,
// and only for the purpose it was uploaded with: chat media is stripped of
// identifying metadata, while decision-entry media keeps the original file.
const preparedImages = new WeakMap<
  File,
  { owner: string; purpose: ApiMediaUploadPurpose; media: ApiDropMedia }
>();

export const getDropUploadOwner = (): string =>
  `${getWalletAddress()?.toLowerCase() ?? ""}:${getWalletRole() ?? ""}`;

function getOwnedPreparedDropImage(file: File) {
  const prepared = preparedImages.get(file);
  return prepared?.owner === getDropUploadOwner() ? prepared : undefined;
}

/** The prepared upload to reuse when posting `file` with `purpose`. */
export function getPreparedDropImage(
  file: File,
  purpose: ApiMediaUploadPurpose
): ApiDropMedia | undefined {
  const prepared = getOwnedPreparedDropImage(file);
  return prepared?.purpose === purpose ? prepared.media : undefined;
}

/**
 * The prepared upload to show in the composer's own preview. The preview is
 * never posted, so an upload prepared for either purpose will do.
 */
export function getPreparedDropImagePreview(
  file: File
): ApiDropMedia | undefined {
  return getOwnedPreparedDropImage(file)?.media;
}

export function rememberPreparedDropImage(
  file: File,
  media: ApiDropMedia,
  owner: string,
  purpose: ApiMediaUploadPurpose
): void {
  preparedImages.set(file, { owner, purpose, media });
}

export async function validateDropImageSignature(
  file: File,
  locale: SupportedLocale = DEFAULT_LOCALE
): Promise<void> {
  const contentType = getContentType(file);
  if (!contentType.startsWith("image/")) return;
  const header = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  const brandAt = (offset: number) =>
    String.fromCodePoint(...header.subarray(offset, offset + 4));
  const brands: string[] = [];
  if (header.length >= 16 && brandAt(4) === "ftyp") {
    const end = new DataView(header.buffer).getUint32(0);
    if (end < 16 || end > header.length || end % 4 !== 0) {
      throw new Error(t(locale, "drop.upload.avifMismatch"));
    }
    for (let offset = 8; offset + 4 <= end; offset += 4) {
      if (offset !== 12) brands.push(brandAt(offset));
    }
  }
  const isAvif = brands.includes("avif") || brands.includes("avis");
  if (isAvif !== (contentType === "image/avif")) {
    throw new Error(t(locale, "drop.upload.avifMismatch"));
  }
  if (brands.includes("avis")) {
    throw new Error(t(locale, "drop.upload.animatedAvif"));
  }
}
