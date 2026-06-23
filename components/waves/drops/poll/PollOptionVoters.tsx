"use client";

import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import type { ApiDropPollOption } from "@/generated/models/ApiDropPollOption";
import type { ApiIdentityOverview } from "@/generated/models/ApiIdentityOverview";
import { useDropPollOptionVoters } from "@/hooks/useDropPollOptionVoters";
import Image from "next/image";
import Link from "next/link";
import {
  getIdentityHrefValue,
  getIdentityLabel,
  shouldLimitIdentityLabel,
} from "./WaveDropPoll.helpers";

function PollVoterAvatar({
  identity,
}: {
  readonly identity: ApiIdentityOverview;
}) {
  const label = getIdentityLabel(identity);
  const avatarClassName =
    "tw-size-4 tw-flex-shrink-0 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-object-cover";

  if (!identity.pfp) {
    return <div className={avatarClassName} aria-hidden="true" />;
  }

  return (
    <Image
      unoptimized
      src={resolveIpfsUrlSync(identity.pfp)}
      alt={`${label}'s avatar`}
      width={16}
      height={16}
      className={avatarClassName}
    />
  );
}

function PollVoterRow({ voter }: { readonly voter: ApiIdentityOverview }) {
  const label = getIdentityLabel(voter);
  const hrefValue = getIdentityHrefValue(voter);
  const shouldLimit = shouldLimitIdentityLabel(label);

  return (
    <div className="-tw-mx-1.5 tw-flex tw-min-w-0 tw-items-center tw-gap-1.5 tw-rounded tw-px-1.5 tw-py-0.5 tw-transition-colors desktop-hover:hover:tw-bg-iron-800">
      <PollVoterAvatar identity={voter} />
      <UserProfileTooltipWrapper user={hrefValue}>
        <Link
          href={`/${encodeURIComponent(hrefValue)}`}
          onClick={(event) => event.stopPropagation()}
          className="tw-group tw-min-w-0 tw-no-underline tw-transition-all tw-duration-300 desktop-hover:hover:tw-opacity-80"
        >
          <span
            className={`tw-block tw-min-w-0 ${
              shouldLimit ? "tw-max-w-[10rem] tw-truncate" : "tw-truncate"
            }`}
          >
            <span className="tw-text-[11.5px] tw-text-iron-400 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-iron-200">
              {label}
            </span>
          </span>
        </Link>
      </UserProfileTooltipWrapper>
    </div>
  );
}

export function PollOptionVoters({
  dropId,
  option,
  enabled,
}: {
  readonly dropId: string;
  readonly option: ApiDropPollOption;
  readonly enabled: boolean;
}) {
  const {
    voters,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    isError,
  } = useDropPollOptionVoters({
    dropId,
    optionNo: option.option_no,
    enabled: enabled && option.votes > 0,
  });

  if (option.votes === 0) {
    return (
      <div className="tw-text-xs tw-font-medium tw-text-iron-500">
        No votes yet
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="tw-text-xs tw-font-medium tw-text-iron-500">
        Loading voters...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="tw-text-xs tw-font-medium tw-text-rose-300">
        Voters could not be loaded.
      </div>
    );
  }

  return (
    <div>
      <div className="tw-flex tw-flex-col tw-gap-2">
        {voters.map((voter) => (
          <PollVoterRow key={voter.id} voter={voter} />
        ))}
      </div>
      {hasNextPage && (
        <div className="tw-mt-2">
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={(event) => {
              event.stopPropagation();
              fetchNextPage().catch(() => undefined);
            }}
            className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-400 tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-text-iron-200"
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
