"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CREATE_WAVE_FORM_STYLES } from "../../utils/createWaveFormStyles";

export default function CreateWaveTermsOfService({
  terms,
  setTerms,
}: {
  readonly terms: string | null;
  readonly setTerms: (terms: string | null) => void;
}) {
  const locale = useBrowserLocale();
  const titleId = "terms-of-service-title";
  const descriptionId = "terms-of-service-description";
  const helperId = "terms-of-service-helper";

  return (
    <div className="tw-space-y-4">
      <div>
        <h3 id={titleId} className={CREATE_WAVE_FORM_STYLES.sectionTitle}>
          {t(locale, "waves.create.rules.acceptanceTitle")}
        </h3>
        <p
          id={descriptionId}
          className={`tw-mt-1 ${CREATE_WAVE_FORM_STYLES.supportingText}`}
        >
          {t(locale, "waves.create.rules.acceptanceDescription")}
        </p>
      </div>

      <div>
        <textarea
          value={terms ?? ""}
          aria-labelledby={titleId}
          aria-describedby={`${descriptionId} ${helperId}`}
          onChange={(event) => setTerms(event.target.value)}
          id="terms-of-service-text"
          rows={6}
          className="tw-form-textarea tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-4 tw-py-4 tw-text-base tw-font-medium tw-text-white tw-caret-primary-400 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400 desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus:tw-ring-primary-400 sm:tw-text-sm"
          placeholder={t(locale, "waves.create.rules.acceptancePlaceholder")}
        />
        <div
          className={`tw-mt-2 tw-flex tw-flex-wrap tw-justify-between tw-gap-x-4 tw-gap-y-1 ${CREATE_WAVE_FORM_STYLES.compactSupportingText}`}
        >
          <span id={helperId}>
            {t(locale, "waves.create.rules.acceptanceHelper")}
          </span>
          <span>
            {t(locale, "waves.create.rules.acceptanceCharacterCount", {
              count: new Intl.NumberFormat(locale).format(terms?.length ?? 0),
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
