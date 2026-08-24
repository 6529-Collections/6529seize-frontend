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
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CreateWaveTermsOfService from "./drops/terms/CreateWaveTermsOfService";
import WaveRulesPanel from "../specs/WaveRulesPanel";
import CreateWaveStepHeader from "./utils/CreateWaveStepHeader";
import { CREATE_WAVE_FORM_STYLES } from "./utils/createWaveFormStyles";
import CreateWaveAdvancedSection from "./utils/CreateWaveAdvancedSection";
import CreateWaveRulesGroupMembers from "./rules/CreateWaveRulesGroupMembers";
import type { WaveRuleRow } from "@/helpers/waves/wave-rules.shared";
import { useAuth } from "@/components/auth/Auth";
import { getOnlyMeGroupDescription } from "./services/waveGroupService";

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
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();
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
  const hasCustomRules = Boolean(normalizeWaveCustomRules(customRules));
  const hasBindingRules = Boolean(normalizeWaveCustomRules(config.drops.terms));
  const groupIdsByRuleId: Readonly<Record<string, string | null>> = {
    "can-view": config.groups.canView,
    "can-drop": config.groups.canDrop,
    "can-vote": config.groups.canVote,
    "chat-access": config.groups.canChat,
    admin: config.groups.admin,
  };

  const renderRuleValue = (row: WaveRuleRow) => {
    const groupId = groupIdsByRuleId[row.id];
    if (row.id === "admin" && !groupId && connectedProfile?.primary_wallet) {
      return (
        <CreateWaveRulesGroupMembers
          target={{
            kind: "draft",
            group: getOnlyMeGroupDescription(connectedProfile.primary_wallet),
            name: row.value,
            summary: row.value,
          }}
          roleLabel={row.label}
        />
      );
    }

    if (!groupId) {
      return undefined;
    }

    return (
      <CreateWaveRulesGroupMembers
        groupId={groupId}
        cachedGroup={groupsCache[groupId]}
        roleLabel={row.label}
      />
    );
  };

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
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <CreateWaveStepHeader title={t(locale, "waves.create.rules.title")} />

      <WaveRulesPanel
        rules={rules}
        showCustomRules={false}
        showTitle={false}
        variant="form"
        renderRowValue={renderRuleValue}
      />

      <CreateWaveAdvancedSection
        title={t(
          locale,
          supportsAcceptanceRules
            ? "waves.create.rules.advancedSummary"
            : "waves.create.rules.chatAdvancedSummary"
        )}
        isCustomized={hasCustomRules || hasBindingRules}
        hasError={false}
        variant="filled"
      >
        <div className="tw-space-y-6 tw-p-5">
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

          {supportsAcceptanceRules && (
            <section className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-6">
              <CreateWaveTermsOfService
                terms={config.drops.terms}
                setTerms={setBindingRules}
                title={t(locale, "waves.create.rules.acceptanceTitle")}
                toggleLabel={t(locale, "waves.create.rules.acceptanceToggle")}
                description={t(
                  locale,
                  "waves.create.rules.acceptanceDescription"
                )}
                placeholder={t(
                  locale,
                  "waves.create.rules.acceptancePlaceholder"
                )}
                helperText={t(locale, "waves.create.rules.acceptanceHelper")}
              />
            </section>
          )}
        </div>
      </CreateWaveAdvancedSection>
    </div>
  );
}
