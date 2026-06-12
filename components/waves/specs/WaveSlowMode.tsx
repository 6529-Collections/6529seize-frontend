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

interface WaveSlowModeProps {
  readonly wave: ApiWave;
}

export default function WaveSlowMode({ wave }: WaveSlowModeProps) {
  const { canEdit, mutating, saveChatUpdate, setToast } =
    useWaveSettingUpdater(wave);
  const cooldownMs = wave.chat.slow_mode_cooldown_ms ?? null;
  const isSlowModeEnabled =
    typeof cooldownMs === "number" && cooldownMs >= SLOW_MODE_MIN_MS;
  const slowModeLabel = isSlowModeEnabled
    ? `On · ${formatSlowModeInterval(cooldownMs)}`
    : "Off";
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
      editLabel="Edit slow mode"
      label="Slow mode"
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={slowModeLabel}
    />
  );
}
