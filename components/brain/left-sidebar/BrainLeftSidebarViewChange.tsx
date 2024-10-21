import React, { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AuthContext } from "../../auth/Auth";
import { useUnreadNotifications } from "../../../hooks/useUnreadNotifications";

interface BrainLeftSidebarViewChangeProps {}

export const BrainLeftSidebarViewChange: React.FC<
  BrainLeftSidebarViewChangeProps
> = () => {
  const { connectedProfile } = useContext(AuthContext);
  const router = useRouter();

  const { haveUnreadNotifications } = useUnreadNotifications(
    connectedProfile?.profile?.handle
  );

  const isLinkActive = (path: string) => router.pathname === path;

  const getLinkClasses = (path: string) =>
    `tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-md ${
      isLinkActive(path) ? "tw-bg-iron-800" : "tw-bg-iron-950"
    }`;

  const getTextClasses = (path: string) =>
    `tw-font-inter tw-font-semibold tw-text-sm ${
      isLinkActive(path) ? "tw-text-iron-300" : "tw-text-iron-400"
    }`;

  return (
    <div className="tw-flex tw-justify-center tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-h-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-[10px]">
      <Link href="/my-stream" className={getLinkClasses("/my-stream")}>
        <span className={getTextClasses("/my-stream")}>My Stream</span>
      </Link>
      <Link
        href="/my-stream/notifications"
        className={getLinkClasses("/my-stream/notifications")}
      >
        <span className={getTextClasses("/my-stream/notifications")}>
          Notifications
        </span>
        {haveUnreadNotifications && (
          <span className="tw-size-2 -tw-mt-2 -tw-ml-0.5 tw-bg-red tw-rounded-full"></span>
        )}
      </Link>
    </div>
  );
};
