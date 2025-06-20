"use client";

import React, { useContext, useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState(router.pathname);

  const { haveUnreadNotifications } = useUnreadNotifications(
    connectedProfile?.handle ?? null
  );

  useEffect(() => {
    setActiveTab(router.pathname);
  }, [router.pathname]);

  const isLinkActive = (path: string) => activeTab === path;

  const getLinkClasses = (path: string) =>
    `tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-8 tw-rounded-lg tw-transition-colors tw-duration-300 tw-ease-in-out tw-relative z-10 ${
      isLinkActive(path)
        ? "tw-text-iron-300"
        : "tw-text-iron-400 hover:tw-text-iron-300"
    }`;

  const onNotificationsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push("/my-stream/notifications", undefined, { shallow: true });
  };

  return (
    <div className="tw-flex tw-justify-center tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-h-10 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-relative">
      <div
        className="tw-absolute tw-h-8 tw-bg-iron-800 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-in-out"
        style={{
          width: "calc(50% - 4px)",
          left: isLinkActive("/my-stream") ? "2px" : "calc(50% + 2px)",
        }}
      />
      <Link href="/my-stream" className={getLinkClasses("/my-stream")}>
        <span className="tw-font-semibold tw-text-sm">My Stream</span>
      </Link>
      <Link
        href="/my-stream/notifications"
        onClick={onNotificationsClick}
        className={getLinkClasses("/my-stream/notifications")}>
        <span className="tw-font-semibold tw-text-sm">Notifications</span>
        {haveUnreadNotifications && (
          <span className="tw-size-2 -tw-mt-3 -tw-ml-0.5 tw-bg-red tw-rounded-full"></span>
        )}
      </Link>
    </div>
  );
};
