"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { formatInteger } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import {
  HOME_ACTION_ARROW_CLASSES,
  HOME_SECTION_TITLE_CLASSES,
  HOME_TEXT_LINK_CLASSES,
} from "../homeInteractionStyles";
import { useHomeWalletConnect } from "./useHomeWalletConnect";

const STEP_ACTION_CLASSES =
  "tw-group/action tw-inline-flex tw-min-h-10 tw-max-w-full tw-items-center tw-gap-2 tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-base tw-font-semibold tw-leading-6 tw-tracking-[-0.02em] tw-text-iron-100 tw-no-underline tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-4 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none";

const STEP_INLINE_LINK_CLASSES =
  "tw-rounded-sm tw-text-iron-300 tw-underline tw-decoration-iron-600 tw-underline-offset-4 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none";

export default function HomeHowToStart() {
  const locale = useBrowserLocale();
  const { hideNftPurchasing } = useNftPurchasingVisibility();
  const { isConnectBusy, handleConnect } = useHomeWalletConnect();
  const steps = [
    {
      id: "wallet",
      trackingAction: "Connect wallet",
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
      trackingAction: "Create profile",
      title: t(locale, "home.start.profile.title"),
      description: t(locale, "home.start.profile.description"),
      action: t(locale, "home.start.profile.title"),
      href: "/join-6529#join-step-profile",
    },
    {
      id: "community",
      trackingAction: "Browse Waves",
      title: t(locale, "home.start.community.title"),
      description: t(locale, "home.start.community.description"),
      action: t(locale, "home.whatIs.waves.action"),
      href: "/waves",
    },
    {
      id: "create",
      trackingAction: "View collections",
      title: t(locale, "home.start.create.title"),
      description: hideNftPurchasing
        ? t(locale, "home.start.create.browseDescription")
        : tRich(locale, "home.start.create.description", {
            collect: (
              <Link
                key="collect"
                href="/the-memes"
                data-home-action="View collections"
                className={STEP_INLINE_LINK_CLASSES}
              >
                {t(locale, "home.start.create.collectLink")}
              </Link>
            ),
            create: (
              <Link
                key="create"
                href="/about/apply"
                data-home-action="About submissions"
                className={STEP_INLINE_LINK_CLASSES}
              >
                {t(locale, "home.start.create.submitLink")}
              </Link>
            ),
          }),
      action: t(locale, "home.start.create.title"),
      href: null,
    },
  ];

  return (
    <section
      aria-labelledby="home-start-heading"
      data-home-section="How to start"
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
          <Link
            href="/join-6529"
            data-home-action="Get started"
            className={HOME_TEXT_LINK_CLASSES}
          >
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
                className="tw-absolute tw-bottom-[-28px] tw-left-5 tw-top-10 tw-w-px tw-bg-iron-800/80 group-last/step:tw-hidden md:tw-bottom-auto md:tw-left-10 md:tw-right-[-36px] md:tw-top-5 md:tw-h-px md:tw-w-auto"
              />
              <span
                aria-hidden
                className={`tw-relative tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-text-xs tw-font-semibold ${index === 0 ? "tw-border-iron-50 tw-bg-iron-50 tw-text-iron-950" : "tw-border-iron-800 tw-bg-black tw-text-iron-400"}`}
              >
                {formatInteger(locale, index + 1)}
              </span>
              <div className="tw-min-w-0 md:tw-mt-6">
                <h3 className="tw-m-0">
                  {step.id === "create" && (
                    <span className="tw-flex tw-min-h-10 tw-items-center tw-text-base tw-font-semibold tw-leading-6 tw-tracking-[-0.02em] tw-text-iron-100">
                      {step.title}
                    </span>
                  )}
                  {step.href && (
                    <Link
                      href={step.href}
                      title={step.action}
                      data-home-action={step.trackingAction}
                      className={STEP_ACTION_CLASSES}
                    >
                      <span>{step.title}</span>
                      <ArrowRightIcon
                        aria-hidden
                        className={
                          HOME_ACTION_ARROW_CLASSES +
                          " tw-text-iron-500 group-focus-visible/action:tw-text-iron-300 desktop-hover:group-hover/action:tw-text-iron-300"
                        }
                      />
                    </Link>
                  )}
                  {step.id === "wallet" && (
                    <button
                      type="button"
                      data-home-action={step.trackingAction}
                      disabled={isConnectBusy}
                      aria-busy={isConnectBusy}
                      onClick={() => {
                        void handleConnect();
                      }}
                      className={
                        STEP_ACTION_CLASSES +
                        " disabled:tw-cursor-wait disabled:tw-opacity-60"
                      }
                    >
                      <span>{step.action}</span>
                      <ArrowRightIcon
                        aria-hidden
                        className={
                          HOME_ACTION_ARROW_CLASSES +
                          " tw-text-iron-500 group-focus-visible/action:tw-text-iron-300 desktop-hover:group-hover/action:tw-text-iron-300"
                        }
                      />
                    </button>
                  )}
                </h3>
                <p className="tw-mb-0 tw-mt-2 tw-text-pretty tw-text-[13px] tw-leading-relaxed tw-text-iron-400 md:tw-text-sm">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
