import React, { useRef, useEffect, useContext } from "react";
import UnifiedWavesListWaves, {
  UnifiedWavesListWavesHandle,
} from "../left-sidebar/waves/UnifiedWavesListWaves";
import { UnifiedWavesListLoader } from "../left-sidebar/waves/UnifiedWavesListLoader";
import UnifiedWavesListEmpty from "../left-sidebar/waves/UnifiedWavesListEmpty";
import BrainLeftSidebarCreateADirectMessageButton from "../left-sidebar/BrainLeftSidebarCreateADirectMessageButton";
import { useMyStream } from "../../../contexts/wave/MyStreamContext";
import { AuthContext } from "../../auth/Auth";
import HeaderUserConnect from "../../header/user/HeaderUserConnect";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import Image from "next/image";
import UserSetUpProfileCta from "../../user/utils/set-up-profile/UserSetUpProfileCta";
import useDeviceInfo from "../../../hooks/useDeviceInfo";

interface DirectMessagesListProps {
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const DirectMessagesList: React.FC<DirectMessagesListProps> = ({
  scrollContainerRef,
}) => {
  const { isAuthenticated } = useSeizeConnectContext();
  const { connectedProfile } = useContext(AuthContext);
  const { isApp } = useDeviceInfo();
  
  // Moved all hooks to the top level, before any conditional logic
  const listRef = useRef<UnifiedWavesListWavesHandle>(null);
  const hasFetchedRef = useRef(false);
  const { directMessages, registerWave } = useMyStream();

  // Reset the fetch flag when dependencies change
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [directMessages.hasNextPage, directMessages.isFetchingNextPage]);

  useEffect(() => {
    const node = listRef.current?.sentinelRef.current;
    if (
      !node ||
      !directMessages.hasNextPage ||
      directMessages.isFetchingNextPage
    )
      return;

    const cb = (entries: IntersectionObserverEntry[]) => {
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

    const obs = new IntersectionObserver(cb, {
      root: listRef.current?.containerRef.current,
      rootMargin: "100px",
    });

    obs.observe(node);

    return () => obs.disconnect();
  }, [
    listRef.current?.sentinelRef.current,
    directMessages.hasNextPage,
    directMessages.isFetchingNextPage,
  ]);

  const shouldShowPlaceholder = !isAuthenticated || !connectedProfile?.handle;

  if (shouldShowPlaceholder) {
    const placeholderContent = !isAuthenticated ? (
      <>
        <h1 className="tw-text-xl tw-font-bold">
          This content is only available to connected wallets.
        </h1>
        <p className="tw-text-base tw-text-gray-400">
          Connect your wallet to continue.
        </p>
        <HeaderUserConnect />
      </>
    ) : (
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
          waves={directMessages.list.map((w) => ({ ...w, isPinned: false }))}
          onHover={registerWave}
          hideToggle
          hidePin
          hideHeaders
          scrollContainerRef={scrollContainerRef}
        />

        <UnifiedWavesListLoader
          isFetchingNextPage={directMessages.isFetchingNextPage}
        />

        <UnifiedWavesListEmpty
          sortedWaves={directMessages.list}
          isFetching={directMessages.isFetching}
          isFetchingNextPage={directMessages.isFetchingNextPage}
          emptyMessage="No messages to display"
        />
      </div>
    </div>
  );
};

export default DirectMessagesList;
