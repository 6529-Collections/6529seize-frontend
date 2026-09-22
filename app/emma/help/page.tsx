import Link from "next/link";
import type { Metadata } from "next";
import DistributionPlanToolWrapper from "@/components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich } from "@/i18n/messages";

export default function EmmaHelpPage() {
  return (
    <DistributionPlanToolWrapper title={t(DEFAULT_LOCALE, "emma.helpTitle")}>
      <article
        aria-labelledby="emma-help-title"
        className="tw-max-w-3xl tw-space-y-6 tw-px-4 tw-py-8 tw-text-base tw-leading-relaxed tw-text-iron-300 sm:tw-px-6 lg:tw-px-8"
      >
        <Link
          href="/emma"
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-text-iron-300 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          {t(DEFAULT_LOCALE, "emma.back")}
        </Link>
        <h1
          id="emma-help-title"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-relaxed tw-text-white"
        >
          {t(DEFAULT_LOCALE, "emma.introduction")}
        </h1>
        <p>
          {tRich(DEFAULT_LOCALE, "emma.history", {
            janus: (
              <a
                key="janus"
                href="https://github.com/6529-Collections/Janus"
                target="_blank"
                rel="noopener noreferrer"
                className="tw-rounded tw-font-semibold tw-text-white tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                {t(DEFAULT_LOCALE, "emma.janusLink")}
              </a>
            ),
          })}
        </p>
        <p>{t(DEFAULT_LOCALE, "emma.community")}</p>
        <p>{t(DEFAULT_LOCALE, "emma.resources")}</p>
        <p>{t(DEFAULT_LOCALE, "emma.limited")}</p>
        <p>{t(DEFAULT_LOCALE, "emma.unlimited")}</p>
      </article>
    </DistributionPlanToolWrapper>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    title: t(DEFAULT_LOCALE, "emma.helpTitle"),
    description: t(DEFAULT_LOCALE, "emma.about"),
  });
}
