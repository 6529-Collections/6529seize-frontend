"use client";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import AppSidebarUserInfo from "./AppSidebarUserInfo";
import type { FC } from "react";

interface AppSidebarHeaderProps {
  readonly onClose: () => void;
}

const AppSidebarHeader: FC<AppSidebarHeaderProps> = ({ onClose }) => {
  const { address } = useSeizeConnectContext();

  return (
    <div className="tw-px-6 tw-pb-4 tw-pt-2">
      <div className="tw-flex tw-items-center tw-justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="tw-border-none tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors tw-duration-200 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-900 active:tw-text-white"
        >
          <XMarkIcon className="tw-size-6 tw-flex-shrink-0" />
        </button>
      </div>
      <div className="tw-mt-1">
        {address ? (
          <AppSidebarUserInfo />
        ) : (
          <Link
            href="/"
            aria-label="Home"
            className="tw-inline-flex tw-items-center tw-gap-2"
          >
            <Image
              unoptimized
              src="/6529.svg"
              alt="6529"
              width={40}
              height={40}
              priority
              className="tw-size-10 tw-flex-shrink-0 tw-object-contain"
            />
          </Link>
        )}
      </div>
    </div>
  );
};

export default AppSidebarHeader;
