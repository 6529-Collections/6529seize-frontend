"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContentTab } from "@/components/brain/ContentTabContext";
import LazyHeaderSearchModal from "@/components/header/header-search/LazyHeaderSearchModal";
import LazyWaveDropsSearchModal from "@/components/waves/drops/search/LazyWaveDropsSearchModal";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { isCompetitionPathname } from "@/helpers/competition.helpers";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import { MyStreamWaveTab } from "@/types/waves.types";

const WaveSearchContext = createContext<{
  open: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
} | null>(null);

export function useOpenMyStreamWaveSearch() {
  const open = useContext(WaveSearchContext);
  if (open === null)
    throw new Error("Wave search requires its stable tabs owner");
  return open;
}

/** Competition resolution can replace either header without destroying search. */
export function MyStreamWaveSearch({
  wave,
  onSelectCuration,
  children,
}: {
  readonly wave: ApiWave;
  readonly onSelectCuration: (id: string | null) => void;
  readonly children: ReactNode;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [openSearch, setOpenSearch] = useState<"wave" | "site" | null>(null);
  const { setActiveContentTab } = useContentTab();
  const waveChatScroll = useWaveChatScrollOptional();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchContext = useMemo(
    () => ({ open: () => setOpenSearch("wave"), trigger }),
    []
  );

  const closeSearch = () => {
    setOpenSearch(null);
    requestAnimationFrame(() =>
      trigger.current?.focus({ preventScroll: true })
    );
  };

  const selectMessage = (serialNo: number) => {
    onSelectCuration(null);
    setActiveContentTab(MyStreamWaveTab.CHAT);
    if (waveChatScroll && !isCompetitionPathname(pathname)) {
      waveChatScroll.requestScrollToSerialNo({ waveId: wave.id, serialNo });
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("curation");
    params.set("serialNo", String(serialNo));
    const chatPath = isCompetitionPathname(pathname)
      ? getWavePathRoute(wave.id)
      : pathname;
    router.replace(`${chatPath}?${params.toString()}`, { scroll: false });
  };

  return (
    <WaveSearchContext.Provider value={searchContext}>
      {children}
      <LazyWaveDropsSearchModal
        isOpen={openSearch === "wave"}
        onClose={closeSearch}
        wave={wave}
        onSelectSerialNo={selectMessage}
        onSearchAll={() => setOpenSearch("site")}
      />
      {openSearch === "site" && (
        <LazyHeaderSearchModal onClose={closeSearch} wave={null} />
      )}
    </WaveSearchContext.Provider>
  );
}
