"use client";

import {
  ArchiveBoxIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  LockClosedIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useId, type ComponentType, type SVGProps } from "react";
import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import ButtonLink from "@/components/utils/button/ButtonLink";
import { useConsolidationPolicy } from "@/hooks/useConsolidationPolicy";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhArrowLink from "../shared/TdhArrowLink";
import TdhSourcesNote from "../shared/TdhSourcesNote";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhPager from "../shared/TdhPager";
import TdhSubnav from "../shared/TdhSubnav";
import {
  TDH_DROPDOWN_ROW,
  TDH_H1,
  TDH_LINK,
  TDH_PAGE,
  TDH_PAGE_HEADER_TOP,
} from "../shared/tdhStyles";
import { TDHRelatedLinks } from "../TDHPageNavigation";
import TDHSection, { TDH_PANEL, TDH_TEXT } from "../TDHSection";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const GUIDED_SETUP_HREF = "/safe-collecting/build-consolidation";
const SAFE_COLLECTING_HREF = "/safe-collecting";
const DESIGN_HREF = "/network/tdh/consolidation/design";

const BENEFITS = [
  { key: "cold", icon: LockClosedIcon },
  { key: "tdh", icon: ChartBarIcon },
  { key: "sets", icon: Squares2X2Icon },
  { key: "move", icon: ArrowsRightLeftIcon },
  { key: "old", icon: ArchiveBoxIcon },
  { key: "collection", icon: UserGroupIcon },
] as const satisfies readonly { readonly key: string; readonly icon: Icon }[];

// Each safe collecting role has a neutral icon of its own: no colour, so
// none reads as a status.
const WALLET_ROLES = [
  { key: "vault", icon: LockClosedIcon },
  { key: "transaction", icon: ArrowsRightLeftIcon },
  { key: "social", icon: ChatBubbleLeftRightIcon },
  { key: "old", icon: ArchiveBoxIcon },
] as const satisfies readonly { readonly key: string; readonly icon: Icon }[];

const STEPS = ["list", "sign", "done"] as const;
const BEFORE = ["keys", "merge", "public"] as const;
const CHANGES = ["add", "remove", "lost", "full"] as const;
/** The question the status line raises comes first; every answer is closed. */
const FAQ = [
  "limit",
  "cost",
  "move",
  "friend",
  "before",
  "profile",
  "order",
  "see",
  "expiry",
] as const;

function activationDate(
  locale: SupportedLocale,
  activationMs: number | undefined
) {
  if (activationMs === undefined)
    return t(locale, "network.tdhConsolidation.policy.pendingDate");
  return formatDate(locale, activationMs, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
    timeZone: "UTC",
  });
}

export default function TDHConsolidationPage() {
  const locale = useBrowserLocale();
  useSetTitle(t(locale, "network.tdhConsolidation.pageTitle"));
  const { policy, limits } = useConsolidationPolicy();
  const date = activationDate(locale, policy?.activationMs);
  const limit = limits ? formatInteger(locale, limits.maxWallets) : "";
  const pendingLimits = t(
    locale,
    "network.tdhConsolidation.policy.pendingLimits"
  );

  return (
    <div className={TDH_PAGE}>
      <AboutContentsDropdown
        className={TDH_DROPDOWN_ROW}
        currentHref="/network/tdh/consolidation"
        desktopFlush
        withDivider
      />
      <article className="tw-mx-auto tw-max-w-6xl tw-pb-8">
        <TdhSubnav current="/network/tdh/consolidation" locale={locale} />
        <header
          className={`tw-grid tw-grid-cols-1 tw-items-start tw-gap-8 tw-pb-10 lg:tw-grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:tw-gap-12 ${TDH_PAGE_HEADER_TOP}`}
        >
          <div>
            <h1 className={TDH_H1}>
              {t(locale, "network.tdhConsolidation.title")}
            </h1>
            <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-200 sm:tw-text-lg sm:tw-leading-8">
              {t(locale, "network.tdhConsolidation.lead")}
            </p>
            {/* One line on the limit: up to three as before, a fourth only
                with fresh links, counted alike by 6529.io and TDH v1.4
                (D136). Information, not a warning. */}
            <p
              id="consolidation-status"
              className="tw-mb-0 tw-mt-4 tw-scroll-mt-28 tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-500 tw-bg-iron-900/60 tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-leading-6 tw-text-iron-200"
            >
              {limits
                ? t(locale, "network.tdhConsolidation.status", { limit, date })
                : pendingLimits}
            </p>
            <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-3">
              <ButtonLink href={GUIDED_SETUP_HREF} variant="primary" size="lg">
                {t(locale, "network.tdhConsolidation.cta")}
                <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
              </ButtonLink>
              <TdhArrowLink href={SAFE_COLLECTING_HREF}>
                {t(locale, "network.tdhConsolidation.safeCollectingLink")}
              </TdhArrowLink>
            </div>
            <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(locale, "network.tdhConsolidation.nothingMoves")}
            </p>
          </div>
          <div>
            <WalletsFigure locale={locale} />
            <TdhArrowLink href="#consolidation-wallets" className="tw-mt-2">
              {t(locale, "network.tdhConsolidation.figure.rolesLink")}
            </TdhArrowLink>
          </div>
        </header>

        <TDHSection
          id="consolidation-benefits"
          title={t(locale, "network.tdhConsolidation.benefits.title")}
          description={t(
            locale,
            "network.tdhConsolidation.benefits.description"
          )}
        >
          <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 sm:tw-grid-cols-2">
            {BENEFITS.map(({ key, icon: BenefitIcon }) => (
              <li key={key} className={`${TDH_PANEL} tw-flex tw-gap-4 tw-p-5`}>
                <span className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800/80 tw-text-iron-100">
                  <BenefitIcon aria-hidden="true" className="tw-size-5" />
                </span>
                <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
                  <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
                    {t(
                      locale,
                      `network.tdhConsolidation.benefits.${key}.title`
                    )}
                  </h3>
                  <p className={`${TDH_TEXT} tw-mt-1.5`}>
                    {t(locale, `network.tdhConsolidation.benefits.${key}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <TdhArrowLink
            href="/network/tdh/how-it-works#step-10"
            className="tw-mt-4"
          >
            {t(locale, "network.tdhConsolidation.benefits.ruleLink")}
          </TdhArrowLink>
          <TdhSourcesNote
            locale={locale}
            refs={["P26 §6.3", "P26 §7.1", "P26 §7.3", "DEV-10", "D121"]}
          />
        </TDHSection>

        <TDHSection
          id="consolidation-wallets"
          title={t(locale, "network.tdhConsolidation.wallets.title")}
          description={t(
            locale,
            "network.tdhConsolidation.wallets.description"
          )}
        >
          <ul className={`${TDH_PANEL} tw-m-0 tw-list-none tw-p-0`}>
            {WALLET_ROLES.map(({ key, icon: RoleIcon }) => (
              <li
                key={key}
                className="tw-flex tw-gap-4 tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-5 tw-py-4 last:tw-border-b-0"
              >
                <RoleIcon
                  aria-hidden="true"
                  className="tw-mt-1 tw-size-5 tw-flex-shrink-0 tw-text-iron-400"
                />
                <div className="tw-min-w-0">
                  <p className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-100">
                    {t(locale, `network.tdhConsolidation.figure.${key}`)}
                  </p>
                  <p className={`${TDH_TEXT} tw-mt-0.5`}>
                    {t(locale, `network.tdhConsolidation.wallets.${key}`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <TdhArrowLink href={SAFE_COLLECTING_HREF} className="tw-mt-2">
            {t(locale, "network.tdhConsolidation.wallets.more")}
          </TdhArrowLink>
        </TDHSection>

        <TDHSection
          id="consolidation-steps"
          title={t(locale, "network.tdhConsolidation.steps.title")}
          description={t(locale, "network.tdhConsolidation.steps.description")}
        >
          <ol className="tw-m-0 tw-list-none tw-space-y-5 tw-p-0">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className="tw-grid tw-grid-cols-[2.25rem_minmax(0,1fr)] tw-gap-4"
              >
                <span className="tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-100 tw-text-sm tw-font-semibold tw-text-iron-950">
                  {formatInteger(locale, index + 1)}
                </span>
                <div className="tw-min-w-0 tw-pt-1">
                  <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
                    {t(locale, `network.tdhConsolidation.steps.${step}.title`)}
                  </h3>
                  <p className={`${TDH_TEXT} tw-mt-1`}>
                    {!limits && step === "list"
                      ? pendingLimits
                      : t(
                          locale,
                          `network.tdhConsolidation.steps.${step}.body`,
                          {
                            limit,
                          }
                        )}
                    {limits && step === "list" && (
                      <>
                        {" "}
                        <a href="#consolidation-status" className={TDH_LINK}>
                          {t(
                            locale,
                            "network.tdhConsolidation.steps.list.note"
                          )}
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="tw-mb-0 tw-mt-6 tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-600 tw-pl-4 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "network.tdhConsolidation.steps.order")}
          </p>
          <ButtonLink
            href={GUIDED_SETUP_HREF}
            variant="primary"
            size="lg"
            className="tw-mt-6"
          >
            {t(locale, "network.tdhConsolidation.cta")}
            <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
          </ButtonLink>
        </TDHSection>

        <TDHSection
          id="consolidation-before"
          title={t(locale, "network.tdhConsolidation.before.title")}
        >
          {/* Three short cards across the column, the width of the lists
              around them. */}
          <ul className="tw-m-0 tw-grid tw-list-none tw-gap-4 tw-p-0 md:tw-grid-cols-3">
            {BEFORE.map((key) => (
              <li key={key} className={`${TDH_PANEL} tw-p-5`}>
                {/* The point in one bold line, the detail under it. */}
                <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
                  {t(locale, `network.tdhConsolidation.before.${key}.title`)}
                </h3>
                <p className={`${TDH_TEXT} tw-mt-1.5`}>
                  {t(locale, `network.tdhConsolidation.before.${key}.body`)}
                </p>
              </li>
            ))}
          </ul>
        </TDHSection>

        <TDHSection
          id="consolidation-change"
          title={t(locale, "network.tdhConsolidation.change.title")}
        >
          <ul className="tw-m-0 tw-list-disc tw-space-y-3 tw-pl-5 marker:tw-text-iron-500">
            {CHANGES.map((key) => (
              <li key={key} className={TDH_TEXT}>
                {t(locale, `network.tdhConsolidation.change.${key}`)}
              </li>
            ))}
          </ul>
        </TDHSection>

        <TDHSection
          id="consolidation-faq"
          title={t(locale, "network.tdhConsolidation.faq.title")}
        >
          <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
            {FAQ.map((key) => (
              <TdhDisclosure
                key={key}
                tone="strong"
                className="tw-py-1"
                summary={t(locale, `network.tdhConsolidation.faq.${key}.title`)}
              >
                <p className={`${TDH_TEXT} tw-pb-4 tw-pl-6`}>
                  {!limits && key === "limit"
                    ? pendingLimits
                    : t(locale, `network.tdhConsolidation.faq.${key}.body`, {
                        date,
                        limit,
                      })}
                </p>
              </TdhDisclosure>
            ))}
          </div>
        </TDHSection>

        <TDHSection
          id="consolidation-under"
          title={t(locale, "network.tdhConsolidation.under.title")}
          description={t(locale, "network.tdhConsolidation.under.intro")}
        >
          <TDHRelatedLinks
            variant="list"
            links={[
              {
                href: DESIGN_HREF,
                title: t(locale, "network.tdhConsolidation.under.link"),
                description: t(
                  locale,
                  "network.tdhConsolidation.under.description"
                ),
              },
              ...(
                [
                  ["/network/tdh", "tdh"],
                  ["/safe-collecting/consolidation-use-cases", "guide"],
                  ["/safe-collecting/wallet-checker", "checker"],
                  [SAFE_COLLECTING_HREF, "center"],
                ] as const
              ).map(([href, key]) => ({
                href,
                title: t(
                  locale,
                  `network.tdhConsolidation.related.${key}.title`
                ),
                description: t(
                  locale,
                  `network.tdhConsolidation.related.${key}.description`
                ),
              })),
            ]}
          />
        </TDHSection>

        <TdhPager current="/network/tdh/consolidation" locale={locale} />
      </article>
    </div>
  );
}

function WalletsFigure({ locale }: { readonly locale: SupportedLocale }) {
  const captionId = useId();
  return (
    <figure
      aria-labelledby={captionId}
      className={`${TDH_PANEL} tw-m-0 tw-p-5 sm:tw-p-6`}
    >
      <figcaption id={captionId} className="tw-sr-only">
        {t(locale, "network.tdhConsolidation.figure.label")}
      </figcaption>
      <div
        aria-hidden="true"
        className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-4 xl:tw-grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
      >
        {/* One row a wallet, 44 px each: a list on phones, two columns
            from sm, one column again beside the collector from xl. */}
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-2 tw-p-0 sm:tw-grid-cols-2 xl:tw-grid-cols-1">
          {WALLET_ROLES.map(({ key, icon: RoleIcon }) => (
            <li
              key={key}
              className="tw-flex tw-min-h-11 tw-flex-wrap tw-items-center tw-gap-x-2.5 tw-gap-y-0.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2"
            >
              <RoleIcon className="tw-size-4 tw-flex-shrink-0 tw-text-iron-400" />
              <span className="tw-text-sm tw-text-iron-200">
                {t(locale, `network.tdhConsolidation.figure.${key}`)}
              </span>
              {/* Beside the name when it fits, under it when not. */}
              {key === "old" && (
                <span className="tw-ml-auto tw-text-xs tw-text-iron-300">
                  {t(locale, "network.tdhConsolidation.figure.fourthTag")}
                </span>
              )}
            </li>
          ))}
        </ul>
        <ArrowRightIcon className="tw-hidden tw-size-5 tw-text-iron-500 xl:tw-block" />
        <ArrowDownIcon className="tw-mx-auto tw-size-5 tw-text-iron-500 xl:tw-hidden" />
        <div className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-500/[0.06] tw-p-4">
          <div className="tw-flex tw-items-center tw-gap-2.5">
            <UserCircleIcon className="tw-size-6 tw-text-primary-300" />
            <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
              {t(locale, "network.tdhConsolidation.figure.collector")}
            </span>
          </div>
          <ul className="tw-m-0 tw-mt-3 tw-list-none tw-space-y-2 tw-p-0">
            {(["profile", "tdh", "sets"] as const).map((point) => (
              <li
                key={point}
                className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200"
              >
                <CheckIcon className="tw-size-4 tw-flex-shrink-0 tw-text-success" />
                {t(locale, `network.tdhConsolidation.figure.point.${point}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}
