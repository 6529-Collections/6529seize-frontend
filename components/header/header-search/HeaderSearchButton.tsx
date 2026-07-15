"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useKey } from "react-use";

import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import WaveDropsSearchModal from "@/components/waves/drops/search/WaveDropsSearchModal";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import HeaderSearchModal from "./HeaderSearchModal";

interface HeaderSearchButtonProps {
  readonly wave: ApiWave | null;
}

type OpenSearch = "site" | "wave" | null;

export default function HeaderSearchButton({ wave }: HeaderSearchButtonProps) {
  const [openSearch, setOpenSearch] = useState<OpenSearch>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const waveChatScroll = useWaveChatScrollOptional();
  const locale = useBrowserLocale();
  const { isApp } = useDeviceInfo();

  useEffect(() => {
    let rafId: number | null = null;
    const isOpen = openSearch !== null;
    if (wasOpenRef.current && !isOpen) {
      rafId = window.requestAnimationFrame(() => {
        buttonRef.current?.focus({ preventScroll: true });
      });
    }
    wasOpenRef.current = isOpen;
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [openSearch]);

  const openContextSearch = () => setOpenSearch(wave ? "wave" : "site");
  const closeSearch = () => setOpenSearch(null);
  const handleSearchShortcut = (event?: KeyboardEvent) => {
    event?.preventDefault();
    openContextSearch();
  };

  useKey(
    (event) =>
      (event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k",
    handleSearchShortcut,
    { event: "keydown" }
  );

  const handleWaveResultSelect = (serialNo: number) => {
    if (!wave) return;
    if (waveChatScroll) {
      waveChatScroll.requestScrollToSerialNo({ waveId: wave.id, serialNo });
    } else {
      const params = new URLSearchParams(window.location.search);
      params.set("serialNo", String(serialNo));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const buttonLabel = wave
    ? t(locale, "waves.drops.searchModal.inputLabel", { waveName: wave.name })
    : t(locale, "headerSearch.inputLabel");
  return (
    <div className="tailwind-scope tw-self-center">
      <button
        ref={buttonRef}
        type="button"
        aria-label={buttonLabel}
        title={buttonLabel}
        onClick={openContextSearch}
        className={clsx(
          "tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-text-iron-300 tw-shadow-sm tw-transition tw-duration-200 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400",
          isApp
            ? "tw-size-9 tw-bg-black"
            : "tw-size-10 tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700"
        )}
      >
        <MagnifyingGlassIcon className="tw-size-5 tw-flex-shrink-0" />
      </button>

      {wave && (
        <WaveDropsSearchModal
          isOpen={openSearch === "wave"}
          onClose={closeSearch}
          wave={wave}
          onSelectSerialNo={handleWaveResultSelect}
          onSearchAll={() => setOpenSearch("site")}
        />
      )}

      <CommonAnimationWrapper mode="sync" initial>
        {openSearch === "site" && (
          <CommonAnimationOpacity
            key="site-search-modal"
            elementClasses="tw-absolute tw-z-10"
            onClicked={(event) => event.stopPropagation()}
          >
            <HeaderSearchModal onClose={closeSearch} wave={null} />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
