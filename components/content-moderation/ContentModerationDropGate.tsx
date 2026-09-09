"use client";

import { useAuth } from "@/components/auth/Auth";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useContentModerationVisibility } from "@/hooks/content-moderation/useContentModerationVisibility";
import { useContentModerationReportStatus } from "@/hooks/content-moderation/useContentModerationReportStatus";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  unblockProfile,
  unhideDrop,
} from "@/services/api/content-moderation-api";
import {
  getDropHiddenOverride,
  getProfileBlockedOverride,
  setDropHiddenOverride,
  setProfileBlockedOverride,
} from "@/services/content-moderation/content-moderation-state";
import {
  BLOCKED_PROFILES_QUERY_KEY,
  invalidateContentModerationPresentation,
  reconcileIdentityFollowingAfterBlockChange,
} from "@/services/content-moderation/content-moderation-query";
import {
  ShieldExclamationIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import WavePicture from "@/components/waves/WavePicture";
import { getTimeAgoShort } from "@/helpers/Helpers";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ContentModerationDropGateContext } from "./ContentModerationDropGateContext";
import ContentModerationReportStatusButton from "./ContentModerationReportStatusButton";
import ReportDropModal from "./ReportDropModal";
import ContentModerationAuthorNotice from "./ContentModerationAuthorNotice";

interface ContentModerationDropGateProps {
  readonly drop: ApiDrop;
  readonly children: ReactNode;
  readonly compact?: boolean | undefined;
  readonly presentation?: "default" | "profile-activity" | undefined;
  readonly preserveGlobalContext?: boolean | undefined;
  readonly onGlobalTombstoneClick?: (() => void) | undefined;
}

const AUTHENTICATION_CANCELLED_MESSAGE = "Authentication was cancelled";
const SELF_VISIBLE_TOMBSTONE_KIND = "author-global";

const getEffectiveVisibility = ({
  isRevealed,
  optimisticHiddenState,
  visibility,
}: {
  readonly isRevealed: boolean;
  readonly optimisticHiddenState: boolean | undefined;
  readonly visibility: ReturnType<
    typeof useContentModerationVisibility
  >["visibility"];
}) => {
  if (
    visibility.kind === "global" ||
    visibility.kind === SELF_VISIBLE_TOMBSTONE_KIND
  ) {
    return visibility;
  }
  if (isRevealed) {
    return { kind: "visible" } as const;
  }
  if (visibility.kind === "blocked") {
    return visibility;
  }
  if (optimisticHiddenState === true) {
    return { kind: "hidden" } as const;
  }
  if (optimisticHiddenState === false && visibility.kind === "hidden") {
    return { kind: "visible" } as const;
  }
  return visibility;
};

const getGlobalModerationStatus = (
  visibility: ReturnType<typeof getEffectiveVisibility>
): ApiDropModerationStatus | null =>
  visibility.kind === "global" ||
  visibility.kind === SELF_VISIBLE_TOMBSTONE_KIND
    ? visibility.status
    : null;

function PersonalModerationAction({
  label,
  tooltip,
  disabled = false,
  onClick,
}: {
  readonly label: string;
  readonly tooltip: string;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={tooltip}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="tw-cursor-pointer tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-iron-200 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50 desktop-hover:hover:tw-text-white"
    >
      {label}
    </button>
  );
}

function PersonalModerationOverlay({
  children,
  compact,
  testId,
  controls,
}: {
  readonly children: ReactNode;
  readonly compact: boolean;
  readonly testId: string;
  readonly controls: ReactNode;
}) {
  return (
    <div
      className={`tw-relative tw-w-full tw-overflow-hidden ${
        compact ? "tw-max-h-20 tw-rounded-xl" : "tw-my-1"
      }`}
      data-testid={testId}
    >
      <div
        aria-hidden="true"
        inert
        className="tw-pointer-events-none tw-select-none tw-opacity-35 tw-blur-[6px]"
        data-testid="content-moderation-hidden-content"
      >
        {children}
      </div>
      <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-p-2">
        <div
          className={`tw-inline-flex tw-max-w-[calc(100%_-_1rem)] tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/70 tw-text-xs tw-text-iron-400 tw-shadow-sm tw-backdrop-blur-sm ${
            compact ? "tw-px-2 tw-py-0.5" : "tw-px-2.5 tw-py-1"
          }`}
        >
          {controls}
        </div>
      </div>
    </div>
  );
}

function BlockedProfileActivityPresentation({
  children,
  drop,
  isRevealed,
  onHideAgain,
  onReveal,
}: {
  readonly children: ReactNode;
  readonly drop: ContentModerationDropGateProps["drop"];
  readonly isRevealed: boolean;
  readonly onHideAgain: () => void;
  readonly onReveal: () => void;
}) {
  const locale = useBrowserLocale();

  return (
    <div
      className="tw-w-full tw-overflow-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-bg-iron-950/45"
      data-testid="content-moderation-profile-activity-blocked"
    >
      <div className="tw-flex tw-min-h-16 tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-3 tw-py-3 sm:tw-px-4">
        <span className="tw-size-9 tw-flex-none tw-overflow-hidden tw-rounded-full tw-opacity-80 tw-grayscale">
          <WavePicture
            name={drop.wave.name}
            picture={drop.wave.picture}
            contributors={[]}
          />
        </span>
        <span className="tw-min-w-0 tw-flex-1">
          <span className="tw-block tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
            {drop.wave.name}
          </span>
          <span className="tw-block tw-text-xs tw-text-iron-500">
            {getTimeAgoShort(drop.created_at)}
          </span>
        </span>
        <span className="tw-inline-flex tw-flex-none tw-items-center tw-gap-1.5 tw-text-xs tw-text-iron-400">
          <span>{t(locale, "contentModeration.tombstone.blockedShort")}</span>
          <span aria-hidden="true">·</span>
          <PersonalModerationAction
            label={t(
              locale,
              isRevealed
                ? "contentModeration.actions.hideAgain"
                : "contentModeration.actions.reveal"
            )}
            tooltip={t(
              locale,
              isRevealed
                ? "contentModeration.tooltips.hideAgain"
                : "contentModeration.tooltips.revealBlocked"
            )}
            onClick={isRevealed ? onHideAgain : onReveal}
          />
        </span>
      </div>
      {isRevealed ? (
        <div data-testid="content-moderation-revealed-content">{children}</div>
      ) : (
        <div
          aria-hidden="true"
          inert
          className="tw-pointer-events-none tw-select-none tw-opacity-35 tw-blur-[6px]"
          data-testid="content-moderation-hidden-content"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function useRevealedPersonalModeration({
  hideAgain,
  isRevealed,
  locale,
  optimisticHiddenState,
  profileLabel,
  unblock,
  unblockPending,
  unhide,
  unhidePending,
  visibilityKind,
}: {
  readonly hideAgain: () => void;
  readonly isRevealed: boolean;
  readonly locale: ReturnType<typeof useBrowserLocale>;
  readonly optimisticHiddenState: boolean | undefined;
  readonly profileLabel: string;
  readonly unblock: () => void;
  readonly unblockPending: boolean;
  readonly unhide: () => void;
  readonly unhidePending: boolean;
  readonly visibilityKind: ReturnType<
    typeof useContentModerationVisibility
  >["visibility"]["kind"];
}) {
  return useMemo(() => {
    if (!isRevealed) return null;

    if (visibilityKind === "blocked") {
      return {
        hideAgain,
        persist: unblock,
        persistLabel: t(locale, "contentModeration.actions.unblock"),
        persistTooltip: t(locale, "contentModeration.tooltips.unblock", {
          profile: profileLabel,
        }),
        persistPending: unblockPending,
      };
    }

    if (visibilityKind === "hidden" || optimisticHiddenState === true) {
      return {
        hideAgain,
        persist: unhide,
        persistLabel: t(locale, "contentModeration.actions.unhide"),
        persistTooltip: t(locale, "contentModeration.tooltips.unhide"),
        persistPending: unhidePending,
      };
    }

    return null;
  }, [
    hideAgain,
    isRevealed,
    locale,
    optimisticHiddenState,
    profileLabel,
    unblock,
    unblockPending,
    unhide,
    unhidePending,
    visibilityKind,
  ]);
}

function AuthorModeratedPresentation({
  children,
  compact,
  preserveGlobalContext,
  status,
}: {
  readonly children: ReactNode;
  readonly compact: boolean;
  readonly preserveGlobalContext: boolean;
  readonly status: ApiDropModerationStatus;
}) {
  if (preserveGlobalContext) return children;
  return (
    <div className="tw-space-y-2">
      <ContentModerationAuthorNotice status={status} compact={compact} />
      {children}
    </div>
  );
}

function GlobalModerationTombstone({
  compact,
  kind,
  message,
  onClick,
  viewOriginalLabel,
}: {
  readonly compact: boolean;
  readonly kind: "global";
  readonly message: string;
  readonly onClick?: (() => void) | undefined;
  readonly viewOriginalLabel: string;
}) {
  const className = `tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/80 tw-text-left ${
    compact ? "tw-px-3 tw-py-2" : "tw-my-1 tw-px-4 tw-py-4"
  }`;
  const contents = (
    <>
      <ShieldExclamationIcon
        aria-hidden="true"
        className={`${compact ? "tw-size-4" : "tw-size-5"} tw-flex-shrink-0 tw-text-iron-500`}
      />
      {/* A feed may mount many tombstones at once. Keep this static copy out of
          live regions so screen readers are not flooded with announcements. */}
      <p className="tw-m-0 tw-min-w-0 tw-flex-1 tw-text-sm tw-text-iron-400">
        {message}
      </p>
    </>
  );
  const testId = `content-moderation-tombstone-${kind}`;

  if (!onClick) {
    return (
      <div className={className} data-testid={testId}>
        {contents}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={`${message}. ${viewOriginalLabel}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`${className} tw-cursor-pointer tw-transition-colors hover:tw-border-iron-700 hover:tw-bg-iron-900 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400`}
      data-testid={testId}
    >
      {contents}
    </button>
  );
}

export default function ContentModerationDropGate({
  drop,
  children,
  compact = false,
  presentation = "default",
  preserveGlobalContext = false,
  onGlobalTombstoneClick,
}: ContentModerationDropGateProps) {
  const locale = useBrowserLocale();
  const { connectedProfile, requestAuth, setToast } = useAuth();
  const queryClient = useQueryClient();
  const { visibility, reveal, hideAgain, isRevealed } =
    useContentModerationVisibility(drop);
  const reportStatus = useContentModerationReportStatus(drop);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [optimisticHiddenState, setOptimisticHiddenState] = useState<
    boolean | undefined
  >(undefined);
  const optimisticHiddenRef = useRef<boolean | undefined>(undefined);
  const scopedViewerProfileIdRef = useRef<string | null>(
    connectedProfile?.id ?? null
  );
  useEffect(() => {
    const nextViewerProfileId = connectedProfile?.id ?? null;
    const previousViewerProfileId = scopedViewerProfileIdRef.current;
    scopedViewerProfileIdRef.current = nextViewerProfileId;
    if (
      previousViewerProfileId !== null &&
      previousViewerProfileId !== nextViewerProfileId
    ) {
      optimisticHiddenRef.current = undefined;
      setOptimisticHiddenState(undefined);
    }
  }, [connectedProfile?.id]);
  const setOptimisticHidden = useCallback((hidden: boolean) => {
    const previous = optimisticHiddenRef.current;
    optimisticHiddenRef.current = hidden;
    setOptimisticHiddenState(hidden);
    return () => {
      optimisticHiddenRef.current = previous;
      setOptimisticHiddenState(previous);
    };
  }, []);
  const effectiveVisibility = getEffectiveVisibility({
    isRevealed,
    optimisticHiddenState,
    visibility,
  });
  const globalModerationStatus = getGlobalModerationStatus(effectiveVisibility);
  const openReportDetails = useCallback(() => setIsReportModalOpen(true), []);
  const unhideMutation = useMutation({
    mutationFn: async () => {
      const { success } = await requestAuth();
      if (!success) throw new Error(AUTHENTICATION_CANCELLED_MESSAGE);
      await unhideDrop(drop.id);
    },
    onMutate: () => {
      const rollbackLocalHidden = setOptimisticHidden(false);
      const viewerProfileId = connectedProfile?.id;
      const previousHidden = viewerProfileId
        ? getDropHiddenOverride(viewerProfileId, drop.id)
        : undefined;
      if (viewerProfileId) {
        setDropHiddenOverride(viewerProfileId, drop.id, false);
      }
      return { previousHidden, rollbackLocalHidden, viewerProfileId };
    },
    onSuccess: () => {
      void invalidateContentModerationPresentation(queryClient);
    },
    onError: (error, _variables, context) => {
      context?.rollbackLocalHidden();
      if (context?.viewerProfileId) {
        setDropHiddenOverride(
          context.viewerProfileId,
          drop.id,
          context.previousHidden
        );
      }
      if (
        error instanceof Error &&
        error.message === AUTHENTICATION_CANCELLED_MESSAGE
      ) {
        return;
      }
      setToast({
        type: "error",
        title: t(locale, "contentModeration.unhide.error"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
  });
  const unblockMutation = useMutation({
    mutationFn: async () => {
      const { success } = await requestAuth();
      if (!success) throw new Error(AUTHENTICATION_CANCELLED_MESSAGE);
      await unblockProfile(drop.author.id);
    },
    onMutate: () => {
      const viewerProfileId = connectedProfile?.id;
      const previousBlocked = viewerProfileId
        ? getProfileBlockedOverride(viewerProfileId, drop.author.id)
        : undefined;
      if (viewerProfileId) {
        setProfileBlockedOverride(viewerProfileId, drop.author.id, false);
      }
      return { previousBlocked, viewerProfileId };
    },
    onSuccess: () => {
      void reconcileIdentityFollowingAfterBlockChange(
        queryClient,
        drop.author.handle
      );
      void queryClient.invalidateQueries({
        queryKey: BLOCKED_PROFILES_QUERY_KEY,
      });
      void invalidateContentModerationPresentation(queryClient);
    },
    onError: (error, _variables, context) => {
      if (context?.viewerProfileId) {
        setProfileBlockedOverride(
          context.viewerProfileId,
          drop.author.id,
          context.previousBlocked
        );
      }
      if (
        error instanceof Error &&
        error.message === AUTHENTICATION_CANCELLED_MESSAGE
      ) {
        return;
      }
      setToast({
        type: "error",
        title: t(locale, "contentModeration.unblock.error"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
  });
  const profileLabel = drop.author.handle
    ? `@${drop.author.handle}`
    : "Blocked author";
  const revealedPersonalModeration = useRevealedPersonalModeration({
    hideAgain,
    isRevealed,
    locale,
    optimisticHiddenState,
    profileLabel,
    unblock: unblockMutation.mutate,
    unblockPending: unblockMutation.isPending,
    unhide: unhideMutation.mutate,
    unhidePending: unhideMutation.isPending,
    visibilityKind: visibility.kind,
  });
  const gateContext = useMemo(
    () => ({
      canViewGlobalModeratedContent:
        effectiveVisibility.kind === SELF_VISIBLE_TOMBSTONE_KIND,
      globalModerationStatus,
      openReportDetails,
      reportStatus,
      revealedPersonalModeration,
      setOptimisticHidden,
    }),
    [
      effectiveVisibility.kind,
      globalModerationStatus,
      openReportDetails,
      reportStatus,
      revealedPersonalModeration,
      setOptimisticHidden,
    ]
  );
  const withGateContext = (content: ReactNode) => (
    <ContentModerationDropGateContext.Provider value={gateContext}>
      {content}
      {isReportModalOpen && (
        <ReportDropModal
          drop={drop}
          isOpen
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </ContentModerationDropGateContext.Provider>
  );

  if (visibility.kind === "blocked" && presentation === "profile-activity") {
    return withGateContext(
      <BlockedProfileActivityPresentation
        drop={drop}
        isRevealed={isRevealed}
        onReveal={reveal}
        onHideAgain={hideAgain}
      >
        {children}
      </BlockedProfileActivityPresentation>
    );
  }

  if (effectiveVisibility.kind === "visible") {
    return withGateContext(children);
  }

  if (effectiveVisibility.kind === SELF_VISIBLE_TOMBSTONE_KIND) {
    return withGateContext(
      <AuthorModeratedPresentation
        compact={compact}
        preserveGlobalContext={preserveGlobalContext}
        status={effectiveVisibility.status}
      >
        {children}
      </AuthorModeratedPresentation>
    );
  }

  if (effectiveVisibility.kind === "hidden") {
    return withGateContext(
      <PersonalModerationOverlay
        compact={compact}
        testId="content-moderation-tombstone-hidden"
        controls={
          <>
            {reportStatus !== null ? (
              <>
                <ContentModerationReportStatusButton compact />
                <span aria-hidden="true">·</span>
              </>
            ) : (
              <>
                <span>{t(locale, "contentModeration.tombstone.hidden")}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <PersonalModerationAction
              label={t(locale, "contentModeration.actions.reveal")}
              tooltip={t(locale, "contentModeration.tooltips.revealHidden")}
              onClick={reveal}
            />
            <span aria-hidden="true">·</span>
            <PersonalModerationAction
              label={t(locale, "contentModeration.actions.unhide")}
              tooltip={t(locale, "contentModeration.tooltips.unhide")}
              disabled={unhideMutation.isPending}
              onClick={() => unhideMutation.mutate()}
            />
          </>
        }
      >
        {children}
      </PersonalModerationOverlay>
    );
  }

  if (effectiveVisibility.kind === "blocked") {
    const handle = drop.author.handle;
    return withGateContext(
      <PersonalModerationOverlay
        compact={compact}
        testId="content-moderation-tombstone-blocked"
        controls={
          <>
            <Link
              href={`/${encodeURIComponent(handle ?? drop.author.id)}`}
              aria-label={t(
                locale,
                "contentModeration.preferences.openProfile",
                {
                  profile: profileLabel,
                }
              )}
              onClick={(event) => event.stopPropagation()}
              className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-1.5 tw-rounded tw-text-inherit tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-white"
            >
              <span className="tw-relative tw-size-5 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-bg-iron-800">
                {drop.author.pfp ? (
                  <Image
                    src={resolveIpfsUrlSync(drop.author.pfp)}
                    alt=""
                    fill
                    sizes="20px"
                    className="tw-object-cover tw-grayscale"
                  />
                ) : (
                  <UserCircleIcon
                    aria-hidden="true"
                    className="tw-size-full tw-text-iron-500"
                  />
                )}
              </span>
              <span className="tw-min-w-0 tw-max-w-20 tw-truncate tw-text-iron-300 sm:tw-max-w-32">
                {profileLabel}
              </span>
            </Link>
            <span aria-hidden="true">·</span>
            <span>{t(locale, "contentModeration.tombstone.blockedShort")}</span>
            <span aria-hidden="true">·</span>
            <PersonalModerationAction
              label={t(locale, "contentModeration.actions.reveal")}
              tooltip={t(locale, "contentModeration.tooltips.revealBlocked")}
              onClick={reveal}
            />
            <span aria-hidden="true">·</span>
            <PersonalModerationAction
              label={t(locale, "contentModeration.actions.unblock")}
              tooltip={t(locale, "contentModeration.tooltips.unblock", {
                profile: profileLabel,
              })}
              disabled={unblockMutation.isPending}
              onClick={() => unblockMutation.mutate()}
            />
          </>
        }
      >
        {children}
      </PersonalModerationOverlay>
    );
  }

  if (preserveGlobalContext) {
    return withGateContext(children);
  }

  const message =
    effectiveVisibility.status === ApiDropModerationStatus.ModeratorRemoved
      ? t(locale, "contentModeration.tombstone.removed")
      : t(locale, "contentModeration.tombstone.quarantined");

  return withGateContext(
    <GlobalModerationTombstone
      compact={compact}
      kind={effectiveVisibility.kind}
      message={message}
      onClick={onGlobalTombstoneClick}
      viewOriginalLabel={t(locale, "contentModeration.tombstone.viewOriginal")}
    />
  );
}
