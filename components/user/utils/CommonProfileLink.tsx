import Link from "next/link";
import { USER_PAGE_TAB_META, UserPageTabType } from "../layout/UserPageTabs";

export default function CommonProfileLink({
  handleOrWallet,
  isCurrentUser,
  tabTarget,
}: {
  readonly handleOrWallet: string;
  readonly isCurrentUser: boolean;
  readonly tabTarget: UserPageTabType;
}) {
  const url = `/${handleOrWallet}/${USER_PAGE_TAB_META[tabTarget].route}`;

  return (
    <Link
      href={url}
      className={`${
        isCurrentUser ? "tw-pointer-events-none" : ""
      } tw-no-underline tw-leading-4 tw-p-0`}
    >
      <span
        className={`${
          isCurrentUser ? "" : "hover:tw-underline tw-cursor-pointer"
        } tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100`}
      >
        {handleOrWallet}
      </span>
    </Link>
  );
}
