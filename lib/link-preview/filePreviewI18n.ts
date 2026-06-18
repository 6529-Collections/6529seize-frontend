import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { ExternalFileKind } from "@/lib/link-preview/fileKinds";

const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;

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
  switch (kind) {
    case "pdf":
      return t(locale, "linkPreview.file.kind.pdf");
    case "csv":
      return t(locale, "linkPreview.file.kind.csv");
    case "text":
      return t(locale, "linkPreview.file.kind.text");
    case "code":
      return t(locale, "linkPreview.file.kind.code");
    case "image":
      return t(locale, "linkPreview.file.kind.image");
    case "audio":
      return t(locale, "linkPreview.file.kind.audio");
    case "video":
      return t(locale, "linkPreview.file.kind.video");
    case "archive":
      return t(locale, "linkPreview.file.kind.archive");
    case "document":
      return t(locale, "linkPreview.file.kind.document");
    case "spreadsheet":
      return t(locale, "linkPreview.file.kind.spreadsheet");
    case "presentation":
      return t(locale, "linkPreview.file.kind.presentation");
    case "binary":
      return t(locale, "linkPreview.file.kind.binary");
    case "unknown":
      return t(locale, "linkPreview.file.kind.unknown");
  }
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
