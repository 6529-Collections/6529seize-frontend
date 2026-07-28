import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const REFERENCE_SECTIONS = [
  {
    href: "#solidity-generation-provenance",
    labelKey: "publicReview.reference.generatedLabel",
  },
  {
    href: "#solidity-auditor-evidence",
    labelKey: "publicReview.reference.auditorEvidence",
  },
  {
    href: "#solidity-release-readiness",
    labelKey: "publicReview.reference.releaseReadiness",
  },
  {
    href: "#solidity-risk-register",
    labelKey: "publicReview.reference.riskRegister",
  },
  {
    href: "#solidity-governed-parameters",
    labelKey: "publicReview.reference.governedParameters",
  },
  {
    href: "#solidity-natspec-gaps",
    labelKey: "publicReview.reference.natSpecGaps",
  },
  {
    href: "#solidity-global-declarations",
    labelKey: "publicReview.reference.globalDeclarations",
  },
  {
    href: "#solidity-definition-inventory",
    labelKey: "publicReview.reference.definitions",
  },
] as const;

export function SolidityReferenceSectionNavigation() {
  const label = t(DEFAULT_LOCALE, "publicReview.navigation.onThisPage");
  return (
    <nav
      aria-label={label}
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-p-4"
    >
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
        {label}
      </p>
      <ul className="tw-mb-0 tw-mt-3 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
        {REFERENCE_SECTIONS.map((section) => (
          <li key={section.href}>
            <a
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline hover:tw-border-iron-500 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
              href={section.href}
            >
              {t(DEFAULT_LOCALE, section.labelKey)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
