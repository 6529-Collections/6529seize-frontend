"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { normalizeWaveCustomRules } from "@/helpers/waves/wave-metadata.helpers";
import { useCallback, useMemo, useState } from "react";
import WaveSettingEditorActions from "./WaveSettingEditorActions";
import WaveSettingRow from "./WaveSettingRow";
import { useWaveSettingUpdater } from "./useWaveSettingUpdater";

interface WaveBindingRulesProps {
  readonly wave: ApiWave;
}

interface WaveBindingRulesEditorProps {
  readonly closeEditor: () => void;
  readonly draft: string;
  readonly mutating: boolean;
  readonly saveDisabled: boolean;
  readonly onDraftChange: (draft: string) => void;
  readonly onSubmit: () => void;
}

function WaveBindingRulesEditor({
  closeEditor,
  draft,
  mutating,
  saveDisabled,
  onDraftChange,
  onSubmit,
}: WaveBindingRulesEditorProps) {
  return (
    <form
      className="tw-flex tw-flex-col tw-gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label
        htmlFor="wave-binding-rules"
        className="tw-text-sm tw-font-medium tw-text-iron-100"
      >
        Rules that require acceptance
      </label>
      <textarea
        id="wave-binding-rules"
        autoFocus
        disabled={mutating}
        rows={5}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        className="tw-form-textarea tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
        placeholder="Add rules participants must accept before submitting..."
      />
      <p className="tw-mb-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-500">
        Participants sign these rules with their wallet before submitting. Clear
        the field to remove the acceptance requirement.
      </p>
      <WaveSettingEditorActions
        disabled={mutating}
        onCancel={closeEditor}
        submitDisabled={saveDisabled}
      />
    </form>
  );
}

export default function WaveBindingRules({ wave }: WaveBindingRulesProps) {
  const { canEdit, mutating, saveParticipationUpdate } =
    useWaveSettingUpdater(wave);
  const bindingRules = useMemo(
    () => normalizeWaveCustomRules(wave.participation.terms),
    [wave.participation.terms]
  );
  const [draft, setDraft] = useState("");

  const resetEditor = useCallback(() => {
    setDraft(bindingRules);
  }, [bindingRules]);

  const normalizedDraft = normalizeWaveCustomRules(draft);
  const saveDisabled = normalizedDraft === bindingRules;

  const saveBindingRules = (closeEditor: () => void) => {
    saveParticipationUpdate(closeEditor, (participation) => ({
      ...participation,
      terms: normalizedDraft || null,
      signature_required: Boolean(normalizedDraft),
    }));
  };

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editLabel="Edit acceptance rules"
      label="Acceptance rules"
      onOpen={resetEditor}
      renderEditor={({ closeEditor }) => (
        <WaveBindingRulesEditor
          closeEditor={closeEditor}
          draft={draft}
          mutating={mutating}
          saveDisabled={saveDisabled}
          onDraftChange={setDraft}
          onSubmit={() => saveBindingRules(closeEditor)}
        />
      )}
      valueLabel={bindingRules ? "Added" : "None"}
    />
  );
}
