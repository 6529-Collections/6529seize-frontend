export default function AllowlistToolBuilderOperationsLoading() {
  return (
    <div>
      <div className="tw-border tw-border-blue-300 tw-shadow tw-rounded-md tw-p-4 tw-w-full tw-mx-auto tw-space-y-2">
        {Array(5)
          .fill(null)
          .map((_, i) => (
            <div
              className="tw-animate-pulse tw-h-24 tw-w-full tw-bg-slate-700 rounded"
              key={i}
            ></div>
          ))}
      </div>
    </div>
  );
}
