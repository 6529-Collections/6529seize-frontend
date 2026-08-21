const INPUT_ID = "wave-header-name-edit";

export default function WaveHeaderNameEditInput({
  name,
  setName,
}: {
  readonly name: string;
  readonly setName: (newName: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={INPUT_ID}
        className="tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-300"
      >
        Wave name
      </label>
      <div className="tw-relative tw-mt-2">
        <input
          id={INPUT_ID}
          type="text"
          name="name"
          required
          autoComplete="off"
          // headless-ui picks initial focus from data-autofocus; the dialog now
          // keeps the field clear of the keyboard, so opening straight into it
          // saves a tap.
          autoFocus
          data-autofocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Please select a name"
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-3 tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-400 hover:tw-ring-iron-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
        />
      </div>
    </div>
  );
}
