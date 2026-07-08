"use client";

import { AuthContext } from "@/components/auth/Auth";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useCanShowDropCurationsAction } from "@/hooks/drops/useCanShowDropCurationsAction";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import type { FC, PointerEvent } from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import WaveDropActionsAddReaction from "./WaveDropActionsAddReaction";
import WaveDropCurationsActionIcon from "./WaveDropCurationsActionIcon";
import WaveDropCurationsDialog from "./WaveDropCurationsDialog";
import WaveDropActionsMarkUnread from "./WaveDropActionsMarkUnread";
import WaveDropActionsRate from "./WaveDropActionsRate";
import WaveDropMobileMenuBoost from "./WaveDropMobileMenuBoost";
import WaveDropMobileMenuDelete from "./WaveDropMobileMenuDelete";
import WaveDropMobileMenuEdit from "./WaveDropMobileMenuEdit";
import WaveDropMobileMenuSetPinnedDrop from "./WaveDropMobileMenuSetPinnedDrop";
import WaveDropMobileMenuOpen from "./WaveDropMobileMenuOpen";
import WaveDropActionsQuickReact from "./WaveDropActionsQuickReact";
import { useWaveDropLayers } from "./WaveDropLayerContext";
import WaveDropMobileMenuCopyLink from "./WaveDropMobileMenuCopyLink";
import WaveDropMobileMenuCopyText from "./WaveDropMobileMenuCopyText";

export interface WaveDropMobileMenuProps {
  readonly drop: ApiDrop;
  readonly isOpen: boolean;
  readonly showReplyAndQuote: boolean;
  readonly longPressTriggered: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly onReply: () => void;
  readonly onAddReaction: () => void;
  readonly onEdit?: (() => void) | undefined;
  readonly onBoostAnimation?: (() => void) | undefined;
  readonly showOpenOption?: boolean | undefined;
  readonly showCopyOption?: boolean | undefined;
  readonly showVoting?: boolean | undefined;
}

type TimeoutRef = {
  current: ReturnType<typeof setTimeout> | null;
};

const clearCurationsDialogTimeout = (timeoutRef: TimeoutRef) => {
  if (timeoutRef.current !== null) {
    globalThis.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
};

const openCurationsDialogAfterMenuClose = ({
  timeoutRef,
  closeMenu,
  setIsCurationsDialogOpen,
}: {
  readonly timeoutRef: TimeoutRef;
  readonly closeMenu: () => void;
  readonly setIsCurationsDialogOpen: (open: boolean) => void;
}) => {
  closeMenu();
  clearCurationsDialogTimeout(timeoutRef);
  timeoutRef.current = globalThis.setTimeout(() => {
    setIsCurationsDialogOpen(true);
    timeoutRef.current = null;
  }, 250);
};

function WaveDropMobileMenuAuthenticatedActions({
  extendedDrop,
  drop,
  showReplyAndQuote,
  isTemporaryDrop,
  onReply,
  onAddReaction,
  dialogZIndexClassName,
  onBoostAnimation,
  showOpenOption,
  showCopyOption,
  showCurationsAction,
  onCurationsClick,
  isAuthor,
  showOptions,
  onEdit,
  canSetPinnedDrop,
  canDelete,
  closeMenu,
  showVoting,
}: {
  readonly extendedDrop: ExtendedDrop;
  readonly drop: ApiDrop;
  readonly showReplyAndQuote: boolean;
  readonly isTemporaryDrop: boolean;
  readonly onReply: () => void;
  readonly onAddReaction: () => void;
  readonly dialogZIndexClassName?: string | undefined;
  readonly onBoostAnimation?: (() => void) | undefined;
  readonly showOpenOption: boolean;
  readonly showCopyOption: boolean;
  readonly showCurationsAction: boolean;
  readonly onCurationsClick: () => void;
  readonly isAuthor: boolean;
  readonly showOptions: boolean;
  readonly onEdit?: (() => void) | undefined;
  readonly canSetPinnedDrop: boolean;
  readonly canDelete: boolean;
  readonly closeMenu: () => void;
  readonly showVoting: boolean;
}) {
  const handledTouchReplyRef = useRef(false);

  const handleReplyPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") {
      return;
    }

    handledTouchReplyRef.current = true;
    onReply();
  };

  const handleReplyClick = () => {
    if (handledTouchReplyRef.current) {
      handledTouchReplyRef.current = false;
      return;
    }

    onReply();
  };

  return (
    <>
      <WaveDropActionsQuickReact
        drop={extendedDrop}
        isMobile
        onReacted={closeMenu}
      />
      <WaveDropActionsAddReaction
        drop={extendedDrop}
        isMobile={true}
        onAddReaction={onAddReaction}
        dialogZIndexClassName={dialogZIndexClassName}
      />
      {showReplyAndQuote && (
        <button
          className={`tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 ${
            isTemporaryDrop
              ? "tw-cursor-default tw-opacity-50"
              : "active:tw-bg-iron-800"
          } tw-transition-colors tw-duration-200`}
          onPointerDown={handleReplyPointerDown}
          onClick={handleReplyClick}
          disabled={isTemporaryDrop}
        >
          <svg
            className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.49 12L3.74 8.248m0 0l3.75-3.75m-3.75 3.75h16.5V19.5"
            />
          </svg>
          <span className="tw-text-base tw-font-semibold tw-text-iron-300">
            Reply
          </span>
        </button>
      )}

      <WaveDropMobileMenuBoost
        drop={extendedDrop}
        onBoostChange={closeMenu}
        onBoostAnimation={onBoostAnimation}
      />

      {showOpenOption && (
        <WaveDropMobileMenuOpen
          drop={{
            type: DropSize.FULL,
            ...drop,
            stableHash: drop.id,
            stableKey: drop.id,
          }}
          onOpenChange={closeMenu}
        />
      )}

      {showCopyOption && (
        <>
          <WaveDropMobileMenuCopyText drop={drop} onCopy={closeMenu} />
          <WaveDropMobileMenuCopyLink drop={drop} onCopy={closeMenu} />
        </>
      )}

      {showCurationsAction && (
        <button
          type="button"
          onClick={onCurationsClick}
          className="tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
        >
          <WaveDropCurationsActionIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300" />
          <span className="tw-text-base tw-font-semibold tw-text-iron-300">
            Curate
          </span>
        </button>
      )}

      <WaveDropActionsMarkUnread
        drop={drop}
        isMobile={true}
        onMarkUnread={closeMenu}
      />
      {showVoting && !isAuthor && (
        <WaveDropActionsRate drop={drop} isMobile={true} onRated={closeMenu} />
      )}
      {showOptions &&
        onEdit &&
        drop.drop_type !== ApiDropType.Participatory && (
          <WaveDropMobileMenuEdit
            drop={drop}
            onEdit={onEdit}
            onEditTriggered={closeMenu}
          />
        )}
      {canSetPinnedDrop && (
        <WaveDropMobileMenuSetPinnedDrop
          drop={drop}
          onPinnedDropSet={closeMenu}
        />
      )}
      {canDelete && (
        <WaveDropMobileMenuDelete drop={drop} onDropDeleted={closeMenu} />
      )}
    </>
  );
}

const WaveDropMobileMenu: FC<WaveDropMobileMenuProps> = ({
  drop,
  isOpen,
  showReplyAndQuote,
  longPressTriggered,
  setOpen,
  onReply,
  onAddReaction,
  onEdit,
  onBoostAnimation,
  showOpenOption = true,
  showCopyOption = true,
  showVoting = true,
}) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const isTemporaryDrop = drop.id.startsWith("temp-");
  const { canDelete, canSetPinnedDrop } = useDropInteractionRules(drop);
  const { mobileMenuZIndexClassName, mobileDialogZIndexClassName } =
    useWaveDropLayers();

  const extendedDrop = useMemo<ExtendedDrop>(
    () => ({
      ...drop,
      type: DropSize.FULL,
      stableKey: drop.id,
      stableHash: drop.id,
    }),
    [drop]
  );
  const [isCurationsDialogOpen, setIsCurationsDialogOpen] = useState(false);
  const curationsDialogTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    return () => {
      clearCurationsDialogTimeout(curationsDialogTimeoutRef);
    };
  }, []);

  const isAuthor = useMemo(
    () =>
      connectedProfile?.handle === drop.author.handle && !activeProfileProxy,
    [connectedProfile, activeProfileProxy, drop.author.handle]
  );
  const connectedProfileHandle = connectedProfile?.handle ?? null;

  const showOptions = useMemo(
    () =>
      connectedProfileHandle !== null &&
      !activeProfileProxy &&
      !drop.id.startsWith("temp-") &&
      connectedProfileHandle === drop.author.handle,
    [connectedProfileHandle, activeProfileProxy, drop.id, drop.author.handle]
  );

  const closeMenu = () => setOpen(false);
  const showGuestCopyOnly = connectedProfileHandle === null;
  const showCurationsAction = useCanShowDropCurationsAction({
    dropId: drop.id,
    isTemporaryDrop,
    isWaveAdmin: drop.wave.authenticated_user_admin === true,
    enabled:
      (isOpen || isCurationsDialogOpen) && connectedProfileHandle !== null,
  });

  const handleCurationsClick = () =>
    openCurationsDialogAfterMenuClose({
      timeoutRef: curationsDialogTimeoutRef,
      closeMenu,
      setIsCurationsDialogOpen,
    });

  return (
    <>
      {createPortal(
        <CommonDropdownItemsMobileWrapper
          isOpen={isOpen}
          setOpen={setOpen}
          zIndexClassName={mobileMenuZIndexClassName}
        >
          <div
            className={`tw-grid tw-grid-cols-1 ${
              longPressTriggered && "tw-select-none"
            }`}
          >
            {showGuestCopyOnly ? (
              showCopyOption && (
                <>
                  <WaveDropMobileMenuCopyText drop={drop} onCopy={closeMenu} />
                  <WaveDropMobileMenuCopyLink drop={drop} onCopy={closeMenu} />
                </>
              )
            ) : (
              <WaveDropMobileMenuAuthenticatedActions
                extendedDrop={extendedDrop}
                drop={drop}
                showReplyAndQuote={showReplyAndQuote}
                isTemporaryDrop={isTemporaryDrop}
                onReply={onReply}
                onAddReaction={onAddReaction}
                dialogZIndexClassName={mobileDialogZIndexClassName}
                onBoostAnimation={onBoostAnimation}
                showOpenOption={showOpenOption}
                showCopyOption={showCopyOption}
                showCurationsAction={showCurationsAction}
                onCurationsClick={handleCurationsClick}
                isAuthor={isAuthor}
                showOptions={showOptions}
                onEdit={onEdit}
                canSetPinnedDrop={canSetPinnedDrop}
                canDelete={canDelete}
                closeMenu={closeMenu}
                showVoting={showVoting}
              />
            )}
          </div>
        </CommonDropdownItemsMobileWrapper>,
        document.body
      )}
      {showCurationsAction && (
        <WaveDropCurationsDialog
          dropId={drop.id}
          wave={drop.wave}
          isOpen={isCurationsDialogOpen}
          onClose={() => setIsCurationsDialogOpen(false)}
        />
      )}
    </>
  );
};

export default WaveDropMobileMenu;
