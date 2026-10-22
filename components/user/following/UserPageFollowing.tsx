"use client";

import { useContext, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import Follower from "@/components/utils/followers/Follower";
import { getFollowersMessage } from "@/components/utils/followers/followers.messages";
import Button from "@/components/utils/button/Button";
import useFollowingList from "@/hooks/useFollowingList";
import { formatUserStatsRowInteger } from "../utils/stats/user-stats-row.messages";

export default function UserPageFollowing({
  profileId,
}: {
  readonly profileId: string | null | undefined;
}) {
  const {
    connectedProfile,
    isAuthenticated,
    activeProfileProxy,
    isDirectProfileSession,
  } = useContext(AuthContext);
  if (
    !profileId ||
    !isAuthenticated ||
    !isDirectProfileSession ||
    activeProfileProxy ||
    connectedProfile?.id !== profileId
  ) {
    return null;
  }

  // Unmount the private query and dialog immediately on an account/role change.
  return <OwnProfileFollowing key={profileId} identityId={profileId} />;
}

function OwnProfileFollowing({ identityId }: { readonly identityId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const query = useFollowingList(identityId);
  const title = getFollowersMessage("followers.following.title");
  let countLabel = getFollowersMessage("followers.following.loadingCount");
  if (query.count !== undefined) {
    countLabel = formatUserStatsRowInteger(query.count);
  } else if (query.isError) {
    countLabel = getFollowersMessage("followers.following.unavailableCount");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={getFollowersMessage("followers.following.open", {
          count: countLabel,
        })}
        className="tw-min-h-6 tw-cursor-pointer tw-rounded tw-border-none tw-bg-transparent tw-p-0 tw-text-md tw-transition focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-underline"
      >
        <span className="tw-font-semibold tw-text-iron-200">{countLabel}</span>{" "}
        <span className="tw-font-medium tw-text-iron-500">{title}</span>
      </button>
      <MobileWrapperDialog
        title={title}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tall
        fixedHeight
        tabletModal
        maxWidthClass="md:tw-max-w-md"
        showScrollbar
      >
        <div aria-busy={query.isFetching}>
          <ul
            aria-label={title}
            className="tw-mb-0 tw-mt-4 tw-flex tw-list-none tw-flex-col tw-p-0"
          >
            {query.following.map((follower, index) => (
              <Follower
                key={follower.identity.id}
                follower={follower}
                showFollowButton
                mutedBackground={index % 2 === 1}
              />
            ))}
          </ul>
          {query.isFetching && (
            <p role="status" className="tw-p-4 tw-text-center tw-text-iron-400">
              {getFollowersMessage("followers.following.loading")}
            </p>
          )}
          {query.isError && (
            <div className="tw-p-4 tw-text-center">
              <p role="alert" className="tw-text-iron-300">
                {getFollowersMessage("followers.following.error")}
              </p>
              <Button
                variant="secondary"
                size="sm"
                disabled={query.isFetching}
                onClick={() => {
                  void (query.isFetchNextPageError
                    ? query.fetchNextPage({ cancelRefetch: false })
                    : query.refetch());
                }}
              >
                {getFollowersMessage("followers.following.retry")}
              </Button>
            </div>
          )}
          {!query.isFetching && !query.isError && query.count === 0 && (
            <p className="tw-p-4 tw-text-center tw-text-iron-400">
              {getFollowersMessage("followers.following.empty")}
            </p>
          )}
          {query.hasNextPage && !query.isError && (
            <div className="tw-p-4 tw-text-center">
              <Button
                variant="secondary"
                size="sm"
                disabled={query.isFetching}
                onClick={() => {
                  void query.fetchNextPage({ cancelRefetch: false });
                }}
              >
                {getFollowersMessage("followers.following.loadMore")}
              </Button>
              <CommonIntersectionElement
                onIntersection={query.onBottomIntersection}
              />
            </div>
          )}
        </div>
      </MobileWrapperDialog>
    </>
  );
}
