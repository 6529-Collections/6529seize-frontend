"use client";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";

import { useState } from "react";
import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useCompetition } from "@/contexts/CompetitionContext";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  useCompetitionConfigEditable,
  useCompetitionConfigUpdate,
} from "@/hooks/competitions/useCompetitionConfigUpdate";
import { t } from "@/i18n/messages";
import type { CreateWaveDisplayConfig } from "@/types/waves.types";
import {
  getApproveWaveDisplayMetadataDraft,
  getCreateWaveDisplayMetadataRequests,
  getWaveOutcomeVisibilityFromMetadata,
  getWaveProposalCardConfigFromMetadata,
  getWaveSubmissionButtonLabelOverrideFromMetadata,
  WAVE_DISPLAY_METADATA_KEYS,
} from "@/helpers/waves/wave-metadata.helpers";
import { getOverviewValidationErrors } from "@/helpers/waves/create-wave.validation";
import CreateWaveDisplaySettings from "@/components/waves/create-wave/overview/CreateWaveDisplaySettings";
import CompetitionConfigSaveActions from "./CompetitionConfigSaveActions";

const APPEARANCE_KEYS: ReadonlySet<string> = new Set(
  Object.values(WAVE_DISPLAY_METADATA_KEYS).filter(
    (key) => key !== WAVE_DISPLAY_METADATA_KEYS.customRules
  )
);

function AppearanceForm({ onClose }: { readonly onClose: () => void }) {
  const { competition } = useCompetition();
  const locale = useBrowserLocale();
  const metadata = (competition.presentation ?? []).map((item, id) => ({
    ...item,
    id,
  }));
  const [display, setDisplay] = useState<CreateWaveDisplayConfig>(() => ({
    approve: getApproveWaveDisplayMetadataDraft(metadata),
    customRules: null,
    outcomesVisible: getWaveOutcomeVisibilityFromMetadata(metadata),
    submissionButtonLabel:
      getWaveSubmissionButtonLabelOverrideFromMetadata(metadata),
    proposalCards: getWaveProposalCardConfigFromMetadata(null, metadata),
  }));
  const editor = useCompetitionConfigUpdate();
  const waveType =
    competition.type === ApiCompetitionType.Rank
      ? ApiWaveType.Rank
      : ApiWaveType.Approve;
  const ongoingRanking =
    waveType === ApiWaveType.Rank && competition.decisions.strategy === null;
  const errors = getOverviewValidationErrors({
    overview: {
      type: waveType,
      typeSelected: true,
      name: competition.title,
      image: null,
    },
    display,
  });
  const save = async () => {
    if (errors.length) return;
    const saved = await editor.save(JSON.stringify(display), (config) => ({
      ...config,
      presentation: [
        ...config.presentation.filter(
          (item) => !APPEARANCE_KEYS.has(item.data_key)
        ),
        ...getCreateWaveDisplayMetadataRequests({
          display,
          waveType,
          ongoingRanking,
        }),
      ],
    }));
    if (saved) onClose();
  };
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <fieldset
        disabled={editor.busy}
        className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0"
      >
        <CreateWaveDisplaySettings
          embedded
          waveType={waveType}
          display={display}
          errors={errors}
          onChange={setDisplay}
        />
        {!ongoingRanking && (
          <label className="tw-mx-5 tw-mb-5 tw-flex tw-min-h-11 tw-items-center tw-justify-between tw-gap-3 tw-text-sm tw-font-medium tw-text-iron-200">
            {t(locale, "waves.create.outcomes.showOutcomes")}
            <input
              type="checkbox"
              checked={display.outcomesVisible}
              onChange={(event) =>
                setDisplay({
                  ...display,
                  outcomesVisible: event.target.checked,
                })
              }
              className="tw-form-checkbox tw-size-5 tw-rounded tw-border-iron-500 tw-bg-iron-950 tw-text-primary-500 focus:tw-ring-primary-400"
            />
          </label>
        )}
      </fieldset>
      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-4 sm:tw-p-5">
        <CompetitionConfigSaveActions
          busy={editor.busy}
          error={editor.error}
          invalid={errors.length > 0}
          onCancel={onClose}
        />
      </div>
    </form>
  );
}

export default function CompetitionAppearance() {
  const editable = useCompetitionConfigEditable();
  const locale = useBrowserLocale();
  const [open, setOpen] = useState(false);
  if (!editable) return null;
  return (
    <section className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="competition-appearance"
        onClick={() => setOpen((value) => !value)}
        className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-2.5 tw-border-0 tw-bg-transparent tw-p-4 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 sm:tw-px-5"
      >
        <AdjustmentsHorizontalIcon
          className="tw-size-4 tw-shrink-0 tw-text-iron-400"
          aria-hidden="true"
        />
        <span className="tw-flex-1">
          {t(locale, "waves.create.overview.advancedTitle")}
        </span>
        <ChevronDownIcon
          className={`tw-size-4 tw-text-iron-400 tw-transition-transform motion-reduce:tw-transition-none ${open ? "tw-rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        id="competition-appearance"
        hidden={!open}
        className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800"
      >
        {open && <AppearanceForm onClose={() => setOpen(false)} />}
      </div>
    </section>
  );
}
