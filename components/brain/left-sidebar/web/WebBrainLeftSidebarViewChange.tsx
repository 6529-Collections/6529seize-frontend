"use client";

import React, { useContext, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext } from "../../../auth/Auth";
import { useUnreadNotifications } from "../../../../hooks/useUnreadNotifications";

interface WebBrainLeftSidebarViewChangeProps {}

export const WebBrainLeftSidebarViewChange: React.FC<
  WebBrainLeftSidebarViewChangeProps
> = () => {
  const { connectedProfile } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(pathname);

  const { haveUnreadNotifications } = useUnreadNotifications(
    connectedProfile?.handle ?? null
  );

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  const isLinkActive = (path: string) => {
    if (path === "/waves") {
      return (
        pathname === "/waves" ||
        (!pathname?.startsWith("/messages") && pathname !== "/notifications")
      );
    }
    return activeTab?.startsWith(path);
  };

  const getLinkClasses = (path: string) =>
    `tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-8 tw-rounded-lg tw-transition-colors tw-duration-300 tw-ease-in-out tw-relative z-10 ${
      isLinkActive(path)
        ? "tw-text-iron-300"
        : "tw-text-iron-400 hover:tw-text-iron-300"
    }`;

  const onMessagesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push("/messages", { scroll: false });
  };

  return (
    <div className="tw-flex tw-justify-center tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-h-10 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-relative">
      <div
        className="tw-absolute tw-h-8 tw-bg-iron-800 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-in-out"
        style={{
          width: "calc(50% - 4px)",
          left: isLinkActive("/waves") ? "2px" : "calc(50% + 2px)",
        }}
      />
      <Link href="/waves" className={getLinkClasses("/waves")}>
        <span className="tw-font-semibold tw-text-sm">Waves</span>
      </Link>
      <Link
        href="/messages"
        onClick={onMessagesClick}
        className={getLinkClasses("/messages")}>
        <span className="tw-font-semibold tw-text-sm">Messages</span>
        {haveUnreadNotifications && (
          <span className="tw-size-2 -tw-mt-3 -tw-ml-0.5 tw-bg-red tw-rounded-full"></span>
        )}
      </Link>
    </div>
  );
};
