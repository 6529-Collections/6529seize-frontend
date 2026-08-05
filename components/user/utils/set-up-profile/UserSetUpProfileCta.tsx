"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import ButtonLink from "@/components/utils/button/ButtonLink";

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
      <ButtonLink
        href={`/${address.toLowerCase()}`}
        variant="action"
        size="md"
      >
        Create profile
      </ButtonLink>
    </div>
  );
}
