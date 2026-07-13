"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function HomeNewcomerIntro() {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const { seizeConnectFresh, seizeConnectOpen } = useSeizeConnectContext();
  const [isOpeningWallet, setIsOpeningWallet] = useState(false);
  const isConnectBusy = isOpeningWallet || seizeConnectOpen;

  const handleConnect = async (): Promise<void> => {
    setIsOpeningWallet(true);
    try {
      await seizeConnectFresh();
    } catch (error) {
      console.error("Failed to open wallet connection", error);
      setToast({
        message: t(locale, "home.newcomer.connectFailed"),
        type: "error",
      });
    } finally {
      setIsOpeningWallet(false);
    }
  };

  return (
    <>
      <section
        aria-labelledby="home-newcomer-title"
        className="tw-px-4 tw-pb-10 tw-pt-3 md:tw-mx-auto md:tw-max-w-3xl md:tw-px-6 md:tw-pb-12 md:tw-text-center lg:tw-px-8"
      >
        <h2 id="home-newcomer-title" className="tw-sr-only">
          {t(locale, "home.newcomer.title")}
        </h2>
        <p className="tw-m-0 tw-max-w-2xl tw-text-pretty tw-text-base tw-leading-7 tw-text-iron-300 md:tw-mx-auto md:tw-text-lg">
          {t(locale, "home.newcomer.description")}
        </p>
        <div className="tw-mt-5 tw-flex tw-flex-wrap tw-gap-2 md:tw-justify-center">
          <Link
            href="/join-6529"
            className="tw-inline-flex tw-min-h-11 tw-min-w-32 tw-flex-1 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-black tw-no-underline tw-transition-colors focus:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/70 desktop-hover:hover:tw-border-iron-200 desktop-hover:hover:tw-bg-iron-200 desktop-hover:hover:tw-text-black desktop-hover:hover:tw-no-underline md:tw-flex-none"
          >
            <span>{t(locale, "home.newcomer.startAction")}</span>
            <ArrowRightIcon
              aria-hidden="true"
              className="tw-size-4 tw-flex-shrink-0"
            />
          </Link>
          <button
            type="button"
            aria-busy={isConnectBusy}
            disabled={isConnectBusy}
            onClick={() => {
              void handleConnect();
            }}
            className="tw-inline-flex tw-min-h-11 tw-min-w-32 tw-flex-1 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/30 disabled:tw-cursor-wait disabled:tw-opacity-70 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-50 md:tw-flex-none"
          >
            {t(
              locale,
              isConnectBusy
                ? "join6529.action.connecting"
                : "home.newcomer.connectAction"
            )}
          </button>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="tw-sr-only"
            role="status"
          >
            {isConnectBusy ? t(locale, "join6529.action.connecting") : ""}
          </span>
        </div>
      </section>

      <section
        aria-labelledby="home-activity-title"
        className="tw-px-4 tw-pb-5 md:tw-px-6 lg:tw-px-8"
      >
        <div className="tw-flex tw-items-center tw-gap-3">
          <h2
            id="home-activity-title"
            className="tw-m-0 tw-flex-shrink-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-400"
          >
            {t(locale, "home.newcomer.activityTitle")}
          </h2>
          <div
            aria-hidden="true"
            className="tw-h-px tw-flex-1 tw-bg-white/10"
          />
        </div>
      </section>
    </>
  );
}
