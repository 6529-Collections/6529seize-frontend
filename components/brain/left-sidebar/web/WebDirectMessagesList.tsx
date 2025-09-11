"use client";

import React, { useRef, useEffect, useContext } from "react";
import WebUnifiedWavesListWaves, {
  WebUnifiedWavesListWavesHandle,
} from "./WebUnifiedWavesListWaves";
import { UnifiedWavesListLoader } from "../waves/UnifiedWavesListLoader";
import UnifiedWavesListEmpty from "../waves/UnifiedWavesListEmpty";
import PrimaryButton from "../../../utils/button/PrimaryButton";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { CREATE_DIRECT_MESSAGE_SEARCH_PATH } from "../../../waves/Waves";
import Tooltip from "../../../common/Tooltip";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";
import { AuthContext } from "../../../auth/Auth";
import HeaderUserConnect from "../../../header/user/HeaderUserConnect";
import { useSeizeConnectContext } from "../../../auth/SeizeConnectContext";
import Image from "next/image";
import UserSetUpProfileCta from "../../../user/utils/set-up-profile/UserSetUpProfileCta";
import useDeviceInfo from "../../../../hooks/useDeviceInfo";

interface WebDirectMessagesListProps {
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const WebDirectMessagesList: React.FC<WebDirectMessagesListProps> = ({
  scrollContainerRef,
}) => {
  const { isAuthenticated } = useSeizeConnectContext();
  const { connectedProfile } = useContext(AuthContext);
  const { isApp } = useDeviceInfo();
  const router = useRouter();

  // Moved all hooks to the top level, before any conditional logic
  const listRef = useRef<WebUnifiedWavesListWavesHandle>(null);
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

    const observer = new IntersectionObserver(cb, {
      root: scrollContainerRef?.current,
      rootMargin: "100px",
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [
    directMessages.hasNextPage,
    directMessages.isFetchingNextPage,
    scrollContainerRef,
  ]);

  const haveDirectMessages = directMessages.list.length > 0;
  const isEmpty = !directMessages.isFetching && !haveDirectMessages;
  const isInitialLoad = directMessages.isFetching && !haveDirectMessages;

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-y-4 tw-h-full">
        <div className="tw-flex tw-flex-col tw-gap-y-4 tw-text-center tw-pt-8">
          <Image
            src="/android-chrome-256x256.png"
            alt="6529 Seize"
            width={64}
            height={64}
            className="tw-mx-auto"
          />
          <div className="tw-flex tw-flex-col tw-gap-y-2">
            <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
              Welcome to Seize
            </span>
            <span className="tw-text-sm tw-text-iron-400">
              Connect your wallet to access direct messages
            </span>
          </div>
        </div>
        <div className="tw-flex tw-justify-center">
          <HeaderUserConnect />
        </div>
      </div>
    );
  }

  // Authenticated but no profile
  if (!connectedProfile) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-y-4 tw-h-full">
        <div className="tw-flex tw-flex-col tw-gap-y-4 tw-text-center tw-pt-8">
          <Image
            src="/android-chrome-256x256.png"
            alt="6529 Seize"
            width={64}
            height={64}
            className="tw-mx-auto"
          />
          <div className="tw-flex tw-flex-col tw-gap-y-2">
            <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
              Set up your profile
            </span>
            <span className="tw-text-sm tw-text-iron-400">
              Create a profile to start messaging
            </span>
          </div>
        </div>
        <div className="tw-flex tw-justify-center tw-px-4">
          <UserSetUpProfileCta />
        </div>
      </div>
    );
  }

  return (
    <div className="tw-h-full tw-flex tw-flex-col">
      <div className="tw-flex-1 tw-bg-black tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-4 tw-flex tw-flex-col">
        {/* Messages header with create button */}
        <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-mb-4">
          <span className="tw-text-xl tw-font-semibold tw-text-iron-50">
            Messages
          </span>
          {!isApp && (
            <div 
              data-tooltip-id="create-dm-tooltip"
              data-tooltip-content="New direct message"
            >
              <PrimaryButton
                onClicked={() => router.push(CREATE_DIRECT_MESSAGE_SEARCH_PATH)}
                loading={false}
                disabled={false}
                padding="tw-px-2 tw-py-2"
              >
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  className="tw-size-4 tw-flex-shrink-0"
                />
              </PrimaryButton>
            </div>
          )}
        </div>

        <div className="tw-flex-1 tw-w-full tw-flex tw-flex-col">
          {isInitialLoad ? (
            <UnifiedWavesListLoader
              isFetching={true}
              isFetchingNextPage={false}
            />
          ) : isEmpty ? (
            <UnifiedWavesListEmpty
              sortedWaves={directMessages.list}
              isFetching={directMessages.isFetching}
              isFetchingNextPage={directMessages.isFetchingNextPage}
              emptyMessage="No direct messages yet"
            />
          ) : (
            <WebUnifiedWavesListWaves
              ref={listRef}
              waves={directMessages.list}
              onHover={registerWave}
              scrollContainerRef={scrollContainerRef}
              hideToggle={true}
              hideHeaders={true}
              hidePin={true}
              basePath="/messages"
            />
          )}

          <UnifiedWavesListLoader
            isFetching={false}
            isFetchingNextPage={directMessages.isFetchingNextPage}
          />
        </div>
      </div>
      
      {/* Tooltip */}
      <Tooltip id="create-dm-tooltip" />
    </div>
  );
};

export default WebDirectMessagesList;