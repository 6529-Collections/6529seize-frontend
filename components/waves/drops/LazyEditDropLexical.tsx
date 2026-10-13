"use client";

import dynamic from "next/dynamic";

import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import type { EditDropLexicalProps } from "./EditDropLexical";

// Mirrors the editor's outer box (and the cancel/save row beneath it) so the
// drop keeps its height while the Lexical chunk loads. The editor focuses
// itself on mount, so focus lands as soon as the real editor replaces this.
function EditDropLexicalPlaceholder() {
  const locale = useBrowserLocale();
  const { isApp } = useDeviceInfo();

  return (
    <div className="tw-w-full" aria-busy="true">
      <div
        role="status"
        className="tw-min-h-[40px] tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-py-2.5 tw-pl-3 tw-pr-10 tw-text-sm tw-text-iron-500"
        style={{ lineHeight: "1.4" }}
      >
        {t(locale, "waves.drops.editorLoadingStatus")}
      </div>
      <div
        aria-hidden="true"
        className={isApp ? "tw-mb-2 tw-mt-3 tw-h-8" : "tw-mt-1 tw-h-4"}
      />
    </div>
  );
}

const LazyEditDropLexical = dynamic<EditDropLexicalProps>(
  () => import("./EditDropLexical"),
  { ssr: false, loading: () => <EditDropLexicalPlaceholder /> }
);

export default LazyEditDropLexical;
