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
            <div className="tw-pt-1.5 tw-relative tw-flex tw-items-center tw-gap-x-2">
              <svg
                className="tw-size-5 tw-flex-shrink-0 tw-text-error"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="tw-relative tw-z-10 tw-text-error tw-text-xs tw-font-medium">
                Name is required
              </div>
            </div>
          )}
        </CommonAnimationHeight>
      </div>
    </div>
  );
}
