"use client";

import { getSafeCollectingSectionPath } from "@/components/delegation/safe-collecting-routes";

import ButtonLink from "@/components/utils/button/ButtonLink";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { DelegationCenterSection } from "@/types/enums";
import {
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  GiftIcon,
  IdentificationIcon,
  LinkIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
  WalletIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useId, type ComponentType, type SVGProps } from "react";
import DelegationCenterComponent from "../DelegationCenter";
import SafeCollectingSection, {
  ROLE_DOT,
  SAFE_COLLECTING_ROLES,
  SC_FOCUS,
  SC_HEADING_3,
  SC_LINK,
  SC_PANEL,
  SC_TEXT,
  type SafeCollectingRole,
} from "./SafeCollectingSection";
import SafeCollectingSetupPaths from "./SafeCollectingSetupPaths";
import SafeCollectingYourSetup from "./SafeCollectingYourSetup";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const SAFE_SETUP_ANCHOR = "safe-setup";

const delegation = getSafeCollectingSectionPath;

const BENEFITS = [
  { key: "cold", icon: ShieldCheckIcon },
  { key: "one", icon: ChartBarIcon },
  { key: "hot", icon: SparklesIcon },
  { key: "mint", icon: CheckBadgeIcon },
  { key: "airdrops", icon: GiftIcon },
  { key: "profile", icon: UserCircleIcon },
] as const satisfies readonly { readonly key: string; readonly icon: Icon }[];

const TASKS = [
  {
    key: "combine",
    icon: UserGroupIcon,
    href: delegation(DelegationCenterSection.BUILD_CONSOLIDATION),
  },
  {
    key: "manager",
    icon: UserPlusIcon,
    href: delegation(DelegationCenterSection.REGISTER_SUB_DELEGATION),
  },
  {
    key: "mint",
    icon: CheckBadgeIcon,
    href: `${delegation(DelegationCenterSection.REGISTER_DELEGATION)}?use_case=2`,
  },
  {
    key: "airdrops",
    icon: GiftIcon,
    href: `${delegation(DelegationCenterSection.REGISTER_DELEGATION)}?collection=MEMES&use_case=3`,
  },
  {
    key: "primary",
    icon: IdentificationIcon,
    href: delegation(DelegationCenterSection.ASSIGN_PRIMARY_ADDRESS),
  },
  {
    key: "locks",
    icon: LockClosedIcon,
    href: delegation(DelegationCenterSection.ANY_COLLECTION),
  },
  {
    key: "revoke",
    icon: XCircleIcon,
    href: delegation(DelegationCenterSection.ANY_COLLECTION),
  },
  {
    key: "check",
    icon: MagnifyingGlassIcon,
    href: delegation(DelegationCenterSection.CHECKER),
  },
] as const satisfies readonly {
  readonly key: string;
  readonly icon: Icon;
  readonly href: string;
}[];

const LEARN = [
  { key: "tap", href: delegation(DelegationCenterSection.WALLET_ARCHITECTURE) },
  { key: "combine", href: "/network/tdh/consolidation" },
  { key: "safe", href: "/safe-collecting/faq/using-safe" },
  { key: "faq", href: delegation(DelegationCenterSection.FAQ) },
] as const;

const SECTION_IDS = [
  "safe-roles",
  "safe-benefits",
  "safe-your-setup",
  SAFE_SETUP_ANCHOR,
  "safe-tasks",
  "safe-learn",
  "safe-tools",
] as const;

// Scrolls to and focuses the section named in the URL hash, so links such as
// /safe-collecting#safe-setup land on the right heading.
function useSectionHashFocus() {
  useEffect(() => {
    const focus = () => {
      const id = globalThis.location.hash.slice(1);
      if (!(SECTION_IDS as readonly string[]).includes(id)) return;
      globalThis.requestAnimationFrame(() => {
        globalThis.document
          .getElementById(id)
          ?.scrollIntoView({ block: "start" });
        globalThis.document
          .getElementById(`${id}-heading`)
          ?.focus({ preventScroll: true });
      });
    };
    focus();
    globalThis.addEventListener("hashchange", focus);
    return () => globalThis.removeEventListener("hashchange", focus);
  }, []);
}

export default function SafeCollecting({
  setSection,
}: {
  readonly setSection: (section: DelegationCenterSection) => void;
}) {
  const locale = useBrowserLocale();
  const { hideNftPurchasing } = useNftPurchasingVisibility();
  useSectionHashFocus();

  return (
    <div className="tw-w-full">
      <header className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-8 tw-pb-10 lg:tw-grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:tw-gap-12">
        <div>
          <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl">
            {t(locale, "safeCollecting.title")}
          </h1>
          <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-200 sm:tw-text-lg sm:tw-leading-8">
            {t(
              locale,
              hideNftPurchasing
                ? "safeCollecting.leadNoSubscriptions"
                : "safeCollecting.lead"
            )}
          </p>
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "safeCollecting.trust")}
          </p>
          <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-3">
            <ButtonLink
              href={`#${SAFE_SETUP_ANCHOR}`}
              variant="primary"
              size="lg"
            >
              {t(locale, "safeCollecting.cta")}
              <ArrowDownIcon aria-hidden="true" className="tw-size-4" />
            </ButtonLink>
            <Link
              className={`${SC_LINK} tw-text-sm`}
              href={delegation(DelegationCenterSection.CHECKER)}
            >
              {t(locale, "safeCollecting.checkWallet")}
            </Link>
          </div>
        </div>
        <SystemFigure locale={locale} />
      </header>

      <SafeCollectingSection
        id="safe-roles"
        title={t(locale, "safeCollecting.roles.title")}
        description={t(locale, "safeCollecting.roles.description")}
      >
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 md:tw-grid-cols-2">
          {SAFE_COLLECTING_ROLES.map((role) => (
            <RoleCard
              key={role}
              locale={locale}
              role={role}
              hideNftPurchasing={hideNftPurchasing}
            />
          ))}
        </ul>
      </SafeCollectingSection>

      <SafeCollectingSection
        id="safe-benefits"
        title={t(locale, "safeCollecting.benefits.title")}
        description={t(locale, "safeCollecting.benefits.description")}
      >
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 sm:tw-grid-cols-2">
          {BENEFITS.map(({ key, icon: BenefitIcon }) => (
            <li key={key} className={`${SC_PANEL} tw-flex tw-gap-4 tw-p-5`}>
              <span className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800/80 tw-text-iron-100">
                <BenefitIcon aria-hidden="true" className="tw-size-5" />
              </span>
              <div className="tw-min-w-0">
                <h3 className={SC_HEADING_3}>
                  {t(locale, `safeCollecting.benefits.${key}.title`)}
                </h3>
                <p className={`${SC_TEXT} tw-mt-1.5`}>
                  {key === "airdrops" && hideNftPurchasing
                    ? t(
                        locale,
                        "safeCollecting.benefits.airdrops.bodyNoSubscriptions"
                      )
                    : t(locale, `safeCollecting.benefits.${key}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </SafeCollectingSection>

      <SafeCollectingSection
        id="safe-your-setup"
        title={t(locale, "safeCollecting.yourSetup.title")}
        description={t(locale, "safeCollecting.yourSetup.description")}
      >
        <SafeCollectingYourSetup locale={locale} />
      </SafeCollectingSection>

      <SafeCollectingSection
        id={SAFE_SETUP_ANCHOR}
        title={t(locale, "safeCollecting.setup.title")}
        description={t(locale, "safeCollecting.setup.description")}
      >
        <SafeCollectingSetupPaths locale={locale} />
      </SafeCollectingSection>

      <SafeCollectingSection
        id="safe-tasks"
        title={t(locale, "safeCollecting.tasks.title")}
        description={t(locale, "safeCollecting.tasks.description")}
      >
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 sm:tw-grid-cols-2">
          {TASKS.map(({ key, icon: TaskIcon, href }) => (
            <li key={key}>
              <Link
                href={href}
                className={`${SC_PANEL} tw-group tw-flex tw-h-full tw-items-start tw-gap-3 tw-p-4 tw-no-underline tw-transition-colors hover:tw-border-iron-600 hover:tw-bg-iron-900 ${SC_FOCUS}`}
              >
                <TaskIcon
                  aria-hidden="true"
                  className="tw-mt-0.5 tw-size-5 tw-flex-shrink-0 tw-text-iron-400 group-hover:tw-text-iron-200"
                />
                <span className="tw-min-w-0">
                  <span className="tw-block tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-100">
                    {t(locale, `safeCollecting.tasks.${key}.title`)}
                  </span>
                  <span className="tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
                    {t(locale, `safeCollecting.tasks.${key}.body`)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <aside
          aria-labelledby="safe-caution-heading"
          className="tw-mt-6 tw-rounded-xl tw-border tw-border-solid tw-border-amber-400/25 tw-bg-amber-500/[0.06] tw-p-5"
        >
          <h3
            id="safe-caution-heading"
            className={`${SC_HEADING_3} tw-flex tw-items-center tw-gap-2`}
          >
            <ExclamationTriangleIcon
              aria-hidden="true"
              className="tw-size-5 tw-text-amber-300"
            />
            {t(locale, "safeCollecting.caution.title")}
          </h3>
          <ul className="tw-m-0 tw-mt-3 tw-list-disc tw-space-y-2 tw-pl-5 marker:tw-text-amber-300/70">
            {(["manager", "expiry", "keys"] as const).map((key) => (
              <li key={key} className={SC_TEXT}>
                {t(locale, `safeCollecting.caution.${key}`)}
              </li>
            ))}
          </ul>
        </aside>
      </SafeCollectingSection>

      <SafeCollectingSection
        id="safe-learn"
        title={t(locale, "safeCollecting.learn.title")}
      >
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 sm:tw-grid-cols-2">
          {LEARN.map(({ key, href }) => (
            <li key={key}>
              <Link
                href={href}
                className={`${SC_PANEL} tw-block tw-h-full tw-p-5 tw-no-underline hover:tw-border-iron-600 ${SC_FOCUS}`}
              >
                <span className="tw-flex tw-items-center tw-gap-2 tw-text-base tw-font-medium tw-text-iron-100">
                  <BookOpenIcon
                    aria-hidden="true"
                    className="tw-size-4 tw-text-iron-400"
                  />
                  {t(locale, `safeCollecting.learn.${key}.title`)}
                </span>
                <span className="tw-mt-2 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
                  {t(locale, `safeCollecting.learn.${key}.body`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </SafeCollectingSection>

      <SafeCollectingSection
        id="safe-tools"
        title={t(locale, "safeCollecting.tools.title")}
        description={t(locale, "safeCollecting.tools.description")}
      >
        <DelegationCenterComponent setSection={setSection} />
      </SafeCollectingSection>
    </div>
  );
}

function RoleCard({
  locale,
  role,
  hideNftPurchasing,
}: {
  readonly locale: SupportedLocale;
  readonly role: SafeCollectingRole;
  readonly hideNftPurchasing: boolean;
}) {
  const on6529Key =
    role === "social" && hideNftPurchasing
      ? "safeCollecting.roles.social.on6529NoSubscriptions"
      : (`safeCollecting.roles.${role}.on6529` as const);

  return (
    <li className={`${SC_PANEL} tw-flex tw-flex-col tw-p-5`}>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
        <span
          aria-hidden="true"
          className={`tw-size-2.5 tw-rounded-full ${ROLE_DOT[role]}`}
        />
        <h3 className={SC_HEADING_3}>
          {t(locale, `safeCollecting.roles.${role}.name`)}
        </h3>
        <span className="tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-300">
          {t(locale, `safeCollecting.roles.${role}.temperature`)}
        </span>
      </div>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">
        {t(locale, `safeCollecting.roles.${role}.kind`)}
      </p>
      <dl className="tw-m-0 tw-mt-4 tw-space-y-3">
        {(
          [
            ["holds", `safeCollecting.roles.${role}.holds`],
            ["connects", `safeCollecting.roles.${role}.connects`],
            ["on6529", on6529Key],
          ] as const
        ).map(([label, valueKey]) => (
          <div key={label}>
            <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
              {t(locale, `safeCollecting.roles.${label}`)}
            </dt>
            <dd className={`${SC_TEXT} tw-ml-0 tw-mt-0.5`}>
              {t(locale, valueKey)}
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

function SystemFigure({ locale }: { readonly locale: SupportedLocale }) {
  const tile = (role: SafeCollectingRole) => (
    <div className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-2.5 tw-py-2.5 sm:tw-px-3">
      <span
        className={`tw-size-2 tw-flex-shrink-0 tw-rounded-full ${ROLE_DOT[role]}`}
      />
      <span className="tw-min-w-0 tw-flex-1 tw-text-sm tw-leading-5 tw-text-iron-200">
        {t(locale, `safeCollecting.roles.${role}.name`)}
      </span>
      <WalletIcon
        aria-hidden="true"
        className="tw-hidden tw-size-4 tw-flex-shrink-0 tw-text-iron-500 sm:tw-block"
      />
    </div>
  );
  const connector = (
    key: "manages" | "mints",
    IconComponent: Icon = ArrowDownIcon
  ) => (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-1 tw-text-center">
      <span className="tw-text-xs tw-text-iron-400">
        {t(locale, `safeCollecting.figure.${key}`)}
      </span>
      <IconComponent
        aria-hidden="true"
        className="tw-size-4 tw-text-iron-500"
      />
    </div>
  );

  const captionId = useId();
  return (
    <figure
      aria-labelledby={captionId}
      className={`${SC_PANEL} tw-m-0 tw-p-5 sm:tw-p-6`}
    >
      <figcaption id={captionId} className="tw-sr-only">
        {t(locale, "safeCollecting.figure.label")}
      </figcaption>
      <div
        aria-hidden="true"
        className="tw-rounded-xl tw-border tw-border-dashed tw-border-primary-400/30 tw-bg-primary-500/[0.03] tw-p-4"
      >
        <div className="tw-text-primary-200 tw-mb-3 tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide">
          <LinkIcon aria-hidden="true" className="tw-size-4" />
          {t(locale, "safeCollecting.figure.oneCollector")}
        </div>
        <div className="tw-grid tw-grid-cols-1 tw-gap-2 min-[420px]:tw-grid-cols-2 min-[420px]:tw-gap-3">
          <div className="tw-flex tw-flex-col tw-gap-2">
            {tile("social")}
            {connector("mints")}
          </div>
          <div className="tw-flex tw-flex-col tw-gap-2">
            {tile("transaction")}
            {connector("manages")}
          </div>
        </div>
        <div className="tw-mt-2 tw-rounded-lg tw-border tw-border-solid tw-border-sky-400/30 tw-bg-sky-500/[0.06] tw-p-3">
          <div className="tw-flex tw-items-center tw-gap-2">
            <ShieldCheckIcon
              aria-hidden="true"
              className="tw-size-5 tw-text-sky-300"
            />
            <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
              {t(locale, "safeCollecting.roles.vault.name")}
            </span>
            <span className="tw-ml-auto tw-text-xs tw-text-sky-200">
              {t(locale, "safeCollecting.roles.vault.temperature")}
            </span>
          </div>
          <ul className="tw-m-0 tw-mt-2 tw-list-none tw-space-y-1 tw-p-0 tw-text-xs tw-text-iron-300">
            <li className="tw-flex tw-items-center tw-gap-1.5">
              <NoSymbolIcon
                aria-hidden="true"
                className="tw-size-3.5 tw-flex-shrink-0 tw-text-iron-500"
              />
              {t(locale, "safeCollecting.figure.neverConnects")}
            </li>
            <li className="tw-flex tw-items-center tw-gap-1.5">
              <ArrowsRightLeftIcon
                aria-hidden="true"
                className="tw-size-3.5 tw-flex-shrink-0 tw-text-iron-500"
              />
              {t(locale, "safeCollecting.figure.airdrops")}
            </li>
          </ul>
        </div>
        <div className="tw-mt-3">{tile("old")}</div>
      </div>
    </figure>
  );
}
