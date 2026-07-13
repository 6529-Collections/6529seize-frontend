"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";

const NEWCOMER_VALUE_PROPS = [
  {
    titleKey: "home.newcomer.value.coordinate.title",
    bodyKey: "home.newcomer.value.coordinate.body",
  },
  {
    titleKey: "home.newcomer.value.decide.title",
    bodyKey: "home.newcomer.value.decide.body",
  },
  {
    titleKey: "home.newcomer.value.collect.title",
    bodyKey: "home.newcomer.value.collect.body",
  },
] as const satisfies ReadonlyArray<{
  readonly titleKey: MessageKey;
  readonly bodyKey: MessageKey;
}>;

export default function HomeNewcomerIntro() {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const { seizeConnectFresh, seizeConnectOpen } = useSeizeConnectContext();

  const handleConnect = async (): Promise<void> => {
    try {
      await seizeConnectFresh();
    } catch (error) {
      console.error("Failed to open wallet connection", error);
      setToast({
        message: t(locale, "home.mintSubscriptions.connectFailed"),
        type: "error",
      });
    }
  };

  return (
    <>
      <section
        aria-labelledby="home-newcomer-title"
        className="tw-mt-8 tw-border-x-0 tw-border-y tw-border-solid tw-border-white/10 tw-bg-iron-950/45 md:tw-mt-10"
      >
        <div className="tw-mx-auto tw-max-w-5xl tw-px-4 tw-py-9 sm:tw-px-6 sm:tw-py-11 lg:tw-px-8">
          <p className="tw-mb-3 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-[0.16em] tw-text-iron-500">
            {t(locale, "home.newcomer.eyebrow")}
          </p>
          <div className="tw-grid tw-grid-cols-1 tw-gap-8 lg:tw-grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:tw-gap-12">
            <div>
              <h2
                id="home-newcomer-title"
                className="tw-m-0 tw-max-w-2xl tw-text-balance tw-text-[2rem] tw-font-medium tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
              >
                {t(locale, "home.newcomer.title")}
              </h2>
              <p className="tw-mb-0 tw-mt-4 tw-max-w-2xl tw-text-pretty tw-text-base tw-leading-7 tw-text-iron-400 sm:tw-text-lg">
                {t(locale, "home.newcomer.description")}
              </p>
              <div className="tw-mt-7 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row">
                <Link
                  href="/join-6529"
                  className="tw-inline-flex tw-min-h-12 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-black tw-no-underline tw-transition-colors focus:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/70 desktop-hover:hover:tw-border-iron-200 desktop-hover:hover:tw-bg-iron-200 desktop-hover:hover:tw-text-black desktop-hover:hover:tw-no-underline"
                >
                  <span>{t(locale, "home.newcomer.startAction")}</span>
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="tw-size-4 tw-flex-shrink-0"
                  />
                </Link>
                <button
                  type="button"
                  aria-busy={seizeConnectOpen}
                  disabled={seizeConnectOpen}
                  onClick={() => {
                    void handleConnect();
                  }}
                  className="tw-inline-flex tw-min-h-12 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/30 disabled:tw-cursor-wait disabled:tw-opacity-70 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-50"
                >
                  {t(
                    locale,
                    seizeConnectOpen
                      ? "join6529.action.connecting"
                      : "home.newcomer.connectAction"
                  )}
                </button>
              </div>
              <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-500">
                {t(locale, "home.newcomer.browseNote")}
              </p>
            </div>

            <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-5 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-p-0 tw-pt-6 sm:tw-grid-cols-3 lg:tw-grid-cols-1 lg:tw-border-l lg:tw-border-t-0 lg:tw-pl-8 lg:tw-pt-0">
              {NEWCOMER_VALUE_PROPS.map(({ titleKey, bodyKey }) => (
                <li key={titleKey}>
                  <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-100">
                    {t(locale, titleKey)}
                  </p>
                  <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-500">
                    {t(locale, bodyKey)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="home-activity-title"
        className="tw-px-4 tw-pb-2 tw-pt-10 md:tw-px-6 md:tw-pt-14 lg:tw-px-8"
      >
        <p className="tw-mb-2 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-[0.16em] tw-text-iron-500">
          {t(locale, "home.newcomer.activityEyebrow")}
        </p>
        <h2
          id="home-activity-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100 md:tw-text-3xl"
        >
          {t(locale, "home.newcomer.activityTitle")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-500">
          {t(locale, "home.newcomer.activityDescription")}
        </p>
      </section>
    </>
  );
}
