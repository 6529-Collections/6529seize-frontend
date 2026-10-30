"use client";

import { useLayoutViewportLock } from "@/components/brain/my-stream/layout/LayoutContext";
import Button from "@/components/utils/button/Button";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useMessageSearch } from "@/hooks/useMessageSearch";
import { t } from "@/i18n/messages";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FocusTrap } from "focus-trap-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";
import AdvancedWaveSearchInput from "./AdvancedWaveSearchInput";
import MessageSearchResults from "./MessageSearchResults";

const DIALOG_TITLE_ID = "wave-drops-search-title";
const DIALOG_DESCRIPTION_ID = "wave-drops-search-description";

export default function WaveDropsSearchModal({
  isOpen,
  onClose,
  wave,
  onSelectSerialNo,
  onSearchAll,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly wave: ApiWave;
  readonly onSelectSerialNo: (serialNo: number) => void;
  readonly onSearchAll?: (() => void) | undefined;
}) {
  useLayoutViewportLock(isOpen);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const locale = useBrowserLocale();
  const router = useRouter();
  const myStream = useMyStreamOptional();
  const [query, setQuery] = useState("");
  const search = useMessageSearch({
    query,
    enabled: isOpen,
    initialWave: wave,
  });
  const scopeName =
    search.selectedWave?.name ??
    t(locale, "waves.drops.searchModal.advanced.allWaves");
  useClickAway(modalRef, () => {
    if (isOpen) onClose();
  });
  useKeyPressEvent("Escape", () => {
    if (isOpen) onClose();
  });
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);
  if (!isOpen || typeof document === "undefined") return null;
  const selectDropResult = (drop: ExtendedDrop) => {
    // The callback scrolls the originating page, even after changing the search scope.
    if (drop.wave.id === wave.id) onSelectSerialNo(drop.serial_no);
    else if (myStream) {
      myStream.activeWave.set(drop.wave.id, {
        isDirectMessage:
          "is_dm_wave" in drop.wave && drop.wave.is_dm_wave === true,
        serialNo: drop.serial_no,
      });
    } else
      router.push(
        getWaveRoute({
          waveId: drop.wave.id,
          serialNo: drop.serial_no,
          isDirectMessage:
            "is_dm_wave" in drop.wave && drop.wave.is_dm_wave === true,
          isApp: false,
        })
      );
    onClose();
  };

  return createPortal(
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        fallbackFocus: () =>
          (modalRef.current as HTMLElement | null) ??
          (inputRef.current as HTMLElement | null) ??
          document.body,
        initialFocus: () =>
          (inputRef.current as HTMLElement | null) ??
          (modalRef.current as HTMLElement | null) ??
          document.body,
      }}
    >
      <div className="tailwind-scope tw-relative tw-z-1000 tw-cursor-default">
        <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px]" />
        <div className="tw-fixed tw-inset-0 tw-z-1000 tw-h-full tw-overflow-y-auto">
          <div className="tw-flex tw-h-full tw-min-h-full tw-items-start tw-justify-center tw-p-0 tw-text-center sm:tw-items-center sm:tw-p-5">
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={DIALOG_TITLE_ID}
              aria-describedby={DIALOG_DESCRIPTION_ID}
              className="tw-mt-[env(safe-area-inset-top)] tw-flex tw-h-full tw-min-h-0 tw-w-full tw-max-w-[min(100vw,860px)] tw-transform tw-flex-col tw-overflow-hidden tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-text-left tw-shadow-[0_24px_70px_rgba(0,0,0,0.55)] tw-transition-all sm:tw-h-[min(720px,78vh)] sm:tw-rounded-xl"
            >
              <div className="tw-flex tw-items-start tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 sm:tw-items-center sm:tw-px-5">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t(locale, "waves.drops.searchModal.close")}
                  className="-tw-ml-1 tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-none tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-150 hover:tw-bg-iron-900 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 sm:tw-hidden"
                >
                  <ChevronLeftIcon className="tw-size-6 tw-flex-shrink-0" />
                </button>

                <div className="tw-min-w-0 tw-flex-1">
                  <h2
                    id={DIALOG_TITLE_ID}
                    className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
                  >
                    {t(locale, "waves.drops.searchModal.title")}
                  </h2>
                  <p
                    id={DIALOG_DESCRIPTION_ID}
                    className="tw-m-0 tw-mt-0.5 tw-truncate tw-text-xs tw-leading-4"
                  >
                    <span className="tw-text-iron-600">
                      {t(locale, "waves.drops.searchModal.descriptionPrefix")}
                    </span>{" "}
                    <span className="tw-min-w-0 tw-truncate tw-text-iron-300">
                      {scopeName}
                    </span>
                  </p>
                </div>

                {onSearchAll && (
                  <Button onClick={onSearchAll} variant="tertiary" size="xs">
                    {t(locale, "waves.drops.searchModal.searchAll")}
                  </Button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t(locale, "waves.drops.searchModal.close")}
                  className="tw-hidden tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-150 hover:tw-bg-iron-900 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 sm:tw-inline-flex"
                >
                  <XMarkIcon className="tw-size-5 tw-flex-shrink-0" />
                </button>
              </div>

              <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 sm:tw-px-5">
                <AdvancedWaveSearchInput
                  query={query}
                  onQueryChange={setQuery}
                  wave={search.selectedWave}
                  onWaveChange={search.setSelectedWave}
                  author={search.authorFilter}
                  onAuthorChange={search.setAuthorFilter}
                  inputRef={inputRef}
                  enabled={isOpen}
                  readContext={search.readContext}
                />
              </div>
              <div
                className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 tw-pb-5 tw-pt-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/20 desktop-hover:hover:tw-scrollbar-thumb-white/30 sm:tw-px-5"
                aria-busy={search.showLoading}
              >
                <MessageSearchResults
                  search={search}
                  onSelect={selectDropResult}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
}
