"use client";

import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  WAVE_CUSTOM_RULES_MAX_LENGTH,
  normalizeWaveCustomRules,
} from "@/helpers/waves/wave-metadata.helpers";
import { buildWaveRules } from "@/helpers/waves/wave-rules.helpers";
import type { CreateWaveConfig } from "@/types/waves.types";
import { useMemo } from "react";
import CreateWaveTermsOfService from "./drops/terms/CreateWaveTermsOfService";
import WaveRulesPanel from "../specs/WaveRulesPanel";

interface CreateWaveRulesProps {
  readonly config: CreateWaveConfig;
  readonly groupsCache: Readonly<Record<string, ApiGroupFull>>;
  readonly setDisplay: (display: CreateWaveConfig["display"]) => void;
  readonly setDrops: (drops: CreateWaveConfig["drops"]) => void;
}

export default function CreateWaveRules({
  config,
  groupsCache,
  setDisplay,
  setDrops,
}: CreateWaveRulesProps) {
  const rules = useMemo(
    () =>
      buildWaveRules({
        config,
        groupsCache,
      }),
    [config, groupsCache]
  );

  const customRules = config.display.customRules ?? "";
  const customRulesHelpId = "create-wave-custom-rules-help";
  const customRulesCounterId = "create-wave-custom-rules-counter";
  const supportsAcceptanceRules = config.overview.type !== ApiWaveType.Chat;

  const setDisplayRules = (value: string) => {
    setDisplay({
      ...config.display,
      customRules: value,
    });
  };

  const setBindingRules = (terms: string | null) => {
    const normalizedTerms = normalizeWaveCustomRules(terms);
    setDrops({
      ...config.drops,
      terms,
      signatureRequired: Boolean(normalizedTerms),
    });
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-8">
      <div>
        <h2 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-white">
          Rules
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
          Automatic rules are generated from the wave setup. Add creator rules
          only for wave-specific requirements that are not already covered.
        </p>
      </div>

      <WaveRulesPanel
        rules={rules}
        showCustomRules={false}
        title="Automatic rules"
      />

      <section className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-6">
        <div className="tw-space-y-3">
          <div>
            <label
              htmlFor="create-wave-custom-rules"
              className="tw-mb-0 tw-block tw-text-lg tw-font-semibold tw-text-iron-100"
            >
              Display-only creator rules
            </label>
            <p
              id={customRulesHelpId}
              className="tw-mb-0 tw-mt-1 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400"
            >
              These rules are shown in the wave rules panel. They do not require
              a signature.
            </p>
          </div>
          <textarea
            id="create-wave-custom-rules"
            aria-describedby={`${customRulesHelpId} ${customRulesCounterId}`}
            value={customRules}
            maxLength={WAVE_CUSTOM_RULES_MAX_LENGTH}
            rows={5}
            onChange={(event) => setDisplayRules(event.target.value)}
            className="tw-form-textarea tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-4 tw-text-base tw-font-medium tw-text-white tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-text-sm"
            placeholder="Add optional display-only creator rules..."
          />
          <div
            id={customRulesCounterId}
            aria-live="polite"
            className="tw-flex tw-justify-between tw-gap-3 tw-text-xs tw-font-medium tw-text-iron-400"
          >
            <span>
              Leave blank when automatic rules already cover the wave.
            </span>
            <span>
              {customRules.length}/{WAVE_CUSTOM_RULES_MAX_LENGTH}
            </span>
          </div>
        </div>
      </section>

      {supportsAcceptanceRules && (
        <section className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-6">
          <CreateWaveTermsOfService
            waveType={config.overview.type}
            terms={config.drops.terms}
            setTerms={setBindingRules}
            title="Rules that require acceptance"
            toggleLabel="Require acceptance"
            description={
              "Use this only for custom creator rules that participants must accept and sign before submitting."
            }
            placeholder="Enter rules participants must accept before submitting..."
            helperText="Participants will sign these rules with their wallet"
          />
        </section>
      )}
    </div>
  );
}
