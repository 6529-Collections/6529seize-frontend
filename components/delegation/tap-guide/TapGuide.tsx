"use client";

import {
  ArchiveBoxIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  CpuChipIcon,
  GiftIcon,
  KeyIcon,
  LockClosedIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { TDHRelatedLinks } from "@/app/network/tdh/TDHPageNavigation";
import TDHSection, {
  TDH_FOCUS,
  TDH_PANEL,
  TDH_TEXT,
} from "@/app/network/tdh/TDHSection";
import ButtonLink from "@/components/utils/button/ButtonLink";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useConsolidationPolicy } from "@/hooks/useConsolidationPolicy";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const TAP_GUIDE_SETUP_HREF = "/safe-collecting#safe-setup";
const COMBINE_GUIDE_HREF = "/network/tdh/consolidation";

const LINK = `tw-inline-flex tw-items-center tw-gap-1.5 tw-py-2 tw-text-sm tw-font-medium tw-text-primary-300 tw-no-underline tw-underline-offset-4 hover:tw-underline ${TDH_FOCUS}`;
const ICON_BOX =
  "tw-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg";
const NEUTRAL_ICON_BOX = `${ICON_BOX} tw-size-10 tw-bg-iron-800/80 tw-text-iron-100`;
const CARD_TITLE =
  "tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100";
const LABEL =
  "tw-text-xs tw-font-medium tw-uppercase tw-leading-5 tw-tracking-wider tw-text-iron-400";
const MUTED = "tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400";
const HIGHLIGHT_PANEL =
  "tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-500/[0.06] tw-p-5 sm:tw-p-6";

const SOCIAL_USE_RULE: MessageKey = "delegation.tapGuide.roles.social.rule.use";
const SOCIAL_USE_WITH_SUBSCRIPTIONS_RULE: MessageKey =
  "delegation.tapGuide.roles.social.rule.useWithSubscriptions";

interface Role {
  readonly key: "vault" | "transaction" | "social";
  readonly icon: Icon;
  readonly dot: string;
  readonly tone: string;
  readonly temperature: string;
  readonly rules: readonly MessageKey[];
}

// Each safe collecting role has a temperature: the vault is ice-cold, the
// transaction wallet warm and the social (hot) wallet hot. The colors match
// the wallet roles on the consolidation guide.
const ROLES: readonly Role[] = [
  {
    key: "vault",
    icon: LockClosedIcon,
    dot: "tw-bg-sky-400",
    tone: "tw-bg-sky-400/10 tw-text-sky-300",
    temperature: "tw-text-sky-300",
    rules: [
      "delegation.tapGuide.roles.vault.rule.never",
      "delegation.tapGuide.roles.vault.rule.transfers",
      "delegation.tapGuide.roles.vault.rule.mint",
      "delegation.tapGuide.roles.vault.rule.manager",
    ],
  },
  {
    key: "transaction",
    icon: ArrowsRightLeftIcon,
    dot: "tw-bg-amber-400",
    tone: "tw-bg-amber-400/10 tw-text-amber-300",
    temperature: "tw-text-amber-300",
    rules: [
      "delegation.tapGuide.roles.transaction.rule.marketplaces",
      "delegation.tapGuide.roles.transaction.rule.move",
      "delegation.tapGuide.roles.transaction.rule.manager",
    ],
  },
  {
    key: "social",
    icon: ChatBubbleLeftRightIcon,
    dot: "tw-bg-rose-400",
    tone: "tw-bg-rose-400/10 tw-text-rose-300",
    temperature: "tw-text-rose-300",
    rules: [
      SOCIAL_USE_RULE,
      "delegation.tapGuide.roles.social.rule.move",
      "delegation.tapGuide.roles.social.rule.noNfts",
    ],
  },
];

const LEVELS = ["good", "great"] as const;

const PLATFORM_ITEMS = [
  {
    key: "combine",
    icon: UserGroupIcon,
    href: "/safe-collecting/build-consolidation",
  },
  {
    key: "manager",
    icon: KeyIcon,
    href: "/safe-collecting/register-sub-delegation",
  },
  {
    key: "mint",
    icon: SparklesIcon,
    href: "/safe-collecting/register-delegation",
  },
  { key: "airdrops", icon: GiftIcon, href: TAP_GUIDE_SETUP_HREF },
] as const satisfies readonly {
  readonly key: string;
  readonly icon: Icon;
  readonly href: string;
}[];

const CAVEATS = [
  "manager",
  "revoke",
  "expiry",
  "lock",
  "signIn",
  "airdropAll",
] as const;

const LEARN_LINKS = [
  { key: "safe", href: "/safe-collecting/faq/using-safe" },
  { key: "faq", href: "/safe-collecting/faq" },
  { key: "checker", href: "/safe-collecting/wallet-checker" },
] as const;

export default function TapGuide() {
  const locale = useBrowserLocale();
  const { hideNftPurchasing } = useNftPurchasingVisibility();
  const { policy, limits } = useConsolidationPolicy();

  return (
    <article
      aria-labelledby="tap-guide-title"
      className="tw-w-full tw-max-w-6xl tw-pb-8"
    >
      <header className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-8 tw-pb-10 lg:tw-grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:tw-gap-12">
        <div className="tw-min-w-0">
          <h1
            id="tap-guide-title"
            className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
          >
            {t(locale, "delegation.tapGuide.title")}
          </h1>
          <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-200 sm:tw-text-lg sm:tw-leading-8">
            {t(locale, "delegation.tapGuide.lead")}
          </p>
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "delegation.tapGuide.why")}
          </p>
          <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-3">
            <ButtonLink href={TAP_GUIDE_SETUP_HREF} variant="primary" size="lg">
              {t(locale, "delegation.tapGuide.cta")}
              <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
            </ButtonLink>
            <Link className={LINK} href={COMBINE_GUIDE_HREF}>
              {t(locale, "delegation.tapGuide.combineLink")}
            </Link>
          </div>
        </div>
        <div className={HIGHLIGHT_PANEL}>
          <p className="tw-m-0 tw-flex tw-items-center tw-gap-2.5 tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-wider tw-text-primary-300">
            <ShieldCheckIcon aria-hidden="true" className="tw-size-5" />
            {t(locale, "delegation.tapGuide.rule.label")}
          </p>
          <p className="tw-mb-0 tw-mt-4 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50 sm:tw-text-xl sm:tw-leading-8">
            {t(locale, "delegation.tapGuide.rule.text")}
          </p>
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "delegation.tapGuide.rule.instead")}
          </p>
        </div>
      </header>

      <TDHSection
        id="tap-roles"
        title={t(locale, "delegation.tapGuide.roles.title")}
        description={t(locale, "delegation.tapGuide.roles.description")}
      >
        <ul className="tw-m-0 tw-list-none tw-space-y-4 tw-p-0">
          {ROLES.map((role) => (
            <RoleCard
              key={role.key}
              locale={locale}
              role={role}
              hideNftPurchasing={hideNftPurchasing}
            />
          ))}
        </ul>
      </TDHSection>

      <TDHSection
        id="tap-old-wallets"
        title={t(locale, "delegation.tapGuide.old.title")}
        description={t(locale, "delegation.tapGuide.old.description")}
      >
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 md:tw-grid-cols-2">
          <IconPanel
            icon={ArchiveBoxIcon}
            title={t(locale, "delegation.tapGuide.old.retire.title")}
          >
            <p className={`${TDH_TEXT} tw-mt-1.5`}>
              {t(locale, "delegation.tapGuide.old.retire.body")}
            </p>
            <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
              {limits
                ? t(locale, "delegation.tapGuide.old.retire.limit", {
                    limit: formatInteger(locale, limits.maxWallets),
                    date: fourthWalletDate(locale, policy?.activationMs),
                  })
                : t(locale, "network.tdhConsolidation.policy.pendingLimits")}
            </p>
          </IconPanel>
          <IconPanel
            icon={PaintBrushIcon}
            title={t(locale, "delegation.tapGuide.old.creators.title")}
          >
            <p className={`${TDH_TEXT} tw-mt-1.5`}>
              {t(locale, "delegation.tapGuide.old.creators.body")}
            </p>
          </IconPanel>
        </ul>
      </TDHSection>

      <TDHSection
        id="tap-hardware"
        title={t(locale, "delegation.tapGuide.hardware.title")}
        description={t(locale, "delegation.tapGuide.hardware.description")}
      >
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 md:tw-grid-cols-2">
          <IconPanel
            icon={CpuChipIcon}
            title={t(locale, "delegation.tapGuide.hardware.device.title")}
          >
            <p className={`${TDH_TEXT} tw-mt-1.5`}>
              {t(locale, "delegation.tapGuide.hardware.device.body")}
            </p>
          </IconPanel>
          <IconPanel
            icon={ShieldCheckIcon}
            title={t(locale, "delegation.tapGuide.hardware.tap.title")}
          >
            <p className={`${TDH_TEXT} tw-mt-1.5`}>
              {t(locale, "delegation.tapGuide.hardware.tap.body")}
            </p>
          </IconPanel>
        </ul>
        <p className="tw-mb-0 tw-mt-5 tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400 tw-pl-4 tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-100">
          {t(locale, "delegation.tapGuide.hardware.both")}
        </p>
      </TDHSection>

      <TDHSection
        id="tap-levels"
        title={t(locale, "delegation.tapGuide.levels.title")}
        description={t(locale, "delegation.tapGuide.levels.description")}
      >
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
          {LEVELS.map((level) => (
            <LevelCard key={level} level={level} locale={locale} />
          ))}
        </div>
      </TDHSection>

      <TDHSection
        id="tap-on-6529"
        title={t(locale, "delegation.tapGuide.platform.title")}
        description={t(locale, "delegation.tapGuide.platform.description")}
      >
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 md:tw-grid-cols-2">
          {PLATFORM_ITEMS.map(({ key, icon: ItemIcon, href }) => (
            <li key={key} className={`${TDH_PANEL} tw-flex tw-flex-col tw-p-5`}>
              <span className={NEUTRAL_ICON_BOX}>
                <ItemIcon aria-hidden="true" className="tw-size-5" />
              </span>
              <h3 className={`${CARD_TITLE} tw-mt-4`}>
                {t(locale, `delegation.tapGuide.platform.${key}.title`)}
              </h3>
              <p className={`${TDH_TEXT} tw-mt-1.5 tw-flex-1`}>
                {t(locale, `delegation.tapGuide.platform.${key}.body`)}
              </p>
              <Link className={`${LINK} tw-mt-2 tw-self-start`} href={href}>
                {t(locale, `delegation.tapGuide.platform.${key}.link`)}
                <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="tw-mb-0 tw-mt-5 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "delegation.tapGuide.platform.technical")}
        </p>
      </TDHSection>

      <TDHSection
        id="tap-worth-knowing"
        title={t(locale, "delegation.tapGuide.caveats.title")}
        description={t(locale, "delegation.tapGuide.caveats.description")}
      >
        <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
          {CAVEATS.map((key) => (
            <li key={key} className={`${TDH_PANEL} ${TDH_TEXT} tw-p-5`}>
              {t(locale, `delegation.tapGuide.caveats.${key}`)}
            </li>
          ))}
        </ul>
      </TDHSection>

      <TDHSection
        id="tap-learn-more"
        title={t(locale, "delegation.tapGuide.learn.title")}
      >
        <TDHRelatedLinks
          links={LEARN_LINKS.map(({ key, href }) => ({
            href,
            title: t(locale, `delegation.tapGuide.learn.${key}.title`),
            description: t(
              locale,
              `delegation.tapGuide.learn.${key}.description`
            ),
          }))}
        />
      </TDHSection>
    </article>
  );
}

// The start time comes from the backend's consolidation settings; while they
// load or if they are unavailable, the guide points to Guided Setup instead.
function fourthWalletDate(
  locale: SupportedLocale,
  activationMs: number | undefined
) {
  if (activationMs === undefined) {
    return t(locale, "delegation.tapGuide.old.retire.pendingDate");
  }
  return formatDate(locale, activationMs, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function RoleCard({
  locale,
  role,
  hideNftPurchasing,
}: {
  readonly locale: SupportedLocale;
  readonly role: Role;
  readonly hideNftPurchasing: boolean;
}) {
  const RoleIcon = role.icon;
  const prefix = `delegation.tapGuide.roles.${role.key}` as const;

  return (
    <li className={`${TDH_PANEL} tw-p-5 sm:tw-p-6`}>
      <div className="tw-flex tw-items-start tw-gap-4">
        <span className={`${ICON_BOX} tw-size-11 ${role.tone}`}>
          <RoleIcon aria-hidden="true" className="tw-size-5" />
        </span>
        <div className="tw-min-w-0">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
            <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50">
              {t(locale, `${prefix}.name`)}
            </h3>
            <span
              className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider ${role.temperature}`}
            >
              <span
                aria-hidden="true"
                className={`tw-size-2 tw-rounded-full ${role.dot}`}
              />
              {t(locale, `${prefix}.temperature`)}
            </span>
          </div>
          <p className={MUTED}>{t(locale, `${prefix}.kind`)}</p>
        </div>
      </div>
      <div className="tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-5 md:tw-grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:tw-gap-8">
        <dl className="tw-m-0 tw-space-y-3">
          <div>
            <dt className={LABEL}>
              {t(locale, "delegation.tapGuide.roles.holds")}
            </dt>
            <dd className="tw-m-0 tw-mt-0.5 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100">
              {t(locale, `${prefix}.holds`)}
            </dd>
          </div>
          <div>
            <dt className={LABEL}>
              {t(locale, "delegation.tapGuide.roles.connects")}
            </dt>
            <dd className="tw-m-0 tw-mt-0.5 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100">
              {t(locale, `${prefix}.connects`)}
            </dd>
          </div>
        </dl>
        <ul className="tw-m-0 tw-list-none tw-space-y-2.5 tw-p-0">
          {role.rules.map((rule) => (
            <li key={rule} className="tw-flex tw-gap-2.5">
              <CheckIcon
                aria-hidden="true"
                className="tw-mt-1 tw-size-4 tw-flex-shrink-0 tw-text-success"
              />
              <span className={`${TDH_TEXT} tw-min-w-0`}>
                {t(locale, socialRuleKey(rule, hideNftPurchasing))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

// Paying for Meme subscriptions is a purchasing surface: on restricted iOS
// builds the social wallet's job list omits it entirely.
function socialRuleKey(rule: MessageKey, hideNftPurchasing: boolean) {
  return rule === SOCIAL_USE_RULE && !hideNftPurchasing
    ? SOCIAL_USE_WITH_SUBSCRIPTIONS_RULE
    : rule;
}

function IconPanel({
  icon: PanelIcon,
  title,
  children,
}: {
  readonly icon: Icon;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <li className={`${TDH_PANEL} tw-flex tw-gap-4 tw-p-5`}>
      <span className={NEUTRAL_ICON_BOX}>
        <PanelIcon aria-hidden="true" className="tw-size-5" />
      </span>
      <div className="tw-min-w-0">
        <h3 className={CARD_TITLE}>{title}</h3>
        {children}
      </div>
    </li>
  );
}

function LevelCard({
  level,
  locale,
}: {
  readonly level: (typeof LEVELS)[number];
  readonly locale: SupportedLocale;
}) {
  const great = level === "great";

  return (
    <div className={great ? HIGHLIGHT_PANEL : `${TDH_PANEL} tw-p-5 sm:tw-p-6`}>
      <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50">
        {t(locale, `delegation.tapGuide.levels.${level}.title`)}
      </h3>
      <p className={MUTED}>
        {t(locale, `delegation.tapGuide.levels.${level}.summary`)}
      </p>
      <dl className="tw-m-0 tw-mt-4">
        {ROLES.map((role) => (
          <div
            key={role.key}
            className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-3 last:tw-pb-0"
          >
            <dt className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
              <span
                aria-hidden="true"
                className={`tw-size-2 tw-flex-shrink-0 tw-rounded-full ${role.dot}`}
              />
              {t(locale, `delegation.tapGuide.roles.${role.key}.name`)}
            </dt>
            <dd className="tw-m-0 tw-mt-0.5 tw-text-sm tw-leading-6 tw-text-iron-100">
              {t(locale, `delegation.tapGuide.levels.${level}.${role.key}`)}
            </dd>
          </div>
        ))}
      </dl>
      {great && (
        <p className="tw-mb-0 tw-mt-4 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-leading-6 tw-text-primary-300">
          <ShieldCheckIcon
            aria-hidden="true"
            className="tw-size-5 tw-flex-shrink-0"
          />
          {t(locale, "delegation.tapGuide.levels.great.note")}
        </p>
      )}
    </div>
  );
}
