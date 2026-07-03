import type {
  WaveCustomRules,
  WaveRules,
} from "@/helpers/waves/wave-rules.helpers";

interface WaveRulesPanelProps {
  readonly rules: WaveRules;
  readonly showCustomRules?: boolean | undefined;
  readonly title?: string | undefined;
  readonly useRing?: boolean | undefined;
}

const hasCustomRules = (custom: WaveCustomRules): boolean =>
  Boolean(custom.display || custom.binding);

function WaveRulesCustomSection({
  custom,
}: {
  readonly custom: WaveCustomRules;
}) {
  if (!hasCustomRules(custom)) {
    return (
      <section className="tw-px-4 tw-py-5">
        <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-300">
          Creator rules
        </p>
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-500">
          No custom creator rules added.
        </p>
      </section>
    );
  }

  return (
    <section className="tw-px-4 tw-py-5">
      <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-300">
        Creator rules
      </p>
      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-3">
        {custom.display && (
          <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-3">
            <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
              Display only
            </p>
            <p className="tw-mb-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
              {custom.display}
            </p>
          </div>
        )}
        {custom.binding && (
          <div className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-500/5 tw-p-3">
            <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-200">
              Requires acceptance
            </p>
            <p className="tw-mb-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
              {custom.binding}
            </p>
            {custom.signatureRequired && (
              <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400">
                Participants sign these rules with their wallet before
                submitting.
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
  title = "Rules",
  useRing = true,
}: WaveRulesPanelProps) {
  const ringClasses = useRing
    ? "tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800"
    : "";

  return (
    <div
      className={`tw-relative tw-overflow-hidden tw-bg-iron-950 ${ringClasses}`}
    >
      <div className="tw-px-4 tw-pt-6">
        <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-300">
          {title}
        </p>
      </div>

      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
        {rules.automatic.map((section) => (
          <section key={section.id} className="tw-px-4 tw-py-5">
            <h3 className="tw-mb-3 tw-text-sm tw-font-semibold tw-text-iron-100">
              {section.title}
            </h3>
            <dl className="tw-mb-0 tw-flex tw-flex-col tw-gap-1">
              {section.rows.map((row) => (
                <div
                  key={row.id}
                  className="tw-grid tw-min-h-8 tw-grid-cols-[minmax(7.5rem,0.85fr)_minmax(0,1fr)] tw-items-start tw-gap-x-3 tw-gap-y-1 tw-py-1 tw-text-sm"
                >
                  <dt className="tw-min-w-0 tw-font-normal tw-text-iron-500">
                    {row.label}
                  </dt>
                  <dd className="tw-mb-0 tw-min-w-0 tw-break-words tw-text-right tw-font-medium tw-text-iron-50">
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
        {showCustomRules && <WaveRulesCustomSection custom={rules.custom} />}
      </div>
    </div>
  );
}
