"use client";

import ProfileNameWithAiMarker from "@/components/common/profile/ProfileNameWithAiMarker";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { DropTimestampLayout } from "./drop.types";
import WaveDropTime from "./time/WaveDropTime";

interface DropMinimalIdentityRowProps {
  readonly drop: ApiDrop;
  readonly timestampLayout?: DropTimestampLayout | undefined;
}

export default function DropMinimalIdentityRow({
  drop,
  timestampLayout = "inline",
}: DropMinimalIdentityRowProps) {
  const router = useRouter();
  const authorIdentity = drop.author.handle ?? drop.author.primary_address;
  const isStackedTimestamp = timestampLayout === "stacked";

  const handleNavigation = useCallback(
    (event: React.MouseEvent, path: string) => {
      event.preventDefault();
      event.stopPropagation();
      router.push(path);
    },
    [router]
  );

  return (
    <div
      className={
        isStackedTimestamp
          ? "tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-y-1"
          : "tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1"
      }
    >
      <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-leading-none">
        <UserProfileTooltipWrapper user={authorIdentity}>
          <Link
            href={`/${authorIdentity}`}
            onClick={(event) => handleNavigation(event, `/${authorIdentity}`)}
            className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-opacity-80 desktop-hover:hover:tw-underline"
          >
            <ProfileNameWithAiMarker
              classification={drop.author.classification}
            >
              {authorIdentity}
            </ProfileNameWithAiMarker>
          </Link>
        </UserProfileTooltipWrapper>
      </p>
      {!isStackedTimestamp && (
        <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-700" />
      )}
      <WaveDropTime timestamp={drop.created_at} />
    </div>
  );
}
