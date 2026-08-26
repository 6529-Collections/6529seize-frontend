"use client";

import { AuthContext } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import {
  type QuickCurationAction,
  useCanShowDropCurationsAction,
} from "@/hooks/drops/useCanShowDropCurationsAction";
import { useDropCurationMembershipMutation } from "@/hooks/drops/useDropCurationMembershipMutation";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { getProfileWaveIdentity } from "@/hooks/useProfileWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import useCapacitor from "@/hooks/useCapacitor";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { FC, PointerEvent, Ref } from "react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import ContentModerationDropActions from "@/components/content-moderation/ContentModerationDropActions";
import ReportDropModal from "@/components/content-moderation/ReportDropModal";
import WaveDropMobileMenuReactionPicker from "./WaveDropMobileMenuReactionPicker";

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
  readonly showOnlyQuickRemove?: boolean | undefined;
}

type TimeoutRef = {
  current: ReturnType<typeof setTimeout> | null;
};

type WaveDropMobileMenuView = "actions" | "reactions";

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
  onOpenReactionPicker,
  reactionButtonRef,
  onBoostAnimation,
  showOpenOption,
  showCopyOption,
  showManageCurations,
  quickAddCuration,
  quickRemoveCuration,
  onQuickAdd,
  onQuickRemove,
  onCurationsClick,
  isAuthor,
  showOptions,
  onEdit,
  canSetPinnedDrop,
  canDelete,
  closeMenu,
  showVoting,
  onReport,
  showOnlyQuickRemove,
}: {
  readonly extendedDrop: ExtendedDrop;
  readonly drop: ApiDrop;
  readonly showReplyAndQuote: boolean;
  readonly isTemporaryDrop: boolean;
  readonly onReply: () => void;
  readonly onOpenReactionPicker: () => void;
  readonly reactionButtonRef: Ref<HTMLButtonElement>;
  readonly onBoostAnimation?: (() => void) | undefined;
  readonly showOpenOption: boolean;
  readonly showCopyOption: boolean;
  readonly showManageCurations: boolean;
  readonly quickAddCuration: QuickCurationAction | null;
  readonly quickRemoveCuration: QuickCurationAction | null;
  readonly onQuickAdd: () => void;
  readonly onQuickRemove: () => void;
  readonly onCurationsClick: () => void;
  readonly isAuthor: boolean;
  readonly showOptions: boolean;
  readonly onEdit?: (() => void) | undefined;
  readonly canSetPinnedDrop: boolean;
  readonly canDelete: boolean;
  readonly closeMenu: () => void;
  readonly showVoting: boolean;
  readonly onReport: () => void;
  readonly showOnlyQuickRemove: boolean;
}) {
  const locale = useBrowserLocale();
  const handledTouchReplyRef = useRef(false);
  const handledTouchReplyResetTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const resetHandledTouchReply = useCallback(() => {
    handledTouchReplyRef.current = false;
    if (handledTouchReplyResetTimeoutRef.current !== null) {
      globalThis.clearTimeout(handledTouchReplyResetTimeoutRef.current);
      handledTouchReplyResetTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => resetHandledTouchReply, [resetHandledTouchReply]);

  const handleReplyPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") {
      return;
    }

    resetHandledTouchReply();
    handledTouchReplyRef.current = true;
    handledTouchReplyResetTimeoutRef.current = globalThis.setTimeout(() => {
      resetHandledTouchReply();
    }, 750);
    closeMenu();
    onReply();
  };

  const handleReplyClick = () => {
    if (handledTouchReplyRef.current) {
      resetHandledTouchReply();
      closeMenu();
      return;
    }

    closeMenu();
    onReply();
  };

  if (showOnlyQuickRemove) {
    return quickRemoveCuration ? (
      <button
        type="button"
        onClick={onQuickRemove}
        className="tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 active:tw-bg-rose-500/10"
      >
        <XMarkIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-rose-400" />
        <span className="tw-min-w-0 tw-break-words tw-text-base tw-font-semibold tw-text-rose-400">
          {t(locale, "profileCuration.actions.removeConfirm")}
        </span>
      </button>
    ) : null;
  }

  return (
    <>
      <WaveDropActionsQuickReact
        drop={extendedDrop}
        isMobile
        onReactionStarted={closeMenu}
      />
      <WaveDropActionsAddReaction
        drop={extendedDrop}
        isMobile={true}
        onMobilePickerOpen={onOpenReactionPicker}
        mobileButtonRef={reactionButtonRef}
      />
      {showReplyAndQuote && (
        <button
          className={`tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 ${
            isTemporaryDrop
              ? "tw-cursor-default tw-opacity-50"
              : "active:tw-bg-iron-800"
          } tw-transition-colors tw-duration-200`}
          onPointerDown={handleReplyPointerDown}
          onPointerCancel={resetHandledTouchReply}
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

      {quickAddCuration && (
        <button
          type="button"
          onClick={onQuickAdd}
          className="tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
        >
          <PlusIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300" />
          <span className="tw-min-w-0 tw-break-words tw-text-base tw-font-semibold tw-text-iron-300">
            {t(locale, "profileCuration.actions.quickAdd", {
              curationName: quickAddCuration.name,
            })}
          </span>
        </button>
      )}

      {showManageCurations && (
        <button
          type="button"
          onClick={onCurationsClick}
          className="tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
        >
          <WaveDropCurationsActionIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300" />
          <span className="tw-text-base tw-font-semibold tw-text-iron-300">
            {t(locale, "profileCuration.actions.manage")}
          </span>
        </button>
      )}

      {quickRemoveCuration && (
        <button
          type="button"
          onClick={onQuickRemove}
          className="tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 active:tw-bg-rose-500/10"
        >
          <XMarkIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-rose-400" />
          <span className="tw-min-w-0 tw-break-words tw-text-base tw-font-semibold tw-text-rose-400">
            {t(locale, "profileCuration.actions.quickRemove", {
              curationName: quickRemoveCuration.name,
            })}
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
      <ContentModerationDropActions drop={drop} mobile onReport={onReport} />
    </>
  );
}

const WaveDropMobileMenuContent: FC<WaveDropMobileMenuProps> = ({
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
  showOnlyQuickRemove = false,
}) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const locale = useBrowserLocale();
  const { isCapacitor } = useCapacitor();
  const isTemporaryDrop = drop.id.startsWith("temp-");
  const { canDelete, canSetPinnedDrop } = useDropInteractionRules(drop);
  const { mobileMenuZIndexClassName } = useWaveDropLayers();

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
  const [activeView, setActiveView] =
    useState<WaveDropMobileMenuView>("actions");
  const reactionButtonRef = useRef<HTMLButtonElement>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
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
  const resetMenuView = () => setActiveView("actions");
  const backToActions = () => {
    setActiveView("actions");
    globalThis.requestAnimationFrame(() => reactionButtonRef.current?.focus());
  };
  const showGuestCopyOnly = connectedProfileHandle === null;
  const { showManageCurations, quickAddCuration, quickRemoveCuration } =
    useCanShowDropCurationsAction({
      dropId: drop.id,
      waveId: drop.wave.id,
      profileIdentity: getProfileWaveIdentity(connectedProfile),
      isTemporaryDrop,
      isWaveAdmin: drop.wave.authenticated_user_admin === true,
      enabled:
        (isOpen || isCurationsDialogOpen) && connectedProfileHandle !== null,
    });
  const { updateMembershipAsync } = useDropCurationMembershipMutation({
    dropId: drop.id,
    waveId: drop.wave.id,
  });

  const handleQuickAdd = async () => {
    if (!quickAddCuration) {
      return;
    }

    closeMenu();
    try {
      await updateMembershipAsync(quickAddCuration.id, "add", {
        successMessage: t(locale, "profileCuration.membership.addedTo", {
          curationName: quickAddCuration.name,
        }),
      });
    } catch {
      // The mutation owns the user-facing error toast.
    }
  };

  const handleQuickRemove = async () => {
    if (!quickRemoveCuration) {
      return;
    }

    closeMenu();
    try {
      await updateMembershipAsync(quickRemoveCuration.id, "remove", {
        successMessage: t(locale, "profileCuration.membership.removedFrom", {
          curationName: quickRemoveCuration.name,
        }),
      });
    } catch {
      // The mutation owns the user-facing error toast.
    }
  };

  const handleCurationsClick = () =>
    openCurationsDialogAfterMenuClose({
      timeoutRef: curationsDialogTimeoutRef,
      closeMenu,
      setIsCurationsDialogOpen,
    });
  const dialogLabel = t(
    locale,
    activeView === "reactions"
      ? "waves.drop.actions.reactionPickerLabel"
      : "waves.drop.actions.menuLabel"
  );

  return (
    <>
      <MobileWrapperDialog
        ariaLabel={dialogLabel}
        isOpen={isOpen}
        onClose={closeMenu}
        onBack={activeView === "reactions" ? backToActions : undefined}
        onAfterLeave={resetMenuView}
        zIndexClassName={mobileMenuZIndexClassName}
        showHeaderDivider={activeView === "reactions"}
        showScrollbar={activeView === "actions"}
        enableDragToClose
        hideOnDesktopHover={!isCapacitor}
      >
        {activeView === "actions" ? (
          <div className="tw-px-4 sm:tw-px-6">
            <div
              className={`tw-grid tw-grid-cols-1 tw-gap-y-1 [&>button>span]:tw-text-base [&>button>span]:tw-font-medium [&>button]:tw-min-h-12 [&>button]:tw-gap-x-3 [&>button]:tw-rounded-lg [&>button]:tw-px-3.5 [&>button]:tw-py-2.5 ${
                longPressTriggered && "tw-select-none"
              }`}
            >
              {showGuestCopyOnly ? (
                showCopyOption && (
                  <>
                    <WaveDropMobileMenuCopyText
                      drop={drop}
                      onCopy={closeMenu}
                    />
                    <WaveDropMobileMenuCopyLink
                      drop={drop}
                      onCopy={closeMenu}
                    />
                  </>
                )
              ) : (
                <WaveDropMobileMenuAuthenticatedActions
                  extendedDrop={extendedDrop}
                  drop={drop}
                  showReplyAndQuote={showReplyAndQuote}
                  isTemporaryDrop={isTemporaryDrop}
                  onReply={onReply}
                  onOpenReactionPicker={() => setActiveView("reactions")}
                  reactionButtonRef={reactionButtonRef}
                  onBoostAnimation={onBoostAnimation}
                  showOpenOption={showOpenOption}
                  showCopyOption={showCopyOption}
                  showManageCurations={showManageCurations}
                  quickAddCuration={quickAddCuration}
                  quickRemoveCuration={quickRemoveCuration}
                  onQuickAdd={() => void handleQuickAdd()}
                  onQuickRemove={() => void handleQuickRemove()}
                  onCurationsClick={handleCurationsClick}
                  isAuthor={isAuthor}
                  showOptions={showOptions}
                  onEdit={onEdit}
                  canSetPinnedDrop={canSetPinnedDrop}
                  canDelete={canDelete}
                  closeMenu={closeMenu}
                  showVoting={showVoting}
                  onReport={() => {
                    closeMenu();
                    setIsReportOpen(true);
                  }}
                  showOnlyQuickRemove={showOnlyQuickRemove}
                />
              )}
            </div>
          </div>
        ) : (
          <WaveDropMobileMenuReactionPicker
            drop={extendedDrop}
            onDismiss={closeMenu}
            onReactionSuccess={onAddReaction}
          />
        )}
      </MobileWrapperDialog>
      {showManageCurations && (
        <WaveDropCurationsDialog
          dropId={drop.id}
          wave={drop.wave}
          isOpen={isCurationsDialogOpen}
          onClose={() => setIsCurationsDialogOpen(false)}
        />
      )}
      <ReportDropModal
        drop={drop}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
};

const WaveDropMobileMenu: FC<WaveDropMobileMenuProps> = (props) => (
  <WaveDropMobileMenuContent key={props.drop.id} {...props} />
);

export default WaveDropMobileMenu;
