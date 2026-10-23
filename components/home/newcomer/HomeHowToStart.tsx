"use client";

import {
  ArrowRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  HOME_ACTION_ARROW_CLASSES,
  HOME_SECTION_TITLE_CLASSES,
  HOME_TEXT_LINK_CLASSES,
} from "../homeInteractionStyles";
import { useHomeWalletConnect } from "./useHomeWalletConnect";

export default function HomeHowToStart() {
  const locale = useBrowserLocale();
  const { hideNftPurchasing } = useNftPurchasingVisibility();
  const { isConnectBusy, handleConnect } = useHomeWalletConnect();
  const steps = [
    {
      id: "wallet",
      title: t(locale, "home.start.wallet.title"),
      description: t(locale, "home.start.wallet.description"),
      action: t(
        locale,
        isConnectBusy
          ? "join6529.action.connecting"
          : "home.newcomer.connectAction"
      ),
      href: null,
    },
    {
      id: "profile",
      title: t(locale, "home.start.profile.title"),
      description: t(locale, "home.start.profile.description"),
      action: t(locale, "home.start.profile.title"),
      href: "/join-6529#join-step-profile",
    },
    {
      id: "create",
      title: t(locale, "home.start.create.title"),
      description: t(
        locale,
        hideNftPurchasing
          ? "home.start.create.browseDescription"
          : "home.start.create.description"
      ),
      action: t(locale, "home.start.create.action"),
      href: "/the-memes",
    },
    {
      id: "community",
      title: t(locale, "home.start.community.title"),
      description: t(locale, "home.start.community.description"),
      action: t(locale, "home.whatIs.waves.action"),
      href: "/waves",
    },
  ];

  return (
    <section
      aria-labelledby="home-start-heading"
      className="tw-px-4 tw-pt-20 md:tw-px-6 md:tw-pt-32 lg:tw-px-8"
    >
      <div className="tw-mx-auto tw-max-w-[1200px]">
        <div className="tw-mb-8 tw-flex tw-flex-col tw-items-start tw-gap-3 md:tw-mb-10 md:tw-flex-row md:tw-items-end md:tw-justify-between md:tw-gap-6">
          <div>
            <h2 id="home-start-heading" className={HOME_SECTION_TITLE_CLASSES}>
              {t(locale, "home.start.title")}
            </h2>
            <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-relaxed tw-text-iron-400 md:tw-text-[15px]">
              {t(locale, "home.start.description")}
            </p>
          </div>
          <Link href="/join-6529" className={HOME_TEXT_LINK_CLASSES}>
            {t(locale, "home.start.guide")}
            <ArrowRightIcon aria-hidden className={HOME_ACTION_ARROW_CLASSES} />
          </Link>
        </div>
        <ol
          role="list"
          className="tw-m-0 tw-grid tw-list-none tw-gap-7 tw-p-0 md:tw-grid-cols-4 md:tw-gap-9"
        >
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="tw-group/step tw-relative tw-grid tw-grid-cols-[40px_minmax(0,1fr)] tw-gap-x-[18px] md:tw-flex md:tw-flex-col"
            >
              <span
                aria-hidden
                className="tw-absolute tw-bottom-[-28px] tw-left-5 tw-top-10 tw-w-px tw-bg-iron-800 group-last/step:tw-hidden md:tw-bottom-auto md:tw-left-10 md:tw-right-[-36px] md:tw-top-5 md:tw-h-px md:tw-w-auto"
              />
              <span
                aria-hidden
                className={`tw-relative tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-text-xs tw-font-semibold ${index === 0 ? "tw-border-iron-50 tw-bg-iron-50 tw-text-iron-950" : "tw-border-iron-800 tw-bg-black tw-text-iron-400"}`}
              >
                {formatInteger(locale, index + 1)}
              </span>
              <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col md:tw-mt-7">
                <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-tracking-[-0.02em] tw-text-iron-100">
                  {step.title}
                </h3>
                <p className="tw-mb-4 tw-mt-2 tw-text-[13px] tw-leading-relaxed tw-text-iron-400">
                  {step.description}
                </p>
                {step.href ? (
                  <Link
                    href={step.href}
                    className={`${HOME_TEXT_LINK_CLASSES} tw-mt-auto`}
                  >
                    {step.action}
                    <ArrowRightIcon
                      aria-hidden
                      className={HOME_ACTION_ARROW_CLASSES}
                    />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={isConnectBusy}
                    aria-busy={isConnectBusy}
                    onClick={() => {
                      void handleConnect();
                    }}
                    className={`${HOME_TEXT_LINK_CLASSES} tw-mt-auto disabled:tw-cursor-wait disabled:tw-opacity-60`}
                  >
                    {step.action}
                    <ArrowRightIcon
                      aria-hidden
                      className={HOME_ACTION_ARROW_CLASSES}
                    />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
        <p className="tw-mb-0 tw-mt-8 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-leading-relaxed tw-text-iron-400 md:tw-mt-10">
          <span className="tw-inline-flex tw-items-center tw-gap-2">
            <InformationCircleIcon
              aria-hidden
              className="tw-size-4 tw-shrink-0"
            />
            {t(locale, "home.start.browseFirst")}
          </span>
          <Link href="/join-6529#faq" className={HOME_TEXT_LINK_CLASSES}>
            {t(locale, "home.start.faq")}
            <ArrowRightIcon aria-hidden className={HOME_ACTION_ARROW_CLASSES} />
          </Link>
        </p>
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="tw-sr-only"
        >
          {isConnectBusy ? t(locale, "join6529.action.connecting") : ""}
        </span>
      </div>
    </section>
  );
}
