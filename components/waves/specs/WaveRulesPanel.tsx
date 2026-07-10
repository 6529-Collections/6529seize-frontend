import type {
  WaveCustomRules,
  WaveRuleRow,
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

const shouldStackRuleRow = (row: WaveRuleRow): boolean => {
  if (row.value.length > 24) {
    return true;
  }

  return Boolean(row.description);
};

function WaveRulesCustomSection({
  custom,
}: {
  readonly custom: WaveCustomRules;
}) {
  if (!hasCustomRules(custom)) {
    return (
      <section className="tw-px-4 tw-py-4">
        <p className="tw-mb-0 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-iron-400">
          Creator rules
        </p>
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-500">
          No custom creator rules added.
        </p>
      </section>
    );
  }

  return (
    <section className="tw-px-4 tw-py-4">
      <p className="tw-mb-0 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-iron-400">
        Creator rules
      </p>
      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-3">
        {custom.display && (
          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-3">
            <p className="tw-mb-2 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
              Display only
            </p>
            <p className="tw-mb-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
              {custom.display}
            </p>
          </div>
        )}
        {custom.binding && (
          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-primary-400/15 tw-pt-3">
            <p className="tw-mb-2 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-primary-300">
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
        <h2 className="tw-mb-0 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400">
          {title}
        </h2>
      </div>

      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
        {rules.automatic.map((section) => (
          <section key={section.id} className="tw-px-4 tw-py-4">
            <h3 className="tw-mb-2.5 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-iron-300">
              {section.title}
            </h3>
            <dl className="tw-mb-0 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5">
              {section.rows.map((row) => {
                const stackRow = shouldStackRuleRow(row);

                return (
                  <div
                    key={row.id}
                    className={`tw-min-h-9 tw-gap-x-3 tw-gap-y-1.5 tw-py-2 tw-text-sm ${
                      stackRow
                        ? "tw-flex tw-flex-col"
                        : "tw-grid tw-grid-cols-[minmax(6.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-start"
                    }`}
                  >
                    <dt className="tw-min-w-0 tw-font-normal tw-leading-5 tw-text-iron-500">
                      {row.label}
                    </dt>
                    <dd
                      className={`tw-mb-0 tw-min-w-0 tw-break-words tw-font-medium tw-leading-5 tw-text-iron-50 ${
                        stackRow ? "tw-text-left" : "tw-text-right"
                      }`}
                    >
                      {row.value}
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
        {showCustomRules && <WaveRulesCustomSection custom={rules.custom} />}
      </div>
    </div>
  );
}
