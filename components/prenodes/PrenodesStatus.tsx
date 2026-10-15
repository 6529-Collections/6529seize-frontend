"use client";

import Link from "next/link";
import { NETWORK_PAGE_TITLE_CLASSES } from "@/components/network/networkPageLayoutClasses";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function PrenodesStatus() {
  const locale = useBrowserLocale();
  useSetTitle(t(locale, "network.prenodes.pageTitle"));

  return (
    <section>
      <h1 className={NETWORK_PAGE_TITLE_CLASSES}>
        {t(locale, "network.prenodes.title")}
      </h1>
      <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
        {t(locale, "network.prenodes.deprecation")}
      </p>
      <Link
        href="/about/6529-apps"
        className="hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        {t(locale, "network.prenodes.desktopLink")}
      </Link>
    </section>
  );
}
