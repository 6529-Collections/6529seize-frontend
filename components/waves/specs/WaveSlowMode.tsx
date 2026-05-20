"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  SLOW_MODE_MIN_MS,
  formatSlowModeInterval,
  getSlowModeInputParts,
  getSlowModeMs,
  type SlowModeUnit,
} from "@/helpers/waves/slow-mode.helpers";
import {
  canEditWave,
  convertWaveToUpdateWave,
} from "@/helpers/waves/waves.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useCallback, useContext, useRef, useState } from "react";
import WaveSlowModeEditorForm from "./WaveSlowModeEditorForm";
import WaveSettingRow from "./WaveSettingRow";

interface WaveSlowModeProps {
  readonly wave: ApiWave;
}

export default function WaveSlowMode({ wave }: WaveSlowModeProps) {
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const canEdit = canEditWave({ connectedProfile, activeProfileProxy, wave });
  const cooldownMs = wave.chat.slow_mode_cooldown_ms ?? null;
  const isSlowModeEnabled =
    typeof cooldownMs === "number" && cooldownMs >= SLOW_MODE_MIN_MS;
  const slowModeLabel = isSlowModeEnabled
    ? `On · ${formatSlowModeInterval(cooldownMs)}`
    : "Off";
  const initialParts = getSlowModeInputParts(cooldownMs);
  const [value, setValue] = useState(String(initialParts.value));
  const [unit, setUnit] = useState<SlowModeUnit>(initialParts.unit);
  const [mutating, setMutating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetEditor = useCallback(() => {
    const nextParts = getSlowModeInputParts(cooldownMs);
    setValue(String(nextParts.value));
    setUnit(nextParts.unit);
  }, [cooldownMs]);

  const updateWave = async (
    body: ApiUpdateWaveRequest,
    closeEditor: () => void
  ): Promise<void> => {
    setMutating(true);

    try {
      const { success } = await requestAuth();
      if (!success) {
        setToast({
          type: "error",
          message: "Failed to authenticate",
        });
        return;
      }

      await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
        endpoint: `waves/${wave.id}`,
        body,
      });
      onWaveCreated();
      closeEditor();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : String(error),
        type: "error",
      });
    } finally {
      setMutating(false);
    }
  };

  const handleSave = (closeEditor: () => void) => {
    if (mutating) {
      return;
    }

    const parsedValue = Number(value);
    if (
      !Number.isInteger(parsedValue) ||
      parsedValue <= 0 ||
      getSlowModeMs({ value: parsedValue, unit }) < SLOW_MODE_MIN_MS
    ) {
      setToast({
        type: "error",
        message: "Slow mode must be at least 1 second",
      });
      return;
    }

    const body = convertWaveToUpdateWave(wave);
    void updateWave(
      {
        ...body,
        chat: {
          ...body.chat,
          slow_mode_cooldown_ms: getSlowModeMs({ value: parsedValue, unit }),
        },
      },
      closeEditor
    );
  };

  const handleDisable = (closeEditor: () => void) => {
    if (mutating) {
      return;
    }

    const body = convertWaveToUpdateWave(wave);
    delete body.chat.slow_mode_cooldown_ms;
    void updateWave(body, closeEditor);
  };

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editLabel="Edit slow mode"
      label="Slow mode"
      onOpen={resetEditor}
      valueLabel={slowModeLabel}
      renderEditor={({ closeEditor }) => (
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
      )}
    />
  );
}
