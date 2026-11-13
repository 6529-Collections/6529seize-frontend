"use client";

import { useState } from "react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  useCompetitionConfigEditable,
  useCompetitionConfigUpdate,
} from "@/hooks/competitions/useCompetitionConfigUpdate";
import { t } from "@/i18n/messages";
import {
  WAVE_CUSTOM_RULES_MAX_LENGTH,
  WAVE_DISPLAY_METADATA_KEYS,
} from "@/helpers/waves/wave-metadata.helpers";
import WaveGroupEditButton from "@/components/waves/specs/groups/group/edit/buttons/subcomponents/WaveGroupEditButton";
import CompetitionPhaseBadge from "./CompetitionPhaseBadge";
import CompetitionConfigSaveActions from "./CompetitionConfigSaveActions";
import { COMPETITION_INPUT } from "./CompetitionState";

function OverviewForm({
  guidelines,
  onClose,
}: {
  readonly guidelines: string;
  readonly onClose: () => void;
}) {
  const { competition } = useCompetition();
  const locale = useBrowserLocale();
  const [title, setTitle] = useState(competition.title);
  const [description, setDescription] = useState(competition.description ?? "");
  const [rules, setRules] = useState(guidelines);
  const editor = useCompetitionConfigUpdate();
  const save = async () => {
    if (!title.trim()) return;
    const saved = await editor.save(
      JSON.stringify({ title, description, rules }),
      (config) => ({
        ...config,
        title: title.trim(),
        description: description.trim() || null,
        presentation: [
          ...config.presentation.filter(
            (item) => item.data_key !== WAVE_DISPLAY_METADATA_KEYS.customRules
          ),
          ...(rules.trim()
            ? [
                {
                  data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
                  data_value: rules.trim(),
                },
              ]
            : []),
        ],
      })
    );
    if (saved) onClose();
  };
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="tw-space-y-4"
    >
      <fieldset
        disabled={editor.busy}
        className="tw-m-0 tw-min-w-0 tw-space-y-4 tw-border-0 tw-p-0"
      >
        <div>
          <label
            htmlFor="competition-inline-title"
            className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
          >
            {t(locale, "competitions.titleLabel")}
          </label>
          <input
            id="competition-inline-title"
            className={`${COMPETITION_INPUT} tw-text-base sm:tw-text-sm`}
            required
            maxLength={250}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="competition-inline-description"
            className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
          >
            {t(locale, "competitions.description")}
          </label>
          <textarea
            id="competition-inline-description"
            className={`${COMPETITION_INPUT} tw-resize-y tw-text-base sm:tw-text-sm`}
            rows={3}
            maxLength={50000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="competition-inline-guidelines"
            className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
          >
            {t(locale, "competitions.guidelines")}
          </label>
          <textarea
            id="competition-inline-guidelines"
            className={`${COMPETITION_INPUT} tw-resize-y tw-text-base sm:tw-text-sm`}
            rows={5}
            maxLength={WAVE_CUSTOM_RULES_MAX_LENGTH}
            value={rules}
            onChange={(event) => setRules(event.target.value)}
          />
        </div>
      </fieldset>
      <CompetitionConfigSaveActions
        busy={editor.busy}
        error={editor.error}
        invalid={!title.trim()}
        onCancel={onClose}
      />
    </form>
  );
}

export default function CompetitionOverview() {
  const { competition } = useCompetition();
  const editable = useCompetitionConfigEditable();
  const locale = useBrowserLocale();
  const [editing, setEditing] = useState(false);
  const guidelines =
    competition.presentation?.find(
      (item) => item.data_key === WAVE_DISPLAY_METADATA_KEYS.customRules
    )?.data_value ?? "";
  return (
    <section className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950">
      <div className="tw-space-y-4 tw-p-4 sm:tw-p-5">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-400">
              {t(locale, `competitions.type.${competition.type}`)}
            </span>
            <CompetitionPhaseBadge phase={competition.computed_phase} />
          </div>
          {editable && !editing && (
            <WaveGroupEditButton
              disabled={false}
              loading={false}
              label={t(locale, "competitions.editDetails")}
              onClick={() => setEditing(true)}
            />
          )}
        </div>
        {editing && editable ? (
          <OverviewForm
            guidelines={guidelines}
            onClose={() => setEditing(false)}
          />
        ) : (
          <>
            <h2 className="tw-m-0 tw-break-words tw-text-lg tw-font-semibold tw-text-iron-100 [overflow-wrap:anywhere]">
              {competition.title}
            </h2>
            {competition.description && (
              <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-200 [overflow-wrap:anywhere]">
                {competition.description}
              </p>
            )}
            {(guidelines || editable) && (
              <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4">
                <h3 className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-iron-100">
                  <DocumentTextIcon
                    className="tw-size-4 tw-text-iron-400"
                    aria-hidden="true"
                  />
                  {t(locale, "competitions.guidelines")}
                </h3>
                <p className="tw-mb-0 tw-mt-2 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-300 [overflow-wrap:anywhere]">
                  {guidelines || t(locale, "competitions.noGuidelines")}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
