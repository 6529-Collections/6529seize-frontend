import type { ReactNode } from "react";

/**
 * A chat row has two places for its author header: beside the avatar, shown
 * below Tailwind's `md` width, and above the content, shown from `md`. When the
 * viewport width is known only the visible slot mounts the header. While it is
 * unknown (`null`: server render, hydration) both mount and CSS hides one, so
 * server and client markup agree.
 */
export const getMobileAuthorHeader = ({
  inlineAuthorOnDesktop,
  authorHeader,
  isMdViewport,
}: {
  readonly inlineAuthorOnDesktop: boolean;
  readonly authorHeader: ReactNode;
  readonly isMdViewport: boolean | null;
}): ReactNode =>
  inlineAuthorOnDesktop || isMdViewport !== true ? authorHeader : null;

export const getDesktopAuthorHeader = ({
  showAuthorInfo,
  inlineAuthorOnDesktop,
  authorHeader,
  isMdViewport,
}: {
  readonly showAuthorInfo: boolean;
  readonly inlineAuthorOnDesktop: boolean;
  readonly authorHeader: ReactNode;
  readonly isMdViewport: boolean | null;
}): ReactNode => {
  if (showAuthorInfo && !inlineAuthorOnDesktop) {
    return (
      <div className="tw-hidden md:tw-block">
        {isMdViewport === false ? null : authorHeader}
      </div>
    );
  }

  if (showAuthorInfo) {
    return null;
  }

  return authorHeader;
};
