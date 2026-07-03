import Image from "next/image";
import Link from "next/link";
import type { ApiIdentityAndSubscriptionActions } from "@/generated/models/ApiIdentityAndSubscriptionActions";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";
import UserFollowBtn, {
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import { getFollowersMessage } from "./followers.messages";

const FOLLOW_STATUS_PREFETCH_MARGIN = "360px";

export default function Follower({
  follower,
  showFollowButton = false,
  mutedBackground = false,
}: {
  readonly follower: ApiIdentityAndSubscriptionActions;
  readonly showFollowButton?: boolean | undefined;
  readonly mutedBackground?: boolean | undefined;
}) {
  const rowRef = useRef<HTMLLIElement>(null);
  const [shouldLoadFollowButton, setShouldLoadFollowButton] = useState(false);
  const { connectedProfile } = useContext(AuthContext);
  const followerHandle = follower.identity.handle;
  const followerProfileRoute =
    followerHandle ?? follower.identity.primary_address;
  const followerProfileName =
    followerHandle ?? follower.identity.primary_address;
  const normalizedFollowerHandle = followerHandle?.toLowerCase() ?? null;
  const normalizedConnectedHandle =
    connectedProfile?.handle?.toLowerCase() ?? null;
  const shouldShowFollowButton = Boolean(
    showFollowButton &&
    normalizedFollowerHandle &&
    (!normalizedConnectedHandle ||
      normalizedFollowerHandle !== normalizedConnectedHandle)
  );
  const backgroundClass = mutedBackground ? "tw-bg-white/[0.01]" : "";
  const profileLabel = getFollowersMessage("followers.profile.linkAriaLabel", {
    handle: followerProfileName,
  });
  const profileImageAlt = getFollowersMessage("followers.profile.avatarAlt", {
    handle: followerProfileName,
  });

  useEffect(() => {
    if (!shouldShowFollowButton || shouldLoadFollowButton) {
      return;
    }

    const row = rowRef.current;
    if (!row || typeof IntersectionObserver === "undefined") {
      setShouldLoadFollowButton(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        setShouldLoadFollowButton(true);
        observer.disconnect();
      },
      { rootMargin: FOLLOW_STATUS_PREFETCH_MARGIN }
    );

    observer.observe(row);
    return () => observer.disconnect();
  }, [shouldShowFollowButton, shouldLoadFollowButton]);

  return (
    <li ref={rowRef} className={`${backgroundClass} tw-py-3`}>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-px-4 sm:tw-px-6">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-3">
          <div className="tw-relative tw-h-10 tw-w-10 tw-flex-shrink-0 tw-rounded-lg tw-bg-iron-800">
            <div className="tw-h-full tw-w-full tw-rounded-lg">
              <div className="tw-h-full tw-w-full tw-max-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/5">
                <div className="tw-relative tw-flex tw-h-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-text-center">
                  {follower.identity.pfp ? (
                    // Profile avatars can come from arbitrary remote hosts, so this stays unoptimized.
                    <Image
                      src={follower.identity.pfp}
                      alt={profileImageAlt}
                      fill
                      unoptimized
                      sizes="40px"
                      className="tw-bg-transparent tw-object-contain"
                    />
                  ) : (
                    <div className="tw-mx-auto tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-bg-transparent tw-object-contain" />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-col">
            <div className="tw-flex tw-items-center tw-gap-x-1">
              <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-2">
                <p className="tw-mb-0 tw-min-w-0 tw-text-md tw-font-semibold tw-leading-none tw-text-iron-50">
                  <Link
                    href={`/${followerProfileRoute}`}
                    aria-label={profileLabel}
                    className="tw-block tw-truncate tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-500 hover:tw-underline"
                  >
                    {followerProfileName}
                  </Link>
                </p>
                <UserCICAndLevel
                  level={follower.identity.level}
                  size={UserCICAndLevelSize.SMALL}
                />
              </div>
            </div>
          </div>
        </div>
        {shouldShowFollowButton && followerHandle && (
          <div className="tw-flex-shrink-0">
            {shouldLoadFollowButton ? (
              <UserFollowBtn
                handle={followerHandle}
                size={UserFollowBtnSize.SMALL}
                showMuteButton={false}
              />
            ) : (
              <div className="tw-h-8 tw-w-[7.25rem]" />
            )}
          </div>
        )}
      </div>
    </li>
  );
}
