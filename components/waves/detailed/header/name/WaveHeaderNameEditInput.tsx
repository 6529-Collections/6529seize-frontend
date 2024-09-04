import { Wave } from "../../../../../generated/models/Wave";

export default function WaveHeaderNameEditInput({
  wave,
  name,
  setName,
}: {
  readonly wave: Wave;
  readonly name: string;
  readonly setName: (newName: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor="name"
        className="tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-300"
      >
        Wave name
      </label>
      <div className="tw-mt-2 tw-relative">
        <input
          type="text"
          name="name"
          required
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Please select a name"
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-iron-600 tw-text-base tw-transition tw-duration-300 tw-ease-out"
        />
      </div>
    </div>
  );
}
