export default function UserPageSetUpProfileHeader() {
  return (
    <div className="tw-mt-6 lg:tw-mt-8 lg:tw-flex lg:tw-items-center tw-lg:justify-between">
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-flex tw-flex-col">
          <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 tw-sm:truncate sm:tw-text-2xl sm:tw-tracking-tight">
            Ooops! You don't have a profile yet.
          </h2>
          <p className="tw-font-normal tw-text-iron-400 tw-text-base tw-mb-0">
            First lets set up your profile.
          </p>
        </div>
      </div>
    </div>
  );
}