import type {
  WaveCustomRules,
  WaveRules,
} from "@/helpers/waves/wave-rules.helpers";
import WaveRulesGroupMembersLink from "@/components/waves/specs/WaveRulesGroupMembersLink";
import type { WaveRuleRow } from "@/helpers/waves/wave-rules.shared";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import Link from "next/link";
import type { ReactNode } from "react";

interface WaveRulesPanelProps {
  readonly rules: WaveRules;
  readonly showCustomRules?: boolean | undefined;
  readonly title?: string | undefined;
  readonly useRing?: boolean | undefined;
  readonly showTitle?: boolean | undefined;
  readonly variant?: "default" | "form" | undefined;
  /** Return `undefined` for the default renderer or `null` to render nothing. */
  readonly renderRowValue?:
    | ((row: WaveRuleRow) => ReactNode | undefined)
    | undefined;
}

const hasCustomRules = (custom: WaveCustomRules): boolean =>
  Boolean(custom.display) || Boolean(custom.binding);

function getSectionHeadingLevel({
  showTitle,
  variant,
}: {
  readonly showTitle: boolean;
  readonly variant: "default" | "form";
}): "h2" | "h3" | "h4" {
  if (variant === "form") {
    return showTitle ? "h4" : "h3";
  }
  return showTitle ? "h3" : "h2";
}

function WaveRulesCustomSection({
  custom,
  headingLevel,
}: {
  readonly custom: WaveCustomRules;
  readonly headingLevel: "h2" | "h3" | "h4";
}) {
  const Heading = headingLevel;

  if (!hasCustomRules(custom)) {
    return (
      <section className="tw-px-4 tw-py-4">
        <Heading className="tw-m-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]">
          {waveRightPanelText("waves.sidebar.rightPanel.rules.guidelinesTitle")}
        </Heading>
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-font-light tw-italic tw-leading-5 tw-text-iron-500">
          {waveRightPanelText("waves.sidebar.rightPanel.rules.emptyGuidelines")}
        </p>
      </section>
    );
  }

  return (
    <section className="tw-px-4 tw-py-4">
      <Heading className="tw-m-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]">
        {waveRightPanelText("waves.sidebar.rightPanel.rules.guidelinesTitle")}
      </Heading>
      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-3">
        {custom.display && (
          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-3">
            <p className="tw-mb-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
              {custom.display}
            </p>
          </div>
        )}
        {custom.binding && (
          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-primary-400/15 tw-pt-3">
            <p className="tw-mb-2 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-tracking-[0.06em] tw-text-primary-300 sm:tw-tracking-[0.08em]">
              {waveRightPanelText(
                "waves.sidebar.rightPanel.rules.requiresAcceptance"
              )}
            </p>
            <p className="tw-mb-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
              {custom.binding}
            </p>
            {custom.signatureRequired && (
              <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400">
                {waveRightPanelText(
                  "waves.sidebar.rightPanel.rules.signatureRequired"
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default function WaveRulesPanel({
  rules,
  showCustomRules = true,
  title,
  useRing = true,
  showTitle = true,
  variant = "default",
  renderRowValue,
}: WaveRulesPanelProps) {
  let boundaryClasses = "";
  if (useRing) {
    boundaryClasses =
      variant === "form"
        ? "tw-rounded-xl tw-border tw-border-solid tw-border-white/5"
        : "tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800";
  }

  const TitleHeading = variant === "form" ? "h3" : "h2";
  const SectionHeading = getSectionHeadingLevel({ showTitle, variant });
  const resolvedTitle =
    title ?? waveRightPanelText("waves.sidebar.rightPanel.rules.title");
  const titleClasses =
    variant === "form"
      ? "!tw-text-base !tw-font-semibold !tw-leading-6 !tw-text-iron-100"
      : "!tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]";
  const backgroundClasses =
    variant === "form" ? "tw-bg-iron-900/60" : "tw-bg-iron-950";
  // `undefined` keeps the standard row value; `null` intentionally renders an
  // empty value so a caller can suppress the fallback without changing it.
  const getRenderedRowValue = (row: WaveRuleRow): ReactNode => {
    const renderedValue = renderRowValue?.(row);
    if (renderedValue !== undefined) {
      return renderedValue;
    }

    if (!row.valueHref) {
      return row.value;
    }

    if (row.valueGroupId) {
      return (
        <WaveRulesGroupMembersLink
          groupId={row.valueGroupId}
          groupName={row.value}
          href={row.valueHref}
          linkLabel={row.valueLinkLabel}
        />
      );
    }

    return (
      <Link
        href={row.valueHref}
        aria-label={row.valueLinkLabel}
        title={row.value}
        className="tw-inline-flex tw-min-h-11 tw-max-w-full tw-cursor-pointer tw-items-center tw-justify-end tw-break-words tw-rounded-md tw-text-right tw-text-iron-50 tw-underline tw-underline-offset-2 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-300 desktop-hover:hover:tw-decoration-2 sm:tw-min-h-9"
      >
        {row.value}
      </Link>
    );
  };

  return (
    <div
      className={`tw-relative tw-overflow-hidden ${backgroundClasses} ${boundaryClasses}`}
    >
      {showTitle && (
        <div className="tw-px-4 tw-pt-6">
          <TitleHeading className={`tw-m-0 ${titleClasses}`}>
            {resolvedTitle}
          </TitleHeading>
        </div>
      )}

      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
        {rules.automatic.map((section) => (
          <section key={section.id} className="tw-px-4 tw-py-4">
            <SectionHeading className="tw-mb-2.5 tw-mt-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]">
              {section.title}
            </SectionHeading>
            <dl className="tw-mb-0 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5">
              {section.rows.map((row) => {
                return (
                  <div
                    key={row.id}
                    className="tw-grid tw-min-h-9 tw-grid-cols-[minmax(6.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-center tw-gap-x-3 tw-gap-y-1.5 tw-py-2 tw-text-sm"
                  >
                    <dt className="tw-min-w-0 tw-break-words tw-font-normal tw-leading-5 tw-text-iron-500">
                      {row.label}
                    </dt>
                    <dd className="tw-mb-0 tw-ml-0 tw-min-w-0 tw-break-words tw-text-right tw-font-medium tw-leading-5 tw-text-iron-50">
                      {getRenderedRowValue(row)}
                      {row.description && (
                        <span className="tw-mt-1 tw-block tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-500">
                          {row.description}
                        </span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
        {showCustomRules && (
          <WaveRulesCustomSection
            custom={rules.custom}
            headingLevel={SectionHeading}
          />
        )}
      </div>
    </div>
  );
}
