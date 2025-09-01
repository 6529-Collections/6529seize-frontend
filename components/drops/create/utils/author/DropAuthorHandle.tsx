"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import { DropPartSize } from "../../../view/part/DropPart";
import { ProfileMinWithoutSubs } from "../../../../../helpers/ProfileTypes";

export default function DropAuthorHandle({
  profile: { handle },
  size,
}: {
  readonly profile: ProfileMinWithoutSubs;
  readonly size: DropPartSize;
}) {
  const searchParams = useSearchParams();
  const handleOrWallet = (searchParams?.get('user') ?? '').toLowerCase();
  const amIAuthor = handle?.toLowerCase() === handleOrWallet;

  const getTextClasses = (): string => {
    switch (size) {
      case DropPartSize.SMALL:
        return "tw-text-sm";
      case DropPartSize.MEDIUM:
      case DropPartSize.LARGE:
        return "tw-text-md";
      default:
        assertUnreachable(size);
        return "";
    }
  };

  const textClasses = getTextClasses();

  if (amIAuthor) {
    return (
      <p
        className={`${textClasses} tw-font-semibold tw-mb-0 tw-leading-none tw-text-iron-50`}>
        {handle}
      </p>
    );
  }

  return (
    <p
      className={`${textClasses} tw-mb-0 tw-leading-none tw-font-semibold tw-text-iron-50`}>
      <Link
        onClick={(e) => e.stopPropagation()}
        href={`/${handle}`}
        className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out">
        {handle}
      </Link>
    </p>
  );
}
