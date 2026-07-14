"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function JsonPanel({
  importError,
  jsonDraft,
  locale,
  onChange,
  onDownloadPackage,
  onDownloadSchemaBundle,
  onDownloadSourcePacket,
  onImport,
}: {
  readonly importError: string;
  readonly jsonDraft: string;
  readonly locale: SupportedLocale;
  readonly onChange: (value: string) => void;
  readonly onDownloadPackage: () => void;
  readonly onDownloadSchemaBundle: () => void;
  readonly onDownloadSourcePacket: () => void;
  readonly onImport: () => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h2 className="tw-text-lg tw-font-semibold tw-text-white">
          {t(locale, "profileCms.builder.json.title")}
        </h2>
        <button
          className="tw-min-h-10 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-px-3 tw-text-sm tw-font-semibold tw-text-white"
          onClick={onImport}
          type="button"
        >
          {t(locale, "profileCms.builder.json.import")}
        </button>
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <button
          className="tw-min-h-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400"
          onClick={onDownloadPackage}
          type="button"
        >
          {t(locale, "profileCms.builder.json.downloadPackage")}
        </button>
        <button
          className="tw-min-h-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400"
          onClick={onDownloadSourcePacket}
          type="button"
        >
          {t(locale, "profileCms.builder.json.downloadSourcePacket")}
        </button>
        <button
          className="tw-min-h-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400"
          onClick={onDownloadSchemaBundle}
          type="button"
        >
          {t(locale, "profileCms.builder.json.downloadSchemaBundle")}
        </button>
      </div>
      {importError ? (
        <p className="tw-border tw-border-solid tw-border-red tw-bg-red/10 tw-p-3 tw-text-sm tw-text-red">
          {importError}
        </p>
      ) : null}
      <label
        className="tw-text-sm tw-font-medium tw-text-iron-300"
        htmlFor="cms-builder-json"
      >
        {t(locale, "profileCms.builder.json.label")}
      </label>
      <textarea
        className="tw-min-h-[560px] tw-w-full tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-p-3 tw-font-mono tw-text-sm tw-leading-6 tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
        id="cms-builder-json"
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        value={jsonDraft}
      />
    </div>
  );
}
