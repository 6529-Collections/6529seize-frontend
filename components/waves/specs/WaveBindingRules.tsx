"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { normalizeWaveCustomRules } from "@/helpers/waves/wave-metadata.helpers";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import WaveSettingEditorActions from "./WaveSettingEditorActions";
import WaveSettingRow from "./WaveSettingRow";
import { useWaveSettingUpdater } from "./useWaveSettingUpdater";

interface WaveBindingRulesProps {
  readonly wave: ApiWave;
  readonly display?: "configuration" | "settings";
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
  const helperId = "wave-binding-rules-helper";

  return (
    // react-doctor-disable-next-line react-doctor/no-prevent-default -- This client-authenticated editor needs native Enter-key submission without navigation.
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="tw-flex tw-flex-col tw-gap-3"
    >
      <label
        htmlFor="wave-binding-rules"
        className="tw-text-sm tw-font-medium tw-text-iron-100"
      >
        {waveRightPanelText(
          "waves.sidebar.rightPanel.settings.rules.acceptance.editorLabel"
        )}
      </label>
      <textarea
        id="wave-binding-rules"
        aria-describedby={helperId}
        autoFocus
        disabled={mutating}
        rows={5}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        className="tw-form-textarea tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
        placeholder={waveRightPanelText(
          "waves.sidebar.rightPanel.settings.rules.acceptance.placeholder"
        )}
      />
      <p
        id={helperId}
        className="tw-mb-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-500"
      >
        {waveRightPanelText(
          "waves.sidebar.rightPanel.settings.rules.acceptance.helper"
        )}
      </p>
      <WaveSettingEditorActions
        disabled={mutating}
        onCancel={closeEditor}
        submitDisabled={saveDisabled}
      />
    </form>
  );
}

export default function WaveBindingRules({
  wave,
  display = "settings",
}: WaveBindingRulesProps) {
  const { canEdit, mutating, saveParticipationUpdate } =
    useWaveSettingUpdater(wave);
  const bindingRules = useMemo(
    () => normalizeWaveCustomRules(wave.participation.terms),
    [wave.participation.terms]
  );
  const [draft, setDraft] = useState("");
  const isConfiguration = display === "configuration";

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

  let valueLabel: ReactNode;
  if (isConfiguration) {
    valueLabel = bindingRules ? (
      <div className="tw-flex tw-flex-col tw-gap-2">
        <p className="tw-mb-0 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-tracking-[0.06em] tw-text-primary-300 sm:tw-tracking-[0.08em]">
          {waveRightPanelText(
            "waves.sidebar.rightPanel.rules.requiresAcceptance"
          )}
        </p>
        <p className="tw-mb-0 tw-whitespace-pre-wrap tw-break-words">
          {bindingRules}
        </p>
        {wave.participation.signature_required && (
          <p className="tw-mb-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400">
            {waveRightPanelText(
              "waves.sidebar.rightPanel.rules.signatureRequired"
            )}
          </p>
        )}
      </div>
    ) : (
      <p className="tw-mb-0 tw-font-light tw-italic tw-text-iron-500">
        {waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.rules.emptyAcceptance"
        )}
      </p>
    );
  } else {
    valueLabel = waveRightPanelText(
      bindingRules
        ? "waves.sidebar.rightPanel.settings.rules.acceptance.added"
        : "waves.sidebar.rightPanel.settings.rules.acceptance.none"
    );
  }

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editIcon={isConfiguration ? "gear" : "pencil"}
      editLabel={waveRightPanelText(
        "waves.sidebar.rightPanel.settings.rules.acceptance.edit"
      )}
      label={waveRightPanelText(
        isConfiguration
          ? "waves.sidebar.rightPanel.rules.title"
          : "waves.sidebar.rightPanel.settings.rules.acceptance.label"
      )}
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
      valueLabel={valueLabel}
      variant={isConfiguration ? "content" : "row"}
    />
  );
}
