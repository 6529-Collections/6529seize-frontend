"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  canEditWave,
  convertWaveToUpdateWave,
} from "@/helpers/waves/waves.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useCallback, useContext, useState } from "react";
import WaveSettingRow from "./WaveSettingRow";

interface WaveDisableLinksProps {
  readonly wave: ApiWave;
}

export default function WaveDisableLinks({ wave }: WaveDisableLinksProps) {
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const canEdit = canEditWave({ connectedProfile, activeProfileProxy, wave });
  const linksDisabled = wave.chat.links_disabled === true;
  const [draftLinksDisabled, setDraftLinksDisabled] = useState(linksDisabled);
  const [mutating, setMutating] = useState(false);

  const resetEditor = useCallback(() => {
    setDraftLinksDisabled(linksDisabled);
  }, [linksDisabled]);

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

    const body = convertWaveToUpdateWave(wave);
    void updateWave(
      {
        ...body,
        chat: {
          ...body.chat,
          links_disabled: draftLinksDisabled,
        },
      },
      closeEditor
    );
  };

  const renderEditor = ({
    closeEditor,
  }: {
    readonly closeEditor: () => void;
  }) => (
    <form
      className="tw-flex tw-flex-col tw-gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        handleSave(closeEditor);
      }}
    >
      <label className="tw-flex tw-cursor-pointer tw-items-start tw-gap-2 tw-text-sm tw-text-iron-100">
        <input
          type="checkbox"
          aria-label="Disable links"
          autoFocus
          checked={draftLinksDisabled}
          disabled={mutating}
          onChange={(event) => setDraftLinksDisabled(event.target.checked)}
          className="tw-mt-0.5 tw-h-4 tw-w-4 tw-rounded tw-border-iron-600 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
        />
        <span>Disable links</span>
      </label>

      <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
        <button
          type="button"
          disabled={mutating}
          onClick={closeEditor}
          className="tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-text-iron-100"
        >
          Cancel
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
  );

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editLabel="Edit disable links"
      label="Disable links"
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={linksDisabled ? "On" : "Off"}
    />
  );
}
