export default function AllowlistToolBuilderOperationsLoading() {
  return (
    <div>
      <div className="tw-mt-4 tw-w-full tw-mx-auto tw-space-y-2">
        {Array(5)
          .fill(null)
          .map((_, i) => (
            <div
              className="tw-animate-pulse tw-h-24 tw-w-full tw-bg-transparent tw-border tw-border-solid tw-border-neutral-700/60 tw-rounded-lg"
              key={i}
            >
              <div className="p-4">
                <div className="tw-h-2.5 tw-rounded-full tw-bg-neutral-600 tw-w-24 tw-mb-2.5"></div>
                <div className="tw-w-32 tw-h-2 tw-rounded-full tw-bg-neutral-700 tw-mb-2.5"></div>
                <div className="tw-w-32 tw-h-2 tw-rounded-full tw-bg-neutral-700"></div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
