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
    <section
      aria-labelledby="home-newcomer-title"
      className="tw-px-4 tw-pb-10 tw-pt-4 md:tw-mx-auto md:tw-max-w-3xl md:tw-px-6 md:tw-pb-12 lg:tw-px-8"
    >
      <h2 id="home-newcomer-title" className="tw-sr-only">
        {t(locale, "home.newcomer.title")}
      </h2>
      <div className="tw-flex tw-flex-wrap tw-gap-2 md:tw-justify-center">
        <Link
          href="/join-6529"
          className="tw-inline-flex tw-min-h-11 tw-min-w-32 tw-flex-1 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-5 tw-py-2.5 tw-text-sm tw-font-medium tw-text-black tw-no-underline tw-transition-colors focus:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/70 desktop-hover:hover:tw-border-iron-200 desktop-hover:hover:tw-bg-iron-200 desktop-hover:hover:tw-text-black desktop-hover:hover:tw-no-underline md:tw-flex-none"
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
          className="tw-inline-flex tw-min-h-11 tw-min-w-32 tw-flex-1 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-5 tw-py-2.5 tw-text-sm tw-font-medium tw-text-iron-100 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/30 disabled:tw-cursor-wait disabled:tw-opacity-70 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-50 md:tw-flex-none"
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
  );
}
