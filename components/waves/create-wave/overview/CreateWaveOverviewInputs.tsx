import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.helpers";
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";
import CreateWaveOverviewInput from "./CreateWaveOverviewInput";

export default function CreateWaveOverviewInputs({
  name,
  errors,
  onChange,
}: {
  readonly name: string;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onChange: (param: {
    readonly key: "name";
    readonly value: string;
  }) => void;
}) {
  const isNameError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED
  );

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <div>
        <div className="tw-group tw-w-full tw-relative">
          <CreateWaveOverviewInput
            valueKey="name"
            onValueChange={onChange}
            isError={isNameError}
            value={name}
          />
        </div>
        <CommonAnimationHeight>
          {isNameError && (
            <div className="tw-relative tw-mt-1.5 tw-z-10 tw-text-error tw-text-xs tw-font-medium">
              Name is required
            </div>
          )}
        </CommonAnimationHeight>
      </div>
    </div>
  );
}
