import { getWalletAddress, getWalletRole } from "@/services/auth/auth.utils";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import { getContentType } from "@/services/uploads/mediaUploadMimeType";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

// A prepared upload can only be reused by the account/proxy that uploaded it.
const preparedImages = new WeakMap<
  File,
  { owner: string; media: ApiDropMedia }
>();

export const getDropUploadOwner = (): string =>
  `${getWalletAddress()?.toLowerCase() ?? ""}:${getWalletRole() ?? ""}`;

export function getPreparedDropImage(file: File): ApiDropMedia | undefined {
  const prepared = preparedImages.get(file);
  return prepared?.owner === getDropUploadOwner() ? prepared.media : undefined;
}

export function rememberPreparedDropImage(
  file: File,
  media: ApiDropMedia,
  owner: string
): void {
  preparedImages.set(file, { owner, media });
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
