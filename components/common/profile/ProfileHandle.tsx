"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ProfileBadgeSize } from "./ProfileAvatar";

interface ProfileHandleProps {
  readonly handle?: string | null | undefined;
  readonly size: ProfileBadgeSize;
  readonly href?: string | undefined;
  readonly asLink?: boolean | undefined;
  readonly highlightSearchParam?: string | undefined;
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
  const textClasses = TEXT_SIZE_CLASSES[size];
  const isLinkEnabled = !!(asLink && href && !amISubject);

  const content = isLinkEnabled ? (
    <Link
      onClick={(e) => e.stopPropagation()}
      href={href}
      className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out">
      {handle}
    </Link>
  ) : (
    handle
  );

  return (
    <p className={`${textClasses} tw-font-semibold tw-mb-0 tw-leading-none tw-text-iron-50`}>
      {content}
    </p>
  );
}

export type { ProfileHandleProps };
