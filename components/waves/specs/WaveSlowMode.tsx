"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import {
  SLOW_MODE_MIN_MS,
  formatSlowModeInterval,
  getSlowModeInputParts,
  getSlowModeMs,
  type SlowModeUnit,
} from "@/helpers/waves/slow-mode.helpers";
import { useCallback, useRef, useState } from "react";
import WaveSettingRow from "./WaveSettingRow";
import WaveSlowModeEditorForm from "./WaveSlowModeEditorForm";
import { useWaveSettingUpdater } from "./useWaveSettingUpdater";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

interface WaveSlowModeProps {
  readonly wave: ApiWave;
  readonly display?: "configuration" | "settings" | undefined;
}

export default function WaveSlowMode({
  wave,
  display = "settings",
}: WaveSlowModeProps) {
  const { canEdit, mutating, saveChatUpdate, setToast } =
    useWaveSettingUpdater(wave);
  const cooldownMs = wave.chat.slow_mode_cooldown_ms ?? null;
  const isSlowModeEnabled =
    typeof cooldownMs === "number" && cooldownMs >= SLOW_MODE_MIN_MS;
  let slowModeLabel = isSlowModeEnabled
    ? `On · ${formatSlowModeInterval(cooldownMs)}`
    : "Off";
  if (display === "configuration") {
    slowModeLabel = isSlowModeEnabled
      ? waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.chat.slowMode.on",
          { interval: formatSlowModeInterval(cooldownMs) }
        )
      : waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.chat.slowMode.off"
        );
  }
  const initialParts = getSlowModeInputParts(cooldownMs);
  const [value, setValue] = useState(String(initialParts.value));
  const [unit, setUnit] = useState<SlowModeUnit>(initialParts.unit);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetEditor = useCallback(() => {
    const nextParts = getSlowModeInputParts(cooldownMs);
    setValue(String(nextParts.value));
    setUnit(nextParts.unit);
  }, [cooldownMs]);

  const handleSave = (closeEditor: () => void) => {
    const parsedValue = Number(value);
    if (
      !Number.isInteger(parsedValue) ||
      parsedValue <= 0 ||
      getSlowModeMs({ value: parsedValue, unit }) < SLOW_MODE_MIN_MS
    ) {
      setToast({
        type: "error",
        message: "Slow mode must be at least 1 second.",
      });
      return;
    }

    saveChatUpdate(closeEditor, (chat) => ({
      ...chat,
      slow_mode_cooldown_ms: getSlowModeMs({ value: parsedValue, unit }),
    }));
  };

  const handleDisable = (closeEditor: () => void) => {
    saveChatUpdate(closeEditor, (chat) => {
      const nextChat = { ...chat };
      delete nextChat.slow_mode_cooldown_ms;
      return nextChat;
    });
  };

  const renderEditor = ({
    closeEditor,
  }: {
    readonly closeEditor: () => void;
  }) => (
    <WaveSlowModeEditorForm
      disabled={mutating}
      inputRef={inputRef}
      isSlowModeEnabled={isSlowModeEnabled}
      onCancel={closeEditor}
      onDisable={() => handleDisable(closeEditor)}
      onSave={() => handleSave(closeEditor)}
      onUnitChange={setUnit}
      onValueChange={setValue}
      unit={unit}
      value={value}
    />
  );

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editIcon={display === "configuration" ? "gear" : "pencil"}
      editLabel={
        display === "configuration"
          ? waveRightPanelText(
              "waves.sidebar.rightPanel.configuration.chat.slowMode.edit"
            )
          : "Edit slow mode"
      }
      label={
        display === "configuration"
          ? waveRightPanelText(
              "waves.sidebar.rightPanel.configuration.chat.slowMode.label"
            )
          : "Slow mode"
      }
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={slowModeLabel}
    />
  );
}
