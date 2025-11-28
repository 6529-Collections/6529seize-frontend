"use client";

import Link from "next/link";
import { getProfileTargetRoute } from "@/helpers/Helpers";
import { usePathname } from "next/navigation";
import { type UserPageTabKey } from "@/components/user/layout/userTabs.config";

export default function CommonProfileLink({
  handleOrWallet,
  isCurrentUser,
  tabTarget,
}: {
  readonly handleOrWallet: string;
  readonly isCurrentUser: boolean;
  readonly tabTarget: UserPageTabKey;
}) {
  const pathname = usePathname();
  const url = getProfileTargetRoute({
    handleOrWallet,
    pathname: pathname ?? "",
    defaultPath: tabTarget,
  });

  return (
    <Link
      href={url}
      className={`${
        isCurrentUser ? "tw-pointer-events-none tw-no-underline" : ""
      } tw-leading-4 tw-p-0`}>
      <span
        className={`${
          isCurrentUser ? "" : "tw-cursor-pointer"
        } tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-200 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out`}>
        {handleOrWallet}
      </span>
    </Link>
  );
}
