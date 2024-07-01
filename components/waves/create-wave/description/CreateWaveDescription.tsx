import { forwardRef, useImperativeHandle, useRef } from "react";
import { CreateDropConfig } from "../../../../entities/IDrop";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { CreateDropType } from "../../../drops/create/CreateDrop";
import DropEditor, {
  DropEditorHandles,
} from "../../../drops/create/DropEditor";

export interface CreateWaveDescriptionHandles {
  requestDrop: () => CreateDropConfig | null;
}

const CreateWaveDescription = forwardRef<
  CreateWaveDescriptionHandles,
  {
    readonly profile: IProfileAndConsolidations;
    readonly showDropError: boolean;
    readonly onHaveDropToSubmitChange: (canSubmit: boolean) => void;
  }
>(({ profile, showDropError, onHaveDropToSubmitChange }, ref) => {
  const dropEditorRef = useRef<DropEditorHandles | null>(null);

  const requestDrop = (): CreateDropConfig | null =>
    dropEditorRef.current?.requestDrop() ?? null;

  useImperativeHandle(ref, () => ({
    requestDrop,
  }));

  return (
    <div>
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        Description
      </p>
      <p className="tw-mt-2 tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-400">
        Give a good description of your wave so participants know what you
        expect in this wave. More information, including any content moderation
        parameters, is better than less.
      </p>
      <div className="tw-mt-6">
        <DropEditor
          ref={dropEditorRef}
          profile={profile}
          quotedDrop={null}
          type={CreateDropType.DROP}
          loading={false}
          showSubmit={false}
          dropEditorRefreshKey={1}
          showDropError={showDropError}
          onSubmitDrop={() => {}}
          onCanSubmitChange={onHaveDropToSubmitChange}
        />
      </div>
    </div>
  );
});

CreateWaveDescription.displayName = "CreateWaveDescription";
export default CreateWaveDescription;
