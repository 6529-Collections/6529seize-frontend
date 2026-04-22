import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";

export default function CreateWaveNameInput({
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
  const errorId = "create-wave-name-error";

  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ key: "name", value: event.target.value });
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-3">
      <div>
        <div className="tw-group tw-relative tw-w-full">
          <div className="tw-relative">
            <input
              type="text"
              onChange={onNameChange}
              value={name}
              id="create-wave-name"
              autoComplete="off"
              aria-required={true}
              aria-invalid={isNameError}
              aria-describedby={isNameError ? errorId : undefined}
              className={`${
                isNameError
                  ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
                  : "tw-border-white/5 tw-caret-primary-400 tw-ring-white/5 hover:tw-ring-white/10 focus:tw-border-primary-500/50 focus:tw-ring-primary-400"
              } tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-px-4 tw-py-3 tw-text-base sm:tw-text-sm ${
                name
                  ? "tw-text-primary-400 focus:tw-text-white"
                  : "tw-text-white"
              } tw-peer tw-bg-iron-900 tw-font-medium tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset`}
              placeholder=" "
            />
            <label
              htmlFor="create-wave-name"
              className={`${
                isNameError
                  ? "peer-focus:tw-text-error"
                  : "peer-focus:tw-text-primary-400"
              } tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-bg-iron-900 tw-px-2 tw-text-sm tw-font-normal tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4`}
            >
              Wave Name{" "}
              <span className="tw-text-error" aria-hidden="true">
                *
              </span>
            </label>
          </div>
        </div>
        <CommonAnimationHeight>
          {isNameError && (
            <div
              id={errorId}
              className="tw-relative tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5"
            >
              <svg
                className="tw-size-4 tw-flex-shrink-0 tw-text-error"
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
              <div className="tw-relative tw-z-10 tw-text-xs tw-font-medium tw-text-error">
                Name is required
              </div>
            </div>
          )}
        </CommonAnimationHeight>
      </div>
    </div>
  );
}
