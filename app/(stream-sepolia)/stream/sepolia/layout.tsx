import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { InstanceSwitch } from "@/components/stream-sepolia/InstanceSwitch";
import { RefundBanner } from "@/components/stream-sepolia/RefundBanner";
import { TxResultBar } from "@/components/stream-sepolia/TxResultBar";
import { StreamNav } from "@/components/stream-sepolia/StreamNav";
import { publicEnv } from "@/config/env";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";

/**
 * The 6529 Stream Sepolia test pages. They exist only where the site's wallet
 * stack includes Sepolia (staging and local testing), never in production.
 */
export default function StreamSepoliaLayout({ children }: { readonly children: ReactNode }) {
  if (publicEnv.DROP_FORGE_TESTNET !== true) {
    notFound();
  }
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-[#0D0D0F] tw-pb-16 tw-text-iron-100">
      <div
        role="note"
        className="tw-border-0 tw-border-b tw-border-solid tw-border-amber-400/20 tw-bg-amber-400/[0.06] tw-px-4 tw-py-2 tw-text-center tw-text-[13px] tw-text-amber-200"
      >
        {t(DEFAULT_LOCALE, "streamSepolia.notice")}
      </div>
      <div className="tw-mx-auto tw-max-w-6xl tw-px-4 sm:tw-px-6 lg:tw-px-8">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-pt-6 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
          <p className="tw-m-0 tw-pb-3 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-400 sm:tw-pb-2.5">
            {t(DEFAULT_LOCALE, "streamSepolia.eyebrow")}
          </p>
          <StreamNav />
        </div>
        <div className="tw-pt-8">
          <InstanceSwitch />
          <RefundBanner />
          <TxResultBar />
          {children}
        </div>
      </div>
    </main>
  );
}
