"use client";

import React, { useRef, useContext, type ReactNode } from "react";
import WebUnifiedWavesListWaves, {
  WebUnifiedWavesListWavesHandle,
} from "./WebUnifiedWavesListWaves";
import { UnifiedWavesListLoader } from "../waves/UnifiedWavesListLoader";
import UnifiedWavesListEmpty from "../waves/UnifiedWavesListEmpty";
import PrimaryButton from "../../../utils/button/PrimaryButton";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";
import { AuthContext } from "../../../auth/Auth";
import HeaderUserConnect from "../../../header/user/HeaderUserConnect";
import { useSeizeConnectContext } from "../../../auth/SeizeConnectContext";
import Image from "next/image";
import UserSetUpProfileCta from "../../../user/utils/set-up-profile/UserSetUpProfileCta";
import { useInfiniteScroll } from "../../../../hooks/useInfiniteScroll";
import CreateDirectMessageModal from "../../../waves/create-dm/CreateDirectMessageModal";
import useCreateModalState from "@/hooks/useCreateModalState";

interface WebDirectMessagesListProps {
  readonly scrollContainerRef: React.RefObject<HTMLElement | null>;
  readonly isCollapsed?: boolean;
}

const WebDirectMessagesList: React.FC<WebDirectMessagesListProps> = ({
  scrollContainerRef,
  isCollapsed = false,
}) => {
  const { isAuthenticated } = useSeizeConnectContext();
  const { connectedProfile } = useContext(AuthContext);
  const { isDirectMessageModalOpen, openDirectMessage, close, isApp } =
    useCreateModalState();

  const globalScope = globalThis as typeof globalThis & {
    window?: Window;
    navigator?: Navigator;
  };
  const browserWindow = globalScope.window;
  const browserNavigator = globalScope.navigator;

  const isTouchDevice =
    !!browserWindow &&
    ("ontouchstart" in browserWindow ||
      (browserNavigator?.maxTouchPoints ?? 0) > 0 ||
      browserWindow.matchMedia?.("(pointer: coarse)")?.matches);

  const shouldRenderCreateDirectMessage = !isApp;

  const listRef = useRef<WebUnifiedWavesListWavesHandle>(null);
  const { directMessages, registerWave } = useMyStream();

  useInfiniteScroll(
    directMessages.hasNextPage,
    directMessages.isFetchingNextPage,
    directMessages.fetchNextPage,
    scrollContainerRef,
    listRef.current?.sentinelRef || { current: null },
    "100px"
  );

  const haveDirectMessages = directMessages.list.length > 0;
  const isEmpty = !directMessages.isFetching && !haveDirectMessages;
  const isInitialLoad = directMessages.isFetching && !haveDirectMessages;

  let listContent: ReactNode;
  if (isInitialLoad) {
    listContent = (
      <UnifiedWavesListLoader
        isFetching={true}
        isFetchingNextPage={false}
      />
    );
  } else if (isEmpty) {
    listContent = (
      <UnifiedWavesListEmpty
        sortedWaves={directMessages.list}
        isFetching={directMessages.isFetching}
        isFetchingNextPage={directMessages.isFetchingNextPage}
        emptyMessage="No direct messages yet"
      />
    );
  } else {
    listContent = (
      <WebUnifiedWavesListWaves
        ref={listRef}
        waves={directMessages.list}
        onHover={registerWave}
        scrollContainerRef={scrollContainerRef}
        hideToggle={true}
        hideHeaders={true}
        hidePin={true}
        basePath="/messages"
        isCollapsed={isCollapsed}
      />
    );
  }

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
      <div
        className="tw-flex-1 tw-flex tw-flex-col tw-py-4 tw-bg-black"
      >
        {(shouldRenderCreateDirectMessage || !isCollapsed) && (
          <div
            className={`tw-flex tw-mb-3 ${
              isCollapsed
                ? "tw-justify-center tw-px-2"
                : "tw-items-center tw-justify-between tw-px-4"
            }`}
          >
            {!isCollapsed && (
              <span className="tw-text-xl tw-font-semibold tw-text-iron-50">
                Messages
              </span>
            )}
            {shouldRenderCreateDirectMessage && (
              <div
                data-tooltip-id="create-dm-tooltip"
                data-tooltip-content="New direct message"
              >
                <PrimaryButton
                  onClicked={openDirectMessage}
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
        )}

        <div className="tw-flex-1 tw-w-full tw-flex tw-flex-col">
          {listContent}

          <UnifiedWavesListLoader
            isFetching={false}
            isFetchingNextPage={directMessages.isFetchingNextPage}
          />
        </div>
      </div>

      {!isTouchDevice && shouldRenderCreateDirectMessage && (
        <ReactTooltip
          id="create-dm-tooltip"
          place="bottom"
          offset={8}
          opacity={1}
          style={{
            padding: "6px 10px",
            background: "#37373E",
            color: "white",
            fontSize: "12px",
            fontWeight: 500,
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: 10000,
          }}
          border="1px solid #4C4C55"
        />
      )}

      {connectedProfile && (
        <CreateDirectMessageModal
          isOpen={isDirectMessageModalOpen}
          onClose={close}
          profile={connectedProfile}
        />
      )}
    </div>
  );
};

export default WebDirectMessagesList;
