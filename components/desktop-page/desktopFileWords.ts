import type { ReleaseFileRow } from "@/components/release-section/ReleaseFilesTable";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";
import type {
  DesktopFileEntry,
  DesktopFileKind,
} from "@/lib/desktop-releases/releaseFiles";
import { formatReleaseFileSize } from "@/lib/release-section/fileSize";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

const KIND_WORDS: Readonly<
  Record<
    DesktopFileKind,
    { readonly title: MessageKey; readonly what: MessageKey }
  >
> = {
  windows: {
    title: "desktopPage.files.kind.windows.title",
    what: "desktopPage.files.kind.windows.what",
  },
  macos: {
    title: "desktopPage.files.kind.macos.title",
    what: "desktopPage.files.kind.macos.what",
  },
  checksums: {
    title: "desktopPage.files.kind.checksums.title",
    what: "desktopPage.files.kind.checksums.what",
  },
  other: {
    title: "desktopPage.files.kind.other.title",
    what: "desktopPage.files.kind.other.what",
  },
};

/** "86.0 MB"; null when the list gives no size. */
export function formatDesktopFileSize(bytes: number | null): string | null {
  return formatReleaseFileSize(LOCALE, bytes, {
    kb: "desktopPage.files.size.kb",
    mb: "desktopPage.files.size.mb",
    gb: "desktopPage.files.size.gb",
  });
}

/**
 * A file's row in a table of a release's files; `href` is its download
 * link, or undefined for a release whose files are not handed out.
 */
export function toDesktopFileRow(
  entry: DesktopFileEntry,
  href: string | undefined
): ReleaseFileRow {
  const { file } = entry;
  const words = KIND_WORDS[entry.kind];
  return {
    name: file.name,
    title: t(LOCALE, words.title),
    what: t(LOCALE, words.what),
    size:
      formatDesktopFileSize(file.size) ??
      t(LOCALE, "desktopPage.files.size.unknown"),
    sha256: file.sha256,
    copyLabel: t(LOCALE, "desktopPage.files.sha256.copyLabel", {
      file: file.name,
    }),
    href,
    downloadLabel: t(LOCALE, "desktopPage.files.download.label", {
      file: file.name,
    }),
  };
}

/** The headings of a table of a release's files. */
export function desktopFileColumns() {
  return {
    file: t(LOCALE, "desktopPage.files.column.file"),
    size: t(LOCALE, "desktopPage.files.column.size"),
    sha256: t(LOCALE, "desktopPage.files.column.sha256"),
    download: t(LOCALE, "desktopPage.files.column.download"),
  };
}
