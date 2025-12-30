"use client";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { FC } from "react";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import AppSidebarUserInfo from "./AppSidebarUserInfo";

interface AppSidebarHeaderProps {
  readonly onClose: () => void;
}

const AppSidebarHeader: FC<AppSidebarHeaderProps> = ({ onClose }) => {
  const { address } = useSeizeConnectContext();

  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-relative">
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
            className="tw-size-10 tw-object-contain tw-flex-shrink-0"
          />
        </Link>
      )}
      <button
        onClick={onClose}
        aria-label="Close menu"
        className="tw-absolute tw-right-2 tw-top-2 tw-bg-transparent tw-border-none tw-text-iron-400 active:tw-text-white focus:tw-outline-none tw-transition-colors tw-duration-200"
      >
        <XMarkIcon className="tw-size-6 tw-flex-shrink-0" />
      </button>
    </div>
  );
};

export default AppSidebarHeader;
