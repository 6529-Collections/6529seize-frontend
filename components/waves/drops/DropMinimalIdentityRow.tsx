"use client";

import ProfileNameWithAiMarker from "@/components/common/profile/ProfileNameWithAiMarker";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import WaveDropTime from "./time/WaveDropTime";

interface DropMinimalIdentityRowProps {
  readonly drop: ApiDrop;
}

export default function DropMinimalIdentityRow({
  drop,
}: DropMinimalIdentityRowProps) {
  const router = useRouter();
  const authorLabel = drop.author.handle ?? drop.author.primary_address;

  const handleNavigation = useCallback(
    (event: React.MouseEvent, path: string) => {
      event.preventDefault();
      event.stopPropagation();
      router.push(path);
    },
    [router]
  );

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1">
      <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-leading-none">
        <UserProfileTooltipWrapper user={drop.author.handle ?? drop.author.id}>
          <Link
            href={`/${drop.author.handle ?? drop.author.primary_address}`}
            onClick={(event) =>
              handleNavigation(
                event,
                `/${drop.author.handle ?? drop.author.primary_address}`
              )
            }
            className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-opacity-80 desktop-hover:hover:tw-underline"
          >
            <ProfileNameWithAiMarker
              classification={drop.author.classification}
            >
              {authorLabel}
            </ProfileNameWithAiMarker>
          </Link>
        </UserProfileTooltipWrapper>
      </p>
      <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-600" />
      <WaveDropTime timestamp={drop.created_at} />
    </div>
  );
}
