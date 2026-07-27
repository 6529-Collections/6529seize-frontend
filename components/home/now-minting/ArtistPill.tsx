"use client";

import { resolveIpfsUrl } from "@/components/ipfs/IPFSContext";
import { useIdentity } from "@/hooks/useIdentity";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

interface ArtistPillProps {
  readonly appearance?: "minimal" | "pill";
  readonly label: string;
  readonly href?: string | undefined;
  readonly pfp?: string | null | undefined;
  readonly profileHandle?: string | undefined;
}

export default function ArtistPill({
  appearance = "pill",
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
  const isMinimal = appearance === "minimal";
  const labelClassName = clsx(
    "tw-min-w-0 tw-truncate tw-font-medium",
    isMinimal
      ? "tw-text-sm tw-tracking-[-0.01em] tw-text-iron-400"
      : "tw-text-sm tw-text-iron-200",
    href &&
      "tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-100"
  );

  const content = (
    <span
      className={clsx(
        "tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center",
        isMinimal ? "tw-gap-2.5" : "tw-gap-2",
        !isMinimal &&
          "tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-2.5 tw-py-1 tw-backdrop-blur-sm"
      )}
    >
      {resolvedPfp ? (
        <Image
          src={resolveIpfsUrl(resolvedPfp)}
          alt={label}
          width={isMinimal ? 24 : 16}
          height={isMinimal ? 24 : 16}
          className={clsx(
            "tw-flex-shrink-0 tw-bg-iron-900 tw-object-contain",
            isMinimal
              ? "tw-size-6 tw-rounded-full tw-opacity-90"
              : "tw-size-4 tw-rounded-sm"
          )}
        />
      ) : (
        <span
          aria-hidden="true"
          className={clsx(
            "tw-flex-shrink-0 tw-bg-iron-900",
            isMinimal
              ? "tw-size-6 tw-rounded-full tw-opacity-90"
              : "tw-size-4 tw-rounded-sm"
          )}
        />
      )}
      <span className={labelClassName}>{label}</span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      className="tw-inline-flex tw-items-center tw-leading-none tw-no-underline"
    >
      {content}
    </Link>
  );
}
