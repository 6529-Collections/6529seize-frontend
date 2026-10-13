"use client";

import { getSafeCollectingSectionPath } from "@/components/delegation/safe-collecting-routes";

import ButtonLink from "@/components/utils/button/ButtonLink";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { DelegationCenterSection } from "@/types/enums";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { SC_HEADING_3, SC_LINK, SC_TEXT } from "./SafeCollectingSection";

type Path = "fresh" | "existing";

const PATHS: readonly Path[] = ["fresh", "existing"];

const section = getSafeCollectingSectionPath;

interface StepAction {
  readonly key: string;
  readonly href: string;
}

interface Step {
  readonly key: string;
  readonly optional?: boolean;
  readonly primary: StepAction;
  readonly secondary?: StepAction;
}

const TAP_GUIDE = section(DelegationCenterSection.WALLET_ARCHITECTURE);
const MANAGER = section(DelegationCenterSection.REGISTER_SUB_DELEGATION);
const GUIDED_SETUP = section(DelegationCenterSection.BUILD_CONSOLIDATION);
const REGISTER_DELEGATION = section(
  DelegationCenterSection.REGISTER_DELEGATION
);

const SAFE_COLLECTING_STEPS: Record<Path, readonly Step[]> = {
  fresh: [
    { key: "wallets", primary: { key: "action", href: TAP_GUIDE } },
    {
      key: "manager",
      primary: { key: "action", href: MANAGER },
      secondary: {
        key: "safe",
        href: "/safe-collecting/faq/using-safe",
      },
    },
    { key: "combine", primary: { key: "action", href: GUIDED_SETUP } },
    {
      key: "mint",
      optional: true,
      primary: { key: "action", href: `${REGISTER_DELEGATION}?use_case=2` },
    },
    {
      key: "airdrops",
      primary: {
        key: "action",
        href: `${REGISTER_DELEGATION}?collection=MEMES&use_case=3`,
      },
    },
    {
      key: "lock",
      optional: true,
      primary: {
        key: "action",
        href: section(DelegationCenterSection.ANY_COLLECTION),
      },
    },
  ],
  existing: [
    { key: "combine", primary: { key: "action", href: GUIDED_SETUP } },
    { key: "vault", primary: { key: "action", href: TAP_GUIDE } },
    { key: "manager", primary: { key: "action", href: MANAGER } },
    {
      key: "review",
      primary: {
        key: "action",
        href: section(DelegationCenterSection.CHECKER),
      },
    },
  ],
};

function message(
  locale: SupportedLocale,
  path: Path,
  step: string,
  part: string
) {
  return t(
    locale,
    `safeCollecting.setup.${path}.${step}.${part}` as Parameters<typeof t>[1]
  );
}

export default function SafeCollectingSetupPaths({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [path, setPath] = useState<Path>("fresh");
  const tabRefs = useRef<Record<Path, HTMLButtonElement | null>>({
    fresh: null,
    existing: null,
  });

  // Tablist keys: Left and Right move to the previous and next tab
  // (wrapping), Home and End to the first and last.
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const current = PATHS.indexOf(path);
    const targets: Record<string, number> = {
      ArrowLeft: (current - 1 + PATHS.length) % PATHS.length,
      ArrowRight: (current + 1) % PATHS.length,
      Home: 0,
      End: PATHS.length - 1,
    };
    const index = targets[event.key];
    if (index === undefined) {
      return;
    }
    event.preventDefault();
    const next = PATHS[index] ?? "fresh";
    setPath(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={t(locale, "safeCollecting.setup.pathsLabel")}
        className="tw-inline-flex tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-1"
      >
        {PATHS.map((value) => {
          const selected = value === path;
          return (
            <button
              key={value}
              ref={(element) => {
                tabRefs.current[value] = element;
              }}
              type="button"
              role="tab"
              id={`safe-setup-tab-${value}`}
              aria-selected={selected}
              aria-controls={`safe-setup-panel-${value}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setPath(value)}
              onKeyDown={onKeyDown}
              className={`tw-min-h-10 tw-rounded-md tw-border-0 tw-px-4 tw-text-sm tw-font-medium tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
                selected
                  ? "tw-bg-iron-100 tw-text-iron-950"
                  : "tw-bg-transparent tw-text-iron-300 hover:tw-text-iron-50"
              }`}
            >
              {t(locale, `safeCollecting.setup.${value}`)}
            </button>
          );
        })}
      </div>

      {PATHS.map((value) => (
        <div
          key={value}
          role="tabpanel"
          id={`safe-setup-panel-${value}`}
          aria-labelledby={`safe-setup-tab-${value}`}
          hidden={value !== path}
          className="tw-mt-5"
        >
          <p className={`${SC_TEXT} tw-text-iron-400`}>
            {t(locale, `safeCollecting.setup.${value}Intro`)}
          </p>
          <ol className="tw-m-0 tw-mt-5 tw-list-none tw-space-y-6 tw-p-0">
            {SAFE_COLLECTING_STEPS[value].map((step, index) => (
              <li
                key={step.key}
                className="tw-grid tw-grid-cols-[2.25rem_minmax(0,1fr)] tw-gap-4"
              >
                <span className="tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-100 tw-text-sm tw-font-semibold tw-text-iron-950">
                  {formatInteger(locale, index + 1)}
                </span>
                <div className="tw-min-w-0 tw-pt-1">
                  <h3 className={SC_HEADING_3}>
                    {message(locale, value, step.key, "title")}
                    {step.optional && (
                      <span className="tw-ml-2 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-px-2 tw-py-0.5 tw-align-middle tw-text-xs tw-font-medium tw-text-iron-400">
                        {t(locale, "safeCollecting.setup.optional")}
                      </span>
                    )}
                  </h3>
                  <p className={`${SC_TEXT} tw-mt-1`}>
                    {message(locale, value, step.key, "body")}
                  </p>
                  <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-2">
                    <ButtonLink
                      href={step.primary.href}
                      variant="secondary"
                      size="sm"
                    >
                      {message(locale, value, step.key, step.primary.key)}
                    </ButtonLink>
                    {step.secondary && (
                      <Link
                        className={`${SC_LINK} tw-text-sm`}
                        href={step.secondary.href}
                      >
                        {message(locale, value, step.key, step.secondary.key)}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
