"use client";

import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
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
      ? "tw-text-sm tw-tracking-[-0.01em] tw-text-iron-50 group-data-[home-next-drop]/home-next-drop:tw-text-iron-300"
      : "tw-text-sm tw-text-iron-200",
    href &&
      "tw-transition-colors tw-duration-200 tw-ease-out group-focus-visible/artist:tw-text-white desktop-hover:group-hover/artist:tw-text-white motion-reduce:tw-transition-none"
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
          src={getScaledImageUri(resolvedPfp, ImageScale.W_AUTO_H_50)}
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
      data-home-action="Open artist profile"
      href={href}
      className="tw-group/artist tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-rounded-sm tw-leading-none tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
    >
      {content}
    </Link>
  );
}
