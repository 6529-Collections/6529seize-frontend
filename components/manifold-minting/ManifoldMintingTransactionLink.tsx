"use client";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function ManifoldMintingTransactionLink({
  href,
}: Readonly<{ href: string }>) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-mt-2 tw-text-center">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="tw-inline-flex tw-min-h-11 tw-max-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-text-white focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
      >
        <span>{t(locale, "theMemes.mint.transaction.viewTransaction")}</span>
        <ArrowTopRightOnSquareIcon
          className="tw-size-4 tw-flex-none"
          aria-hidden="true"
        />
        <span className="tw-sr-only">
          {t(locale, "theMemes.mint.transaction.opensNewTab")}
        </span>
      </a>
    </div>
  );
}
