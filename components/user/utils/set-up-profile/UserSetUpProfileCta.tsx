"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import Link from "next/link";

interface UserSetUpProfileCtaProps {
  readonly className?: string | undefined;
}

interface UserSetUpProfileCtaVisibilityInput {
  readonly address?: string | null | undefined;
  readonly connectedProfileHandle?: string | null | undefined;
  readonly fetchingProfile?: boolean | undefined;
  readonly hasValidWalletAuth?: boolean | undefined;
}

export function shouldShowUserSetUpProfileCta({
  address,
  connectedProfileHandle,
  fetchingProfile,
  hasValidWalletAuth,
}: UserSetUpProfileCtaVisibilityInput): boolean {
  return Boolean(
    !fetchingProfile &&
      hasValidWalletAuth !== false &&
      !connectedProfileHandle &&
      address
  );
}

export default function UserSetUpProfileCta({
  className,
}: UserSetUpProfileCtaProps) {
  const { connectedProfile, fetchingProfile } = useContext(AuthContext);
  const { address, hasValidWalletAuth } = useSeizeConnectContext();

  const show = shouldShowUserSetUpProfileCta({
    address,
    connectedProfileHandle: connectedProfile?.handle,
    fetchingProfile,
    hasValidWalletAuth,
  });

  if (!show || !address) return null;

  const wrapperClassName =
    className === undefined
      ? "tailwind-scope tw-mr-3"
      : `tailwind-scope ${className}`.trim();

  return (
    <div className={wrapperClassName}>
      <Link href={`/${address.toLowerCase()}`}>
        <button className="tw-inline-flex tw-cursor-pointer tw-items-center tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-leading-6 tw-text-white tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-primary-500 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-300 hover:tw-bg-primary-600 hover:tw-ring-primary-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset">
          Create profile
        </button>
      </Link>
    </div>
  );
}
