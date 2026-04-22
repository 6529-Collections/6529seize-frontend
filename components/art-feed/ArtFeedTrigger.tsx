"use client";

import DiscoverIcon from "@/components/common/icons/DiscoverIcon";
import Link from "next/link";
import { ART_FEED_HREF } from "./artFeed.constants";

interface ArtFeedTriggerProps {
  readonly variant?: "compact" | "panel" | undefined;
}

export default function ArtFeedTrigger({
  variant = "compact",
}: ArtFeedTriggerProps) {
  const className =
    variant === "panel"
      ? "tw-inline-flex tw-w-12 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-text-iron-300 tw-no-underline tw-transition-colors desktop-hover:hover:tw-border-primary-400/35 desktop-hover:hover:tw-bg-primary-500/10 desktop-hover:hover:tw-text-primary-300"
      : "tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-2.5 tw-py-2 tw-text-iron-300 tw-no-underline tw-transition-colors desktop-hover:hover:tw-border-primary-400/35 desktop-hover:hover:tw-bg-primary-500/10 desktop-hover:hover:tw-text-primary-300";

  return (
    <Link
      href={ART_FEED_HREF}
      prefetch={false}
      aria-label="Open ART feed"
      title="ART feed"
      className={className}
    >
      <DiscoverIcon className="tw-size-4 tw-flex-shrink-0" />
      <span className="tw-sr-only">ART feed</span>
    </Link>
  );
}
