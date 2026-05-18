"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  SLOW_MODE_MIN_MS,
  SLOW_MODE_UNITS,
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
import { useContext, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";

interface WaveSlowModeProps {
  readonly wave: ApiWave;
}

const isSlowModeUnit = (value: string): value is SlowModeUnit =>
  SLOW_MODE_UNITS.some((unit) => unit === value);

export default function WaveSlowMode({ wave }: WaveSlowModeProps) {
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const canEdit = canEditWave({ connectedProfile, activeProfileProxy, wave });
  const cooldownMs = wave.chat.slow_mode_cooldown_ms ?? null;
  const isSlowModeEnabled =
    typeof cooldownMs === "number" && cooldownMs >= SLOW_MODE_MIN_MS;
  const slowModeLabel = isSlowModeEnabled
    ? `On · ${formatSlowModeInterval(cooldownMs)}`
    : "Off";
  const initialParts = getSlowModeInputParts(cooldownMs);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [value, setValue] = useState(String(initialParts.value));
  const [unit, setUnit] = useState<SlowModeUnit>(initialParts.unit);
  const [mutating, setMutating] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useClickAway(popoverRef, () => setIsEditorOpen(false));
  useKeyPressEvent("Escape", () => setIsEditorOpen(false));

  const openEditor = () => {
    const nextParts = getSlowModeInputParts(cooldownMs);
    setValue(String(nextParts.value));
    setUnit(nextParts.unit);
    setIsEditorOpen(true);
  };

  const updateWave = async (body: ApiUpdateWaveRequest): Promise<void> => {
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        type: "error",
        message: "Failed to authenticate",
      });
      setMutating(false);
      return;
    }

    try {
      await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
        endpoint: `waves/${wave.id}`,
        body,
      });
      onWaveCreated();
      setIsEditorOpen(false);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : String(error),
        type: "error",
      });
    } finally {
      setMutating(false);
    }
  };

  const handleSave = () => {
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
    void updateWave({
      ...body,
      chat: {
        ...body.chat,
        slow_mode_cooldown_ms: getSlowModeMs({ value: parsedValue, unit }),
      },
    });
  };

  const handleDisable = () => {
    if (mutating) {
      return;
    }

    const body = convertWaveToUpdateWave(wave);
    delete body.chat.slow_mode_cooldown_ms;
    void updateWave(body);
  };

  return (
    <div className="tw-group tw-relative tw-flex tw-min-h-6 tw-w-full tw-items-center tw-justify-between tw-gap-1.5 tw-text-sm">
      <span className="tw-font-medium tw-text-iron-400">Slow mode</span>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <span className="tw-font-medium tw-text-iron-200">{slowModeLabel}</span>
        {canEdit && (
          <button
            type="button"
            aria-label="Edit slow mode"
            title="Edit slow mode"
            onClick={openEditor}
            className="tw-border-none tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-400"
          >
            <PencilIcon size={PencilIconSize.SMALL} />
          </button>
        )}
      </div>

      {isEditorOpen && (
        <div
          ref={popoverRef}
          className="tw-absolute tw-right-0 tw-top-7 tw-z-20 tw-w-64 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-3 tw-shadow-xl"
        >
          <form
            className="tw-flex tw-flex-col tw-gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            <div className="tw-flex tw-gap-2">
              <input
                aria-label="Slow mode value"
                className="tw-min-w-0 tw-flex-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
                disabled={mutating}
                min={1}
                step={1}
                type="number"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
              <select
                aria-label="Slow mode unit"
                className="tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
                disabled={mutating}
                value={unit}
                onChange={(event) => {
                  if (isSlowModeUnit(event.target.value)) {
                    setUnit(event.target.value);
                  }
                }}
              >
                {SLOW_MODE_UNITS.map((slowModeUnit) => (
                  <option key={slowModeUnit} value={slowModeUnit}>
                    {slowModeUnit}
                  </option>
                ))}
              </select>
            </div>

            <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
              <button
                type="button"
                disabled={mutating}
                onClick={() => setIsEditorOpen(false)}
                className="tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-text-iron-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={mutating || !isSlowModeEnabled}
                onClick={handleDisable}
                className="tw-rounded-md tw-border tw-border-solid tw-border-red/40 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-red tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-red desktop-hover:hover:tw-text-red"
              >
                Disable
              </button>
              <button
                type="submit"
                disabled={mutating}
                className="tw-rounded-md tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-primary-600 desktop-hover:hover:tw-bg-primary-600"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
