"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { isAddress } from "viem";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeMember } from "@/lib/e2ee/types";

interface E2eeProfileLinkProps {
  readonly member: E2eeMember | null;
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly avatar?: boolean | undefined;
}

/** Only locally resolved members can supply profile destinations. */
export function E2eeProfileLink({
  member,
  children,
  className,
  avatar = false,
}: E2eeProfileLinkProps) {
  const locale = useBrowserLocale();
  const handle = member?.handle?.trim();
  const hasHandle = (handle?.length ?? 0) > 0;
  const identity = hasHandle
    ? handle
    : member?.wallets.find((wallet) => isAddress(wallet));
  if (!identity) {
    return <span className={className}>{children}</span>;
  }
  const avatarLabel = hasHandle
    ? t(locale, "e2ee.profile.view", { name: handle ?? "" })
    : t(locale, "e2ee.profile.viewUnknown");
  return (
    <UserProfileTooltipWrapper user={identity}>
      <Link
        href={`/${encodeURIComponent(identity)}`}
        prefetch={false}
        aria-label={avatar ? avatarLabel : undefined}
        className={`${className ?? ""} tw-rounded-sm tw-text-inherit tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-300`}
      >
        {children}
      </Link>
    </UserProfileTooltipWrapper>
  );
}
