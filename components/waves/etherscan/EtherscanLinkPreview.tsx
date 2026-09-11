"use client";

import Link from "next/link";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import LinkPreviewCard from "../LinkPreviewCard";

export default function EtherscanLinkPreview({
  href,
}: {
  readonly href: string;
}) {
  const locale = useBrowserLocale();
  return (
    <LinkPreviewCard
      href={href}
      renderFallback={() => (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-iron-600 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "linkPreview.etherscan.open")}
        </Link>
      )}
    />
  );
}
