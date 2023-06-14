export default function AllowlistToolAllowlistsLoading() {
  return (
    <div>
      <div className="tw-pt-6 tw-w-full tw-mx-auto tw-space-y-4">
        {Array(5)
          .fill(null)
          .map((_, i) => (
            <div
              className="tw-animate-pulse tw-h-24 tw-w-full tw-bg-transparent tw-border tw-border-solid tw-border-neutral-700/60 tw-rounded-lg"
              key={i}
            >
              <div className="tw-px-4 sm:tw-px-6 tw-py-5 tw-h-full tw-flex tw-items-center tw-justify-between">
                <div>
                  <div className="tw-h-2.5 tw-bg-neutral-600 tw-rounded-full tw-w-24 tw-mb-2.5"></div>
                  <div className="tw-w-32 tw-h-2 tw-bg-neutral-700 tw-rounded-full"></div>
                </div>
                <div className="tw-h-2.5 tw-bg-neutral-700 tw-rounded-full tw-w-12"></div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
