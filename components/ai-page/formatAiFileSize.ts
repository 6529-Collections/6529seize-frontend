import { DEFAULT_LOCALE } from "@/i18n/locales";
import "@/i18n/namespaces/ai-download";
import { formatReleaseFileSize } from "@/lib/release-section/fileSize";

/**
 * A file's size in decimal units, as most download pages write them:
 * "95.5 MB", and "1.2 GB" for the CUDA packages. Null when the feed gives
 * no size. Rendered on the server, in the locale the server renders.
 */
export function formatAiFileSize(bytes: number | null): string | null {
  return formatReleaseFileSize(DEFAULT_LOCALE, bytes, {
    kb: "ai.files.size.kb",
    mb: "ai.files.size.mb",
    gb: "ai.files.size.gb",
  });
}
