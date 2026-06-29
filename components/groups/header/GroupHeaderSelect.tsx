"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";
import PrimaryButtonLink from "@/components/utils/button/PrimaryButtonLink";
import Link from "next/link";
import { ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { GroupSelectVariant } from "../select/groupSelect.types";

export default function GroupHeaderSelect({
  variant = "default",
}: {
  readonly variant?: GroupSelectVariant | undefined;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const isMobileSheet = variant === "mobile-sheet";
  const getHaveProfile = (): boolean => !!connectedProfile?.handle;
  const [haveProfile, setHaveProfile] = useState(getHaveProfile());
  useEffect(() => setHaveProfile(getHaveProfile()), [connectedProfile]);

  const noProfileTitle =
    connectedProfile && !haveProfile
      ? "Please create a profile"
      : "Please connect a wallet";

  if (haveProfile) {
    if (isMobileSheet) {
      return (
        <Link
          href="/network/groups"
          className="tw-group tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-[#37373E] tw-bg-[#1C1C21] tw-p-3 tw-text-[#F5F5F5] tw-no-underline tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500 active:tw-scale-[0.99] desktop-hover:hover:tw-border-[#60606C] desktop-hover:hover:tw-bg-[#26272B]"
        >
          <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-text-sm tw-font-medium">
            <PlusIcon className="tw-size-4 tw-flex-shrink-0 tw-text-[#4f86ff]" />
            <span>Create group</span>
          </span>
          <ChevronRightIcon className="tw-size-4 tw-flex-shrink-0 tw-text-[#60606C] tw-transition tw-duration-200 tw-ease-out group-hover:tw-translate-x-0.5 group-hover:tw-text-[#93939F]" />
        </Link>
      );
    }

    return (
      <PrimaryButtonLink
        href="/network/groups"
        padding="tw-px-3 tw-py-2 tw-w-full"
      >
        <svg
          className="tw-h-5 tw-w-5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Create A Group</span>
      </PrimaryButtonLink>
    );
  }

  return (
    <div className="tw-inline-flex tw-w-full tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/5 tw-px-4 tw-py-3">
      <div className="tw-flex tw-items-center">
        <svg
          className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-self-center tw-text-primary-300"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        <div className="tw-ml-3 tw-self-center">
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-primary-300">
            {noProfileTitle}
          </p>
        </div>
      </div>
    </div>
  );
}
