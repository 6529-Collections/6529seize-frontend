"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";

import { ProfileBadgeSize } from "./ProfileAvatar";

interface ProfileHandleProps {
  readonly handle?: string | null;
  readonly size: ProfileBadgeSize;
  readonly href?: string;
  readonly asLink?: boolean;
  readonly highlightSearchParam?: string;
}

const TEXT_SIZE_CLASSES: Record<ProfileBadgeSize, string> = {
  [ProfileBadgeSize.SMALL]: "tw-text-sm",
  [ProfileBadgeSize.MEDIUM]: "tw-text-md",
  [ProfileBadgeSize.LARGE]: "tw-text-md",
};

export default function ProfileHandle({
  handle,
  size,
  href,
  asLink = true,
  highlightSearchParam = "user",
}: ProfileHandleProps) {
  const searchParams = useSearchParams();
  const paramValue = (searchParams?.get(highlightSearchParam) ?? "").toLowerCase();
  const amISubject = (handle ?? "").toLowerCase() === paramValue;

  const getTextClasses = (): string => {
    switch (size) {
      case ProfileBadgeSize.SMALL:
        return TEXT_SIZE_CLASSES[ProfileBadgeSize.SMALL];
      case ProfileBadgeSize.MEDIUM:
        return TEXT_SIZE_CLASSES[ProfileBadgeSize.MEDIUM];
      case ProfileBadgeSize.LARGE:
        return TEXT_SIZE_CLASSES[ProfileBadgeSize.LARGE];
      default:
        assertUnreachable(size);
        return TEXT_SIZE_CLASSES[ProfileBadgeSize.MEDIUM];
    }
  };

  const textClasses = getTextClasses();
  const isLinkEnabled = Boolean(asLink && href && !amISubject);

  if (isLinkEnabled) {
    return (
      <p
        className={`${textClasses} tw-mb-0 tw-leading-none tw-font-semibold ${amISubject ? "tw-text-iron-50" : "tw-text-iron-50"}`}>
        <Link
          onClick={(e) => e.stopPropagation()}
          href={href as string}
          className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out">
          {handle}
        </Link>
      </p>
    );
  }

  return (
    <p className={`${textClasses} tw-font-semibold tw-mb-0 tw-leading-none tw-text-iron-50`}>
      {handle}
    </p>
  );
}

export type { ProfileHandleProps };
