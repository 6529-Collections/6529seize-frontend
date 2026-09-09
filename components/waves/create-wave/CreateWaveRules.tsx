"use client";

import { WAVE_CUSTOM_RULES_MAX_LENGTH } from "@/helpers/waves/wave-metadata.helpers";
import type { CreateWaveConfig } from "@/types/waves.types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CreateWaveStepHeader from "./utils/CreateWaveStepHeader";
import { CREATE_WAVE_FORM_STYLES } from "./utils/createWaveFormStyles";

interface CreateWaveRulesProps {
  readonly config: CreateWaveConfig;
  readonly setDisplay: (display: CreateWaveConfig["display"]) => void;
}

export default function CreateWaveRules({
  config,
  setDisplay,
}: CreateWaveRulesProps) {
  const locale = useBrowserLocale();
  const customRules = config.display.customRules ?? "";
  const customRulesHelpId = "create-wave-custom-rules-help";
  const customRulesCounterId = "create-wave-custom-rules-counter";
  const setDisplayRules = (value: string) => {
    setDisplay({
      ...config.display,
      customRules: value,
    });
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <CreateWaveStepHeader title={t(locale, "waves.create.rules.title")} />

      <section
        aria-labelledby="create-wave-guidelines-title"
        className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60"
      >
        <h3
          id="create-wave-guidelines-title"
          className={`${CREATE_WAVE_FORM_STYLES.sectionTitle} tw-px-5 tw-py-4`}
        >
          {t(locale, "waves.create.rules.guidelinesFieldLabel")}
        </h3>
        <div className="tw-space-y-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-p-5">
          <section>
            <div className="tw-space-y-3">
              <div>
                <label
                  htmlFor="create-wave-custom-rules"
                  className="tw-sr-only"
                >
                  {t(locale, "waves.create.rules.guidelinesFieldLabel")}
                </label>
                <p
                  id={customRulesHelpId}
                  className={CREATE_WAVE_FORM_STYLES.supportingText}
                >
                  {t(locale, "waves.create.rules.guidelinesDescription")}
                </p>
              </div>
              <textarea
                id="create-wave-custom-rules"
                aria-describedby={`${customRulesHelpId} ${customRulesCounterId}`}
                value={customRules}
                maxLength={WAVE_CUSTOM_RULES_MAX_LENGTH}
                rows={5}
                onChange={(event) => setDisplayRules(event.target.value)}
                className="tw-form-textarea tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-4 tw-py-4 tw-text-base tw-font-medium tw-text-white tw-caret-primary-400 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400 desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus:tw-ring-primary-400 sm:tw-text-sm"
                placeholder={t(
                  locale,
                  "waves.create.rules.guidelinesPlaceholder"
                )}
              />
              <div
                id={customRulesCounterId}
                aria-live="polite"
                className={`tw-flex tw-justify-end ${CREATE_WAVE_FORM_STYLES.compactSupportingText}`}
              >
                <span>
                  {customRules.length}/{WAVE_CUSTOM_RULES_MAX_LENGTH}
                </span>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
