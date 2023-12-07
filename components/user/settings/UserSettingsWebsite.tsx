export default function UserSettingsWebsite({
  website,
  setWebsite,
}: {
  website: string;
  setWebsite: (website: string) => void;
}) {
  return (
    <div>
      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-350 tw-mt-6">
        Website
      </label>
      <div className="tw-mt-2">
        <input
          type="text"
          name="name"
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-900 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/20 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 hover:tw-ring-iron-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
      </div>
    </div>
  );
}
