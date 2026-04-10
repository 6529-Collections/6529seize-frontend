"use client";

import { AuthContext } from "@/components/auth/Auth";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { getCopiedDropLink } from "@/helpers/waves/drop-copy-link.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import type { FC } from "react";
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

interface WaveDropMobileMenuProps {
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

const getIsDirectMessage = (drop: ApiDrop): boolean => {
  const waveDetails = drop.wave as unknown as {
    chat?:
      | {
          scope?:
            | {
                group?: { is_direct_message?: boolean | undefined } | undefined;
              }
            | undefined;
        }
      | undefined;
  };

  return waveDetails.chat?.scope?.group?.is_direct_message ?? false;
};

const copyDropLinkToClipboard = ({
  drop,
  isMemesWave,
  isTemporaryDrop,
  closeMenu,
  setCopied,
}: {
  readonly drop: ApiDrop;
  readonly isMemesWave: (waveId: string | null | undefined) => boolean;
  readonly isTemporaryDrop: boolean;
  readonly closeMenu: () => void;
  readonly setCopied: (copied: boolean) => void;
}) => {
  if (isTemporaryDrop) {
    return;
  }

  const dropLink = getCopiedDropLink({
    drop,
    isDirectMessage: getIsDirectMessage(drop),
    isMemesWave,
  });

  if (typeof navigator.clipboard.writeText !== "function") {
    closeMenu();
    return;
  }

  navigator.clipboard
    .writeText(dropLink)
    .then(() => {
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    })
    .catch(() => undefined);
  closeMenu();
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

function WaveDropMobileCopyButton({
  copied,
  isTemporaryDrop,
  onClick,
}: {
  readonly copied: boolean;
  readonly isTemporaryDrop: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      className={`tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 ${
        isTemporaryDrop
          ? "tw-cursor-default tw-opacity-50"
          : "active:tw-bg-iron-800"
      } tw-transition-colors tw-duration-200`}
      onClick={onClick}
      disabled={isTemporaryDrop}
    >
      <svg
        className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
        />
      </svg>
      <span
        className={`tw-text-base tw-font-semibold ${
          copied ? "tw-text-primary-400" : "tw-text-iron-300"
        }`}
      >
        {copied ? "Copied!" : "Copy link"}
      </span>
    </button>
  );
}

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
  copied,
  onCopyToClipboard,
  onCurationsClick,
  isAuthor,
  showOptions,
  onEdit,
  canSetPinnedDrop,
  canDelete,
  closeMenu,
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
  readonly copied: boolean;
  readonly onCopyToClipboard: () => void;
  readonly onCurationsClick: () => void;
  readonly isAuthor: boolean;
  readonly showOptions: boolean;
  readonly onEdit?: (() => void) | undefined;
  readonly canSetPinnedDrop: boolean;
  readonly canDelete: boolean;
  readonly closeMenu: () => void;
}) {
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
          onClick={() => {
            closeMenu();
            globalThis.setTimeout(() => onReply(), 250);
          }}
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
        <WaveDropMobileCopyButton
          copied={copied}
          isTemporaryDrop={isTemporaryDrop}
          onClick={onCopyToClipboard}
        />
      )}

      {!isTemporaryDrop && (
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
      {!isAuthor && (
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
}) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { isMemesWave } = useSeizeSettings();
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

  const [copied, setCopied] = useState(false);
  const [isCurationsDialogOpen, setIsCurationsDialogOpen] = useState(false);
  const curationsDialogTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    return () => {
      clearCurationsDialogTimeout(curationsDialogTimeoutRef);
    };
  }, []);

  const copyToClipboard = () =>
    copyDropLinkToClipboard({
      drop,
      isMemesWave,
      isTemporaryDrop,
      closeMenu,
      setCopied,
    });

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
                <WaveDropMobileCopyButton
                  copied={copied}
                  isTemporaryDrop={isTemporaryDrop}
                  onClick={copyToClipboard}
                />
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
                copied={copied}
                onCopyToClipboard={copyToClipboard}
                onCurationsClick={handleCurationsClick}
                isAuthor={isAuthor}
                showOptions={showOptions}
                onEdit={onEdit}
                canSetPinnedDrop={canSetPinnedDrop}
                canDelete={canDelete}
                closeMenu={closeMenu}
              />
            )}
          </div>
        </CommonDropdownItemsMobileWrapper>,
        document.body
      )}
      {!isTemporaryDrop && (
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
