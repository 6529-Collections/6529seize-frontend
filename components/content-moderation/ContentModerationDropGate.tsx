"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useContentModerationVisibility } from "@/hooks/content-moderation/useContentModerationVisibility";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { unhideDrop } from "@/services/api/content-moderation-api";
import {
  getDropHiddenOverride,
  setDropHiddenOverride,
} from "@/services/content-moderation/content-moderation-state";
import { invalidateContentModerationPresentation } from "@/services/content-moderation/content-moderation-query";
import { EyeIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

export default function ContentModerationDropGate({
  drop,
  children,
  compact = false,
}: ContentModerationDropGateProps) {
  const locale = useBrowserLocale();
  const { connectedProfile, requestAuth, setToast } = useAuth();
  const queryClient = useQueryClient();
  const { visibility, reveal } = useContentModerationVisibility(drop);
  const [optimisticHidden, setOptimisticHiddenState] = useState<
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
    if (visibility.kind === "global" || visibility.kind === "blocked") {
      return visibility;
    }
    if (optimisticHidden === true) {
      return { kind: "hidden" } as const;
    }
    if (optimisticHidden === false && visibility.kind === "hidden") {
      return { kind: "visible" } as const;
    }
    return visibility;
  })();
  const unhideMutation = useMutation({
    mutationFn: async () => {
      const { success } = await requestAuth();
      if (!success) throw new Error("Authentication was cancelled");
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
      setToast({
        message: t(locale, "contentModeration.unhide.success"),
        type: "success",
      });
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
        error.message === "Authentication was cancelled"
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

  if (effectiveVisibility.kind === "visible") {
    return (
      <ContentModerationDropGateContext.Provider value={gateContext}>
        {children}
      </ContentModerationDropGateContext.Provider>
    );
  }

  if (effectiveVisibility.kind === "hidden") {
    return (
      <div
        className={`tw-relative tw-w-full tw-overflow-hidden ${
          compact ? "tw-max-h-20 tw-rounded-xl" : "tw-my-1"
        }`}
        data-testid="content-moderation-tombstone-hidden"
      >
        <ContentModerationDropGateContext.Provider value={gateContext}>
          <div
            aria-hidden="true"
            inert
            className="tw-pointer-events-none tw-select-none tw-opacity-40 tw-blur-[6px]"
            data-testid="content-moderation-hidden-content"
          >
            {children}
          </div>
        </ContentModerationDropGateContext.Provider>
        <div
          className={`tw-absolute tw-inset-x-0 tw-top-0 tw-flex tw-justify-center ${
            compact ? "tw-p-0.5" : "tw-p-2"
          }`}
        >
          <div
            className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/55 tw-text-xs tw-text-iron-400 tw-shadow-sm tw-backdrop-blur-[1px] ${
              compact ? "tw-px-2 tw-py-0.5" : "tw-px-2.5 tw-py-1"
            }`}
          >
            <span>{t(locale, "contentModeration.tombstone.hidden")}</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              disabled={unhideMutation.isPending}
              onClick={(event) => {
                event.stopPropagation();
                unhideMutation.mutate();
              }}
              className="tw-cursor-pointer tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-iron-200 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50 desktop-hover:hover:tw-text-white"
            >
              {t(locale, "contentModeration.actions.unhide")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isGlobal = effectiveVisibility.kind === "global";
  const message = (() => {
    if (effectiveVisibility.kind === "blocked") {
      return t(locale, "contentModeration.tombstone.blocked");
    }
    if (effectiveVisibility.status === ApiDropModerationStatus.ModeratorRemoved) {
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
      {!isGlobal && (
        <button
          type="button"
          disabled={unhideMutation.isPending}
          onClick={(event) => {
            event.stopPropagation();
            reveal();
          }}
          className="tw-inline-flex tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-800"
        >
          <EyeIcon aria-hidden="true" className="tw-size-4" />
          {t(locale, "contentModeration.tombstone.show")}
        </button>
      )}
    </div>
  );
}
