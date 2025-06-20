"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { CreateDropConfig } from "../../../../entities/IDrop";

import DropEditor, {
  DropEditorHandles,
} from "../../../drops/create/DropEditor";
import { profileAndConsolidationsToProfileMin } from "../../../../helpers/ProfileHelpers";
import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
import { CreateDropType } from "../../../drops/create/types";
export interface CreateWaveDescriptionHandles {
  requestDrop: () => CreateDropConfig | null;
}

interface CreateWaveDescriptionWaveProps {
  readonly name: string;
  readonly image: string | null;
  readonly id: string | null;
}

interface CreateWaveDescriptionProps {
  readonly profile: ApiIdentity;
  readonly wave: CreateWaveDescriptionWaveProps;
  readonly showDropError: boolean;
  readonly onHaveDropToSubmitChange: (canSubmit: boolean) => void;
}

const CreateWaveDescription = forwardRef<
  CreateWaveDescriptionHandles,
  CreateWaveDescriptionProps
>(({ profile, showDropError, wave, onHaveDropToSubmitChange }, ref) => {
  const dropEditorRef = useRef<DropEditorHandles | null>(null);
  const profileMin = profileAndConsolidationsToProfileMin({ profile });

  const requestDrop = (): CreateDropConfig | null =>
    dropEditorRef.current?.requestDrop() ?? null;

  useImperativeHandle(ref, () => ({
    requestDrop,
  }));

  if (!profileMin) {
    return null;
  }

  return (
    <div>
      <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
        Description
      </p>
      <p className="tw-mt-2 tw-mb-0 tw-text-base tw-font-normal tw-text-iron-400">
        Give a good description of your wave so participants know what you
        expect in this wave. More information, including any content moderation
        parameters, is better than less.
      </p>
      <div className="tw-mt-6">
        <DropEditor
          ref={dropEditorRef}
          waveId={null}
          profile={profileMin}
          quotedDrop={null}
          type={CreateDropType.DROP}
          loading={false}
          showSubmit={false}
          dropEditorRefreshKey={1}
          showDropError={showDropError}
          wave={wave}
          onSubmitDrop={() => {}}
          onCanSubmitChange={onHaveDropToSubmitChange}
        />
      </div>
    </div>
  );
});

CreateWaveDescription.displayName = "CreateWaveDescription";
export default CreateWaveDescription;
