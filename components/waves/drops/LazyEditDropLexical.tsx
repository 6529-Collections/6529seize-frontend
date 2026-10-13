"use client";

import dynamic from "next/dynamic";

import {
  CancelOnEscapeWhileLoading,
  EscapeWhileLoadingProvider,
} from "@/components/utils/lazy-load/EscapeWhileLoading";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import type { EditDropLexicalProps } from "./EditDropLexical";

// Mirrors the editor's outer box (and the cancel/save row beneath it) so the
// drop keeps its height while the Lexical chunk loads. The editor focuses
// itself on mount, so focus lands as soon as the real editor replaces this.
// Escape cancels the edit meanwhile, as it does once the editor is up.
function EditDropLexicalPlaceholder() {
  const locale = useBrowserLocale();
  const { isApp } = useDeviceInfo();

  return (
    <div className="tw-w-full" aria-busy="true">
      <CancelOnEscapeWhileLoading />
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

const DynamicEditDropLexical = dynamic<EditDropLexicalProps>(
  () => import("./EditDropLexical"),
  { ssr: false, loading: () => <EditDropLexicalPlaceholder /> }
);

export default function LazyEditDropLexical(
  props: Readonly<EditDropLexicalProps>
) {
  return (
    <EscapeWhileLoadingProvider onEscape={props.onCancel}>
      <DynamicEditDropLexical {...props} />
    </EscapeWhileLoadingProvider>
  );
}
