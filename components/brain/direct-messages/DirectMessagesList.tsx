"use client";

import React, {
  useRef,
  useEffect,
  useContext,
  useEffectEvent,
  useMemo,
} from "react";
import UnifiedWavesListWaves, {
  UnifiedWavesListWavesHandle,
} from "../left-sidebar/waves/UnifiedWavesListWaves";
import { UnifiedWavesListLoader } from "../left-sidebar/waves/UnifiedWavesListLoader";
import UnifiedWavesListEmpty from "../left-sidebar/waves/UnifiedWavesListEmpty";
import BrainLeftSidebarCreateADirectMessageButton from "../left-sidebar/BrainLeftSidebarCreateADirectMessageButton";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import UserSetUpProfileCta from "@/components/user/utils/set-up-profile/UserSetUpProfileCta";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import ConnectWallet from "@/components/common/ConnectWallet";
import Image from "next/image";

interface DirectMessagesListProps {
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const DirectMessagesList: React.FC<DirectMessagesListProps> = ({
  scrollContainerRef,
}) => {
  const { isAuthenticated } = useSeizeConnectContext();
  const { connectedProfile } = useContext(AuthContext);
  const { isApp } = useDeviceInfo();

  const listRef = useRef<UnifiedWavesListWavesHandle>(null);
  const hasFetchedRef = useRef(false);
  const { directMessages, registerWave } = useMyStream();
  const {
    list,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    fetchNextPage,
  } = directMessages;

  useEffect(() => {
    hasFetchedRef.current = false;
  }, [hasNextPage, isFetchingNextPage]);

  const fetchNextPageIfNeeded = useEffectEvent(() => {
    if (!hasNextPage || isFetchingNextPage || hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    fetchNextPage();
  });

  useEffect(() => {
    const listHandle = listRef.current;
    const sentinel = listHandle?.sentinelRef.current;

    if (!sentinel || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        fetchNextPageIfNeeded();
      }
    }, {
      root: listHandle?.containerRef.current,
      rootMargin: "100px",
    });

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, list.length > 0]);

  const shouldShowPlaceholder = !isAuthenticated || !connectedProfile?.handle;
  const wavesWithPinned = useMemo(
    () => list.map((w) => ({ ...w, isPinned: false })),
    [list],
  );

  if (shouldShowPlaceholder) {
    if (!isAuthenticated) {
      return <ConnectWallet />;
    }

    const placeholderContent = (
      <>
        <h1 className="tw-text-xl tw-font-bold">
          You need to set up a profile to continue.
        </h1>
        <UserSetUpProfileCta />
      </>
    );

    return (
      <div
        id="my-stream-connect"
        className="tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-center tw-gap-8 tw-h-full tw-p-6 tailwind-scope"
      >
        <Image
          unoptimized
          priority
          loading="eager"
          src="https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP"
          alt="Brain"
          width={304}
          height={450}
          className="tw-rounded-md tw-shadow-lg tw-max-w-[30vw] md:tw-max-w-[200px] tw-h-auto"
        />
        <div className="tw-flex tw-flex-col tw-items-center md:tw-items-start tw-text-center md:tw-text-left tw-gap-4">
          {placeholderContent}
        </div>
      </div>
    );
  }

  return (
    <div className="tw-mb-4">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-4">
        {!isApp && (
          <div className="tw-px-4 tw-mb-4">
            <BrainLeftSidebarCreateADirectMessageButton />
          </div>
        )}

        <UnifiedWavesListWaves
          ref={listRef}
          waves={wavesWithPinned}
          onHover={registerWave}
          hideToggle
          hidePin
          hideHeaders
          scrollContainerRef={scrollContainerRef}
          isDirectMessage
        />

        <UnifiedWavesListLoader
          isFetching={isFetching && list.length === 0}
          isFetchingNextPage={isFetchingNextPage}
        />

        <UnifiedWavesListEmpty
          sortedWaves={list}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          emptyMessage="No messages to display"
        />
      </div>
    </div>
  );
};

export default DirectMessagesList;
