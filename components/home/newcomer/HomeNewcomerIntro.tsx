"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Button from "@/components/utils/button/Button";
import ButtonLink from "@/components/utils/button/ButtonLink";
import { HOME_ACTION_ARROW_CLASSES } from "../homeInteractionStyles";

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
      data-home-section="Get started"
      aria-labelledby="home-newcomer-title"
      className="tw-px-4 tw-pb-2 md:tw-px-6 md:tw-pb-4 lg:tw-px-8"
    >
      <h2 id="home-newcomer-title" className="tw-sr-only">
        {t(locale, "home.newcomer.title")}
      </h2>
      <div className="tw-grid tw-grid-cols-2 tw-gap-2.5 md:tw-flex md:tw-flex-wrap md:tw-gap-3 desktop-hover:[&>button:hover]:tw-border-white/30 desktop-hover:[&>button:hover]:tw-bg-white/[0.08] [&>button]:tw-border-white/20 [&>button]:tw-bg-white/[0.04]">
        <ButtonLink
          data-home-action="Get started"
          href="/join-6529"
          size="lg"
          className="tw-group/action tw-min-w-32 tw-flex-1 motion-reduce:tw-transition-none max-md:tw-min-h-12 md:tw-flex-none"
        >
          <span>{t(locale, "home.newcomer.startAction")}</span>
          <ArrowRightIcon
            aria-hidden="true"
            className={HOME_ACTION_ARROW_CLASSES}
          />
        </ButtonLink>
        <Button
          data-home-action="Connect wallet"
          variant="secondary"
          size="lg"
          loading={isConnectBusy}
          disabled={isConnectBusy}
          onClick={() => {
            void handleConnect();
          }}
          className="tw-min-w-32 tw-flex-1 motion-reduce:tw-transition-none max-md:tw-min-h-12 md:tw-flex-none"
        >
          {t(
            locale,
            isConnectBusy
              ? "join6529.action.connecting"
              : "home.newcomer.connectAction"
          )}
        </Button>
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
