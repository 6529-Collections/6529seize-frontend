"use client";

import { useAuth } from "@/components/auth/Auth";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useContentModerationVisibility } from "@/hooks/content-moderation/useContentModerationVisibility";
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
} from "@/services/content-moderation/content-moderation-query";
import {
  ShieldExclamationIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ContentModerationDropGateContext } from "./ContentModerationDropGateContext";

interface ContentModerationDropGateProps {
  readonly drop: Pick<
    ApiDrop,
    "id" | "author" | "viewer_context" | "moderation"
  >;
  readonly children: ReactNode;
  readonly compact?: boolean | undefined;
}

const AUTHENTICATION_CANCELLED_MESSAGE = "Authentication was cancelled";

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

export default function ContentModerationDropGate({
  drop,
  children,
  compact = false,
}: ContentModerationDropGateProps) {
  const locale = useBrowserLocale();
  const { connectedProfile, requestAuth, setToast } = useAuth();
  const queryClient = useQueryClient();
  const { visibility, reveal, isRevealed } =
    useContentModerationVisibility(drop);
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
  const gateContext = useMemo(
    () => ({ setOptimisticHidden }),
    [setOptimisticHidden]
  );
  const effectiveVisibility = (() => {
    if (visibility.kind === "global") {
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
  })();
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

  if (effectiveVisibility.kind === "visible") {
    return (
      <ContentModerationDropGateContext.Provider value={gateContext}>
        {children}
      </ContentModerationDropGateContext.Provider>
    );
  }

  if (effectiveVisibility.kind === "hidden") {
    return (
      <PersonalModerationOverlay
        compact={compact}
        testId="content-moderation-tombstone-hidden"
        controls={
          <>
            <span>{t(locale, "contentModeration.tombstone.hidden")}</span>
            <span aria-hidden="true">·</span>
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
        <ContentModerationDropGateContext.Provider value={gateContext}>
          {children}
        </ContentModerationDropGateContext.Provider>
      </PersonalModerationOverlay>
    );
  }

  if (effectiveVisibility.kind === "blocked") {
    const handle = drop.author.handle;
    const profileLabel = handle ? `@${handle}` : "Blocked author";
    return (
      <PersonalModerationOverlay
        compact={compact}
        testId="content-moderation-tombstone-blocked"
        controls={
          <>
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
        <ContentModerationDropGateContext.Provider value={gateContext}>
          {children}
        </ContentModerationDropGateContext.Provider>
      </PersonalModerationOverlay>
    );
  }

  const message = (() => {
    if (
      effectiveVisibility.status === ApiDropModerationStatus.ModeratorRemoved
    ) {
      return t(locale, "contentModeration.tombstone.removed");
    }
    return t(locale, "contentModeration.tombstone.quarantined");
  })();

  return (
    <div
      className={`tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/80 ${
        compact ? "tw-px-3 tw-py-2" : "tw-my-1 tw-px-4 tw-py-4"
      }`}
      data-testid={`content-moderation-tombstone-${effectiveVisibility.kind}`}
    >
      <ShieldExclamationIcon
        aria-hidden="true"
        className={`${compact ? "tw-size-4" : "tw-size-5"} tw-flex-shrink-0 tw-text-iron-500`}
      />
      {/* A feed may mount many tombstones at once. Keep this static copy out of
          live regions so screen readers are not flooded with announcements. */}
      <p className="tw-m-0 tw-min-w-0 tw-flex-1 tw-text-sm tw-text-iron-400">
        {message}
      </p>
    </div>
  );
}
