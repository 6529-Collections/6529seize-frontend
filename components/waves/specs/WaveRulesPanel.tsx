import type {
  WaveCustomRules,
  WaveRules,
} from "@/helpers/waves/wave-rules.helpers";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

interface WaveRulesPanelProps {
  readonly rules: WaveRules;
  readonly showCustomRules?: boolean | undefined;
  readonly title?: string | undefined;
  readonly useRing?: boolean | undefined;
  readonly showTitle?: boolean | undefined;
}

const hasCustomRules = (custom: WaveCustomRules): boolean =>
  Boolean(custom.display) || Boolean(custom.binding);

function WaveRulesCustomSection({
  custom,
  headingLevel,
}: {
  readonly custom: WaveCustomRules;
  readonly headingLevel: "h2" | "h3";
}) {
  const Heading = headingLevel;

  if (!hasCustomRules(custom)) {
    return (
      <section className="tw-px-4 tw-py-4">
        <Heading className="tw-mb-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]">
          {waveRightPanelText("waves.sidebar.rightPanel.rules.creatorTitle")}
        </Heading>
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-font-light tw-italic tw-leading-5 tw-text-iron-500">
          {waveRightPanelText("waves.sidebar.rightPanel.rules.emptyCreator")}
        </p>
      </section>
    );
  }

  return (
    <section className="tw-px-4 tw-py-4">
      <Heading className="tw-mb-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]">
        {waveRightPanelText("waves.sidebar.rightPanel.rules.creatorTitle")}
      </Heading>
      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-3">
        {custom.display && (
          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-3">
            <p className="tw-mb-2 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-tracking-[0.06em] tw-text-iron-500 sm:tw-tracking-[0.08em]">
              {waveRightPanelText("waves.sidebar.rightPanel.rules.displayOnly")}
            </p>
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
}: WaveRulesPanelProps) {
  const ringClasses = useRing
    ? "tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800"
    : "";

  const SectionHeading = showTitle ? "h3" : "h2";
  const resolvedTitle =
    title ?? waveRightPanelText("waves.sidebar.rightPanel.rules.title");

  return (
    <div
      className={`tw-relative tw-overflow-hidden tw-bg-iron-950 ${ringClasses}`}
    >
      {showTitle && (
        <div className="tw-px-4 tw-pt-6">
          <h2 className="tw-mb-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]">
            {resolvedTitle}
          </h2>
        </div>
      )}

      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
        {rules.automatic.map((section) => (
          <section key={section.id} className="tw-px-4 tw-py-4">
            <SectionHeading className="tw-mb-2.5 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]">
              {section.title}
            </SectionHeading>
            <dl className="tw-mb-0 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5">
              {section.rows.map((row) => (
                <div
                  key={row.id}
                  className="tw-grid tw-min-h-9 tw-grid-cols-[minmax(6.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-start tw-gap-x-3 tw-gap-y-1.5 tw-py-2 tw-text-sm"
                >
                  <dt className="tw-min-w-0 tw-break-words tw-font-normal tw-leading-5 tw-text-iron-500">
                    {row.label}
                  </dt>
                  <dd className="tw-mb-0 tw-ml-0 tw-min-w-0 tw-break-words tw-text-right tw-font-medium tw-leading-5 tw-text-iron-50">
                    {row.value}
                    {row.description && (
                      <span className="tw-mt-1 tw-block tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-500">
                        {row.description}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        {showCustomRules && (
          <WaveRulesCustomSection
            custom={rules.custom}
            headingLevel={showTitle ? "h3" : "h2"}
          />
        )}
      </div>
    </div>
  );
}
