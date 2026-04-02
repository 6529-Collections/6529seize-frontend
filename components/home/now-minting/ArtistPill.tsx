"use client";

import { resolveIpfsUrl } from "@/components/ipfs/IPFSContext";
import { useIdentity } from "@/hooks/useIdentity";
import Image from "next/image";
import Link from "next/link";

interface ArtistPillProps {
  readonly label: string;
  readonly href?: string | undefined;
  readonly pfp?: string | null | undefined;
  readonly profileHandle?: string | undefined;
}

export default function ArtistPill({
  label,
  href,
  pfp,
  profileHandle,
}: ArtistPillProps) {
  const { profile } = useIdentity({
    handleOrWallet: profileHandle ?? "",
    initialProfile: null,
  });

  const resolvedPfp = pfp ?? profile?.pfp ?? null;
  const labelClassName = href
    ? "tw-min-w-0 tw-truncate tw-text-sm tw-font-medium tw-text-iron-200 tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-100"
    : "tw-min-w-0 tw-truncate tw-text-sm tw-font-medium tw-text-iron-200";

  const content = (
    <span className="tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-2.5 tw-py-1 tw-backdrop-blur-sm">
      {resolvedPfp ? (
        <Image
          src={resolveIpfsUrl(resolvedPfp)}
          alt={label}
          width={16}
          height={16}
          className="tw-size-4 tw-flex-shrink-0 tw-rounded-sm tw-bg-iron-900 tw-object-contain"
        />
      ) : (
        <span
          aria-hidden="true"
          className="tw-size-4 tw-flex-shrink-0 tw-rounded-sm tw-bg-iron-900"
        />
      )}
      <span className={labelClassName}>{label}</span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="tw-no-underline">
      {content}
    </Link>
  );
}
