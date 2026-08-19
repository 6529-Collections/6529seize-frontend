"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useContentModerationVisibility } from "@/hooks/content-moderation/useContentModerationVisibility";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { unhideDrop } from "@/services/api/content-moderation-api";
import { setDropHiddenOverride } from "@/services/content-moderation/content-moderation-state";
import { invalidateContentModerationPresentation } from "@/services/content-moderation/content-moderation-query";
import { EyeIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

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
  const unhideMutation = useMutation({
    mutationFn: async () => {
      const { success } = await requestAuth();
      if (!success) throw new Error("Authentication was cancelled");
      await unhideDrop(drop.id);
    },
    onSuccess: () => {
      if (connectedProfile?.id) {
        setDropHiddenOverride(connectedProfile.id, drop.id, false);
      }
      void invalidateContentModerationPresentation(queryClient);
      setToast({
        message: t(locale, "contentModeration.unhide.success"),
        type: "success",
      });
    },
    onError: (error) => {
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

  if (visibility.kind === "visible") {
    return children;
  }

  const isGlobal = visibility.kind === "global";
  const message = (() => {
    if (visibility.kind === "blocked") {
      return t(locale, "contentModeration.tombstone.blocked");
    }
    if (visibility.kind === "hidden") {
      return t(locale, "contentModeration.tombstone.hidden");
    }
    if (visibility.status === ApiDropModerationStatus.ModeratorRemoved) {
      return t(locale, "contentModeration.tombstone.removed");
    }
    return t(locale, "contentModeration.tombstone.quarantined");
  })();

  return (
    <div
      className={`tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/80 ${
        compact ? "tw-px-3 tw-py-2" : "tw-my-1 tw-px-4 tw-py-4"
      }`}
      data-testid={`content-moderation-tombstone-${visibility.kind}`}
    >
      <ShieldExclamationIcon
        aria-hidden="true"
        className={`${compact ? "tw-size-4" : "tw-size-5"} tw-flex-shrink-0 tw-text-iron-500`}
      />
      <p
        aria-live="polite"
        className="tw-m-0 tw-min-w-0 tw-flex-1 tw-text-sm tw-text-iron-400"
      >
        {message}
      </p>
      {!isGlobal && (
        <button
          type="button"
          disabled={unhideMutation.isPending}
          onClick={(event) => {
            event.stopPropagation();
            if (visibility.kind === "hidden") {
              unhideMutation.mutate();
            } else {
              reveal();
            }
          }}
          className="tw-inline-flex tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-800"
        >
          <EyeIcon aria-hidden="true" className="tw-size-4" />
          {t(
            locale,
            visibility.kind === "hidden"
              ? "contentModeration.actions.unhide"
              : "contentModeration.tombstone.show"
          )}
        </button>
      )}
    </div>
  );
}
