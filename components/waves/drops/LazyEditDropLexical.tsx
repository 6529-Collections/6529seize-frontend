"use client";

import { CancelOnEscapeWhileLoading } from "@/components/utils/lazy-load/EscapeWhileLoading";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useDeviceSigningPrewarm } from "@/hooks/device-signing/useDeviceSigningPrewarm";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import { editDropLexicalLoader } from "./editDropLexicalLoader";
import type { EditDropLexicalProps } from "./EditDropLexical";

// Mirrors the editor's outer box (and the cancel/save row beneath it) so the
// drop keeps its height while the Lexical chunk loads. The editor focuses
// itself on mount, so focus lands as soon as the real editor replaces this.
// Escape cancels the edit meanwhile, as it does once the editor is up.
function EditDropLexicalPlaceholder({
  onCancel,
}: {
  readonly onCancel: () => void;
}) {
  const locale = useBrowserLocale();
  const { isApp } = useDeviceInfo();

  return (
    <div className="tw-w-full" aria-busy="true">
      <CancelOnEscapeWhileLoading onEscape={onCancel} />
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

const LoadedEditDropLexical = editDropLexicalLoader.Loaded;

// The editor loads on first edit unless it was preloaded. Once it is cached it
// renders in the same commit as the edit, with no placeholder frame.
export default function LazyEditDropLexical(
  props: Readonly<EditDropLexicalProps>
) {
  const isReady = editDropLexicalLoader.useIsReady({
    onError: props.onCancel,
  });
  // A signed edit should not wait on IndexedDB or WebCrypto at save time.
  useDeviceSigningPrewarm();

  if (!isReady) {
    return <EditDropLexicalPlaceholder onCancel={props.onCancel} />;
  }

  return <LoadedEditDropLexical {...props} />;
}
