"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Button from "@/components/utils/button/Button";
import ButtonLink from "@/components/utils/button/ButtonLink";

import { useHomeWalletConnect } from "./useHomeWalletConnect";

export default function HomeNewcomerIntro() {
  const locale = useBrowserLocale();
  const { isConnectBusy, handleConnect } = useHomeWalletConnect();

  return (
    <section
      data-home-section="Get started"
      aria-labelledby="home-newcomer-title"
      className="tw-mt-7 md:tw-mt-8"
    >
      <h2 id="home-newcomer-title" className="tw-sr-only">
        {t(locale, "home.newcomer.title")}
      </h2>
      <div className="tw-grid tw-grid-cols-2 tw-gap-2.5 md:tw-flex md:tw-flex-wrap md:tw-gap-3">
        <Button
          data-home-action="Connect wallet"
          size="lg"
          loading={isConnectBusy}
          disabled={isConnectBusy}
          onClick={() => {
            void handleConnect();
          }}
          className="tw-min-w-0 tw-flex-1 motion-reduce:tw-transition-none max-md:tw-min-h-12 max-md:tw-px-2 max-md:tw-text-xs md:tw-flex-none"
        >
          {t(
            locale,
            isConnectBusy
              ? "join6529.action.connecting"
              : "home.newcomer.connectAction"
          )}
        </Button>
        <ButtonLink
          data-home-action="Get started"
          href="/join-6529"
          variant="secondary"
          size="lg"
          className="tw-min-w-0 tw-flex-1 motion-reduce:tw-transition-none max-md:tw-min-h-12 max-md:tw-px-2 max-md:tw-text-xs md:tw-flex-none"
        >
          {t(locale, "home.newcomer.startAction")}
        </ButtonLink>
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
