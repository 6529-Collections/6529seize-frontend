"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { blockProfile, hideDrop } from "@/services/api/content-moderation-api";
import {
  getDropHiddenOverride,
  getProfileBlockedOverride,
  setDropHiddenOverride,
  setProfileBlockedOverride,
} from "@/services/content-moderation/content-moderation-state";
import { invalidateContentModerationPresentation } from "@/services/content-moderation/content-moderation-query";
import {
  EyeSlashIcon,
  FlagIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ContentModerationDropActions({
  drop,
  mobile = false,
  onAction,
  onReport,
}: {
  readonly drop: ApiDrop;
  readonly mobile?: boolean | undefined;
  readonly onAction?: (() => void) | undefined;
  readonly onReport: () => void;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const queryClient = useQueryClient();
  const isOwnDrop = connectedProfile?.id === drop.author.id;
  const isUnavailable =
    isOwnDrop || activeProfileProxy !== null || drop.id.startsWith("temp-");

  const runAuthenticated = async (action: () => Promise<void>) => {
    const { success } = await requestAuth();
    if (!success) throw new Error("Authentication was cancelled");
    await action();
  };

  const hideMutation = useMutation({
    mutationFn: () => runAuthenticated(() => hideDrop(drop.id)),
    onMutate: () => {
      const viewerProfileId = connectedProfile?.id;
      if (!viewerProfileId) return undefined;
      const previous = getDropHiddenOverride(viewerProfileId, drop.id);
      setDropHiddenOverride(viewerProfileId, drop.id, true);
      onAction?.();
      return { previous, viewerProfileId };
    },
    onSuccess: () => {
      setToast({
        message: t(locale, "contentModeration.hide.success"),
        type: "success",
      });
      if (!connectedProfile?.id) onAction?.();
    },
    onError: (error, _variables, context) => {
      if (context) {
        setDropHiddenOverride(
          context.viewerProfileId,
          drop.id,
          context.previous
        );
      }
      if (
        error instanceof Error &&
        error.message === "Authentication was cancelled"
      )
        return;
      setToast({
        type: "error",
        title: t(locale, "contentModeration.hide.error"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      void invalidateContentModerationPresentation(queryClient);
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => runAuthenticated(() => blockProfile(drop.author.id)),
    onMutate: () => {
      const viewerProfileId = connectedProfile?.id;
      if (!viewerProfileId) return undefined;
      const previous = getProfileBlockedOverride(
        viewerProfileId,
        drop.author.id
      );
      setProfileBlockedOverride(viewerProfileId, drop.author.id, true);
      onAction?.();
      return { previous, viewerProfileId };
    },
    onSuccess: () => {
      setToast({
        message: t(locale, "contentModeration.block.success"),
        type: "success",
      });
      if (!connectedProfile?.id) onAction?.();
    },
    onError: (error, _variables, context) => {
      if (context) {
        setProfileBlockedOverride(
          context.viewerProfileId,
          drop.author.id,
          context.previous
        );
      }
      if (
        error instanceof Error &&
        error.message === "Authentication was cancelled"
      )
        return;
      setToast({
        type: "error",
        title: t(locale, "contentModeration.block.error"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      void invalidateContentModerationPresentation(queryClient);
    },
  });

  if (isUnavailable) return null;

  const buttonClassName = mobile
    ? "tw-flex tw-w-full tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-text-iron-300 tw-transition-colors active:tw-bg-iron-800 disabled:tw-opacity-50"
    : "tw-flex tw-w-full tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors desktop-hover:hover:tw-bg-iron-800 disabled:tw-opacity-50";
  const labelClassName = mobile
    ? "tw-text-base tw-font-semibold"
    : "tw-text-sm tw-font-medium";
  const iconClassName = mobile ? "tw-size-5" : "tw-size-4";

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={(event) => {
          event.stopPropagation();
          onReport();
        }}
      >
        <FlagIcon aria-hidden="true" className={iconClassName} />
        <span className={labelClassName}>
          {t(locale, "contentModeration.actions.report")}
        </span>
      </button>
      <button
        type="button"
        className={buttonClassName}
        disabled={hideMutation.isPending}
        onClick={(event) => {
          event.stopPropagation();
          hideMutation.mutate();
        }}
      >
        <EyeSlashIcon aria-hidden="true" className={iconClassName} />
        <span className={labelClassName}>
          {t(locale, "contentModeration.actions.hide")}
        </span>
      </button>
      <button
        type="button"
        className={buttonClassName}
        disabled={blockMutation.isPending}
        onClick={(event) => {
          event.stopPropagation();
          blockMutation.mutate();
        }}
      >
        <NoSymbolIcon aria-hidden="true" className={iconClassName} />
        <span className={labelClassName}>
          {t(locale, "contentModeration.actions.block")}
        </span>
      </button>
    </>
  );
}
