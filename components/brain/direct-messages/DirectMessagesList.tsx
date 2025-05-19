import React, { useRef, useEffect } from "react";
import UnifiedWavesListWaves from "../left-sidebar/waves/UnifiedWavesListWaves";
import { UnifiedWavesListLoader } from "../left-sidebar/waves/UnifiedWavesListLoader";
import UnifiedWavesListEmpty from "../left-sidebar/waves/UnifiedWavesListEmpty";
import BrainLeftSidebarCreateADirectMessageButton from "../left-sidebar/BrainLeftSidebarCreateADirectMessageButton";
import { useMyStream } from "../../../contexts/wave/MyStreamContext";

const DirectMessagesList: React.FC = () => {
  const { directMessages, activeWave, registerWave } = useMyStream();

  const onNextPage = () => {
    if (
      directMessages.hasNextPage &&
      !directMessages.isFetchingNextPage &&
      !directMessages.isFetching
    ) {
      directMessages.fetchNextPage();
    }
  };

  // infinite scroll observer (same logic as waves list)
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    hasFetchedRef.current = false;
  }, [directMessages.hasNextPage, directMessages.isFetchingNextPage]);

  useEffect(() => {
    if (!directMessages.hasNextPage || directMessages.isFetchingNextPage)
      return;
    const node = loadMoreRef.current;
    if (!node) return;

    const handler: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        directMessages.hasNextPage &&
        !directMessages.isFetchingNextPage &&
        !hasFetchedRef.current
      ) {
        hasFetchedRef.current = true;
        directMessages.fetchNextPage();
      }
    };

    const observer = new IntersectionObserver(handler, { rootMargin: "100px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [directMessages.hasNextPage, directMessages.isFetchingNextPage]);

  return (
    <div className="tw-mb-4">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-4">
        <div className="tw-px-4 tw-mb-4 tw-w-full">
          <BrainLeftSidebarCreateADirectMessageButton />
        </div>

        <UnifiedWavesListWaves
          waves={directMessages.list.map((w) => ({ ...w, isPinned: false }))}
          onHover={registerWave}
          hideToggle
          hidePin
          hideHeaders
        />

        <UnifiedWavesListLoader
          loadMoreRef={loadMoreRef}
          isFetchingNextPage={directMessages.isFetchingNextPage}
          hasNextPage={!!directMessages.hasNextPage}
        />

        <UnifiedWavesListEmpty
          sortedWaves={directMessages.list}
          isFetchingNextPage={directMessages.isFetchingNextPage}
        />
      </div>
    </div>
  );
};

export default DirectMessagesList;
