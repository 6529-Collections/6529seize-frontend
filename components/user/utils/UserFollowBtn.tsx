"use client";

import { useContext, useRef, useState, type ReactNode } from "react";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "@/components/auth/Auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiIdentitySubscriptionActions } from "@/generated/models/ApiIdentitySubscriptionActions";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  commonApiDeleteWithBody,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";
import { ApiIdentitySubscriptionTargetAction } from "@/generated/models/ApiIdentitySubscriptionTargetAction";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import Button from "@/components/utils/button/Button";
import IconButton from "@/components/utils/button/IconButton";
import type { IconButtonLayout } from "@/components/utils/button/iconButtonLayouts";
import type { ButtonSize } from "@/components/utils/button/buttonStyles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import UserMuteButton from "./UserMuteButton";
import UserFollowingMenu from "./UserFollowingMenu";
import { ArrowsRightLeftIcon, NoSymbolIcon } from "@heroicons/react/24/outline";

const FOLLOW_ACTIONS = Object.values(
  ApiIdentitySubscriptionTargetAction
).filter((action) => action !== ApiIdentitySubscriptionTargetAction.DropVoted);

export enum UserFollowBtnSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
}

export const FOLLOW_BTN_SVG_CLASSES: Record<UserFollowBtnSize, string> = {
  [UserFollowBtnSize.SMALL]: "tw-h-3 tw-w-3 md:tw-h-4 md:tw-w-4 -tw-ml-1",
  [UserFollowBtnSize.MEDIUM]: "tw-h-4 tw-w-4 md:tw-h-5 md:tw-w-5 -tw-ml-1",
};

const FOLLOW_BTN_LOADER_SIZES: Record<UserFollowBtnSize, CircleLoaderSize> = {
  [UserFollowBtnSize.SMALL]: CircleLoaderSize.SMALL,
  [UserFollowBtnSize.MEDIUM]: CircleLoaderSize.MEDIUM,
};

export const FOLLOW_BUTTON_SIZES: Record<UserFollowBtnSize, ButtonSize> = {
  [UserFollowBtnSize.SMALL]: "xs",
  [UserFollowBtnSize.MEDIUM]: "sm",
};

const DIRECT_MESSAGE_BUTTON_CLASSES: Record<UserFollowBtnSize, string> = {
  [UserFollowBtnSize.SMALL]: "tw-size-8",
  [UserFollowBtnSize.MEDIUM]: "tw-size-9",
};

const DIRECT_MESSAGE_ICON_CLASSES: Record<UserFollowBtnSize, string> = {
  [UserFollowBtnSize.SMALL]: "tw-size-3",
  [UserFollowBtnSize.MEDIUM]: "tw-size-3.5 md:tw-size-4",
};

function FollowStateIcon({
  loading,
  blocked,
  following,
  mutual,
  size,
}: {
  readonly loading: boolean;
  readonly blocked: boolean;
  readonly following: boolean;
  readonly mutual: boolean;
  readonly size: UserFollowBtnSize;
}) {
  if (loading) {
    return <CircleLoader size={FOLLOW_BTN_LOADER_SIZES[size]} />;
  }
  if (blocked) {
    return (
      <NoSymbolIcon
        className={FOLLOW_BTN_SVG_CLASSES[size]}
        aria-hidden="true"
      />
    );
  }
  if (mutual) {
    return (
      <ArrowsRightLeftIcon
        aria-hidden="true"
        className={FOLLOW_BTN_SVG_CLASSES[size]}
      />
    );
  }
  if (following) {
    return (
      <svg
        className="tw-h-3 tw-w-3"
        width="17"
        height="15"
        viewBox="0 0 17 15"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.7953 0.853403L5.24867 10.0667L2.71534 7.36007C2.24867 6.92007 1.51534 6.8934 0.982005 7.26674C0.462005 7.6534 0.315338 8.3334 0.635338 8.88007L3.63534 13.7601C3.92867 14.2134 4.43534 14.4934 5.00867 14.4934C5.55534 14.4934 6.07534 14.2134 6.36867 13.7601C6.84867 13.1334 16.0087 2.2134 16.0087 2.2134C17.2087 0.986737 15.7553 -0.093263 14.7953 0.84007V0.853403Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg
      className={FOLLOW_BTN_SVG_CLASSES[size]}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getFollowButtonLabel(
  locale: SupportedLocale,
  {
    blocked,
    following,
    followsViewer,
    followLabel,
    followingLabel,
  }: {
    readonly blocked: boolean;
    readonly following: boolean;
    readonly followsViewer: boolean;
    readonly followLabel?: string | undefined;
    readonly followingLabel?: string | undefined;
  }
): string {
  if (blocked) return t(locale, "profile.follow.unblock");
  if (following) {
    return followingLabel ?? t(locale, "notifications.followButton.following");
  }
  if (followsViewer) return t(locale, "profile.follow.followBack");
  return followLabel ?? t(locale, "notifications.followButton.follow");
}

export default function UserFollowBtn({
  handle,
  size = UserFollowBtnSize.MEDIUM,
  onDirectMessage,
  directMessageLoading,
  showMuteButton = true,
  showFollowButton = true,
  blocked = false,
  blockStateLoading = false,
  unblockPending = false,
  onUnblock,
  beforeFollowAction,
  afterFollowAction,
  insideHoverCard = false,
  followLabel,
  followingLabel,
  initialFollowing = false,
  buttonClassName: customButtonClassName,
  directMessageButtonLayout,
}: {
  readonly handle: string;
  readonly size?: UserFollowBtnSize | undefined;
  readonly onDirectMessage?: (() => void | Promise<void>) | undefined;
  readonly directMessageLoading?: boolean | undefined;
  readonly showMuteButton?: boolean | undefined;
  readonly showFollowButton?: boolean | undefined;
  readonly blocked?: boolean | undefined;
  readonly blockStateLoading?: boolean | undefined;
  readonly unblockPending?: boolean | undefined;
  readonly onUnblock?: (() => void) | undefined;
  readonly beforeFollowAction?: ReactNode | undefined;
  readonly afterFollowAction?: ReactNode | undefined;
  readonly insideHoverCard?: boolean | undefined;
  readonly followLabel?: string | undefined;
  readonly followingLabel?: string | undefined;
  readonly initialFollowing?: boolean | undefined;
  readonly buttonClassName?: string | undefined;
  readonly directMessageButtonLayout?: IconButtonLayout | undefined;
}) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const { onIdentityFollowChange } = useContext(ReactQueryWrapperContext);
  const {
    setToast,
    requestAuth,
    connectedProfile,
    activeProfileProxy,
    isAuthenticated,
    isDirectProfileSession,
  } = useContext(AuthContext);
  const [mutating, setMutating] = useState<boolean>(false);
  const [directMessageMutating, setDirectMessageMutating] =
    useState<boolean>(false);
  const directMessageMutatingRef = useRef(false);

  const statusKey = [
    QueryKey.IDENTITY_FOLLOWING_ACTIONS,
    handle,
    {
      identityId: connectedProfile?.id ?? null,
      proxyId: activeProfileProxy?.id ?? null,
      isAuthenticated: isAuthenticated === true,
      isDirectProfileSession: isDirectProfileSession === true,
    },
  ] as const;
  const canReadStatus = Boolean(
    connectedProfile?.id &&
    isAuthenticated &&
    isDirectProfileSession &&
    !activeProfileProxy
  );
  const endpoint = `identities/${encodeURIComponent(handle)}/subscriptions`;
  const { data: subscriptions, isFetching } =
    useQuery<ApiIdentitySubscriptionActions>({
      queryKey: statusKey,
      queryFn: ({ signal }) =>
        commonApiFetch<ApiIdentitySubscriptionActions>({ endpoint, signal }),
      enabled:
        canReadStatus &&
        showFollowButton &&
        !blocked &&
        !blockStateLoading &&
        !unblockPending,
    });
  const isInitialStatusLoading =
    blockStateLoading ||
    unblockPending ||
    (!blocked && isFetching && subscriptions === undefined);

  const following =
    !blocked &&
    (subscriptions ? subscriptions.actions.length > 0 : initialFollowing);
  const followsViewer =
    canReadStatus && !blocked && subscriptions?.follows_viewer === true;
  const mutual = following && followsViewer;
  const label = getFollowButtonLabel(locale, {
    blocked,
    following,
    followsViewer,
    followLabel,
    followingLabel,
  });

  const followMutation = useMutation({
    mutationFn: ({
      unfollow,
      targetEndpoint,
    }: {
      readonly unfollow: boolean;
      readonly targetEndpoint: string;
      readonly key: typeof statusKey;
    }) => {
      const send = unfollow ? commonApiDeleteWithBody : commonApiPost;
      return send<
        ApiIdentitySubscriptionActions,
        ApiIdentitySubscriptionActions
      >({
        endpoint: targetEndpoint,
        body: { actions: FOLLOW_ACTIONS },
      });
    },
    onSuccess: async ({ actions }, { key }) => {
      await queryClient.cancelQueries({ queryKey: key, exact: true });
      // The write response only changes the outgoing actions; keep any known reverse status.
      queryClient.setQueryData<ApiIdentitySubscriptionActions>(
        key,
        (previous) => ({
          ...previous,
          actions,
        })
      );
      onIdentityFollowChange();
    },
    onError: (error, { unfollow }) => {
      setToast({
        type: "error",
        title: t(
          locale,
          unfollow
            ? "profile.follow.error.unfollow"
            : "profile.follow.error.follow"
        ),
        description: t(locale, "profile.follow.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const changeFollow = async (unfollow: boolean): Promise<void> => {
    if (blocked) {
      onUnblock?.();
      return;
    }
    setMutating(true);
    try {
      const { success } = await requestAuth();
      if (success) {
        followMutation.mutate({
          unfollow,
          targetEndpoint: endpoint,
          key: statusKey,
        });
        return;
      }
    } catch (error) {
      setToast({
        type: "error",
        title: t(locale, "profile.follow.error.authenticate"),
        description: t(locale, "profile.follow.error.retry"),
        details: getToastErrorDetails(error),
      });
    }
    setMutating(false);
  };

  const isDirectMessagePending =
    directMessageMutating || !!directMessageLoading;

  const onDirectMessageClick = async (): Promise<void> => {
    if (
      !onDirectMessage ||
      directMessageMutatingRef.current ||
      directMessageLoading
    ) {
      return;
    }

    directMessageMutatingRef.current = true;
    setDirectMessageMutating(true);

    try {
      await onDirectMessage();
    } finally {
      directMessageMutatingRef.current = false;
      setDirectMessageMutating(false);
    }
  };

  const directMessageTooltipId = `dm-${handle}`;
  const actionLoading = mutating || isInitialStatusLoading;
  const buttonClassName = `${size === UserFollowBtnSize.MEDIUM ? "!tw-text-[13px]" : ""} ${customButtonClassName ?? ""}`;
  const actionContent = (
    <>
      <FollowStateIcon
        loading={actionLoading}
        blocked={blocked}
        following={following}
        mutual={mutual}
        size={size}
      />
      <span>{label}</span>
    </>
  );

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      {onDirectMessage && (
        <>
          <IconButton
            layout={directMessageButtonLayout}
            variant="secondary"
            size={size === UserFollowBtnSize.SMALL ? 32 : 36}
            onClick={onDirectMessageClick}
            disabled={isDirectMessagePending}
            aria-label="Send direct message"
            className={
              directMessageButtonLayout
                ? undefined
                : "!tw-shadow-none tw-duration-300 enabled:hover:tw-ring-iron-600 disabled:tw-cursor-default disabled:tw-opacity-70"
            }
            data-tooltip-id={directMessageTooltipId}
          >
            {isDirectMessagePending ? (
              <CircleLoader size={CircleLoaderSize.SMALL} />
            ) : (
              <FontAwesomeIcon
                icon={faPaperPlane}
                className={DIRECT_MESSAGE_ICON_CLASSES[size]}
              />
            )}
          </IconButton>
          <Tooltip
            id={directMessageTooltipId}
            place="top"
            offset={8}
            delayShow={250}
            opacity={1}
            positionStrategy="fixed"
            style={TOOLTIP_STYLES}
          >
            <span className="tw-text-xs">Direct Message</span>
          </Tooltip>
        </>
      )}
      {showMuteButton && (
        <UserMuteButton
          handle={handle}
          buttonClassName={DIRECT_MESSAGE_BUTTON_CLASSES[size]}
          iconClassName={DIRECT_MESSAGE_ICON_CLASSES[size]}
        />
      )}
      {beforeFollowAction}
      {showFollowButton && following && (
        <UserFollowingMenu
          size={FOLLOW_BUTTON_SIZES[size]}
          className={buttonClassName}
          busy={actionLoading}
          status={mutual ? t(locale, "profile.follow.mutualStatus") : undefined}
          unfollowLabel={t(locale, "profile.follow.unfollow")}
          insideHoverCard={insideHoverCard}
          onUnfollow={() => void changeFollow(true)}
        >
          {actionContent}
        </UserFollowingMenu>
      )}
      {showFollowButton && !following && (
        <Button
          onClick={() => void changeFollow(false)}
          disabled={actionLoading || (blocked && !onUnblock)}
          aria-busy={actionLoading || undefined}
          aria-label={
            blocked
              ? t(locale, "profile.follow.unblockProfile", { handle })
              : undefined
          }
          variant={blocked || isInitialStatusLoading ? "secondary" : "primary"}
          size={FOLLOW_BUTTON_SIZES[size]}
          className={buttonClassName}
        >
          {actionContent}
        </Button>
      )}
      {afterFollowAction}
    </div>
  );
}
