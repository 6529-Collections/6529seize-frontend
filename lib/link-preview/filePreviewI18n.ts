import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US";
import type { ExternalFileKind } from "@/lib/link-preview/fileKinds";

const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;
const FILE_KIND_LABEL_KEYS = {
  pdf: "linkPreview.file.kind.pdf",
  csv: "linkPreview.file.kind.csv",
  text: "linkPreview.file.kind.text",
  code: "linkPreview.file.kind.code",
  image: "linkPreview.file.kind.image",
  audio: "linkPreview.file.kind.audio",
  video: "linkPreview.file.kind.video",
  archive: "linkPreview.file.kind.archive",
  document: "linkPreview.file.kind.document",
  spreadsheet: "linkPreview.file.kind.spreadsheet",
  presentation: "linkPreview.file.kind.presentation",
  binary: "linkPreview.file.kind.binary",
  unknown: "linkPreview.file.kind.unknown",
} as const satisfies Record<ExternalFileKind, MessageKey>;

type FileSizeUnit = (typeof FILE_SIZE_UNITS)[number];

function getFileSizeUnitLabel(
  locale: SupportedLocale,
  unit: FileSizeUnit
): string {
  switch (unit) {
    case "B":
      return t(locale, "linkPreview.file.size.unit.B");
    case "KB":
      return t(locale, "linkPreview.file.size.unit.KB");
    case "MB":
      return t(locale, "linkPreview.file.size.unit.MB");
    case "GB":
      return t(locale, "linkPreview.file.size.unit.GB");
  }
}

export function formatFileSizeLabel(
  sizeBytes: number | null | undefined,
  locale: SupportedLocale
): string | null {
  if (
    typeof sizeBytes !== "number" ||
    !Number.isFinite(sizeBytes) ||
    sizeBytes < 0
  ) {
    return null;
  }

  let size = sizeBytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < FILE_SIZE_UNITS.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formatted = formatNumber(locale, size, {
    maximumFractionDigits: unitIndex === 0 || size >= 10 ? 0 : 1,
  });
  return t(locale, "linkPreview.file.size.value", {
    value: formatted,
    unit: getFileSizeUnitLabel(locale, FILE_SIZE_UNITS[unitIndex]!),
  });
}

export function getLocalizedFileKindLabel(
  locale: SupportedLocale,
  kind: ExternalFileKind
): string {
  return t(locale, FILE_KIND_LABEL_KEYS[kind]);
}

export function getLocalizedGithubFileKindLabel(
  locale: SupportedLocale,
  kind: ExternalFileKind
): string {
  if (kind === "unknown") {
    return getLocalizedFileKindLabel(locale, kind);
  }

  return t(locale, "linkPreview.github.fileKind", {
    kind: getLocalizedFileKindLabel(locale, kind),
  });
}
