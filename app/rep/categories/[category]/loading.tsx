export default function GlobalRepCategoryLoading() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-[#050506] tw-px-4 tw-py-10 sm:tw-px-6 lg:tw-px-8">
      <div
        aria-live="polite"
        aria-label="Loading REP category details"
        className="tw-mx-auto tw-flex tw-w-full tw-max-w-7xl tw-flex-col tw-gap-4"
      >
        <span className="tw-sr-only">Loading REP category details</span>
        <div
          aria-hidden="true"
          className="tw-h-5 tw-w-40 tw-animate-pulse tw-rounded tw-bg-white/10"
        />
        <div
          aria-hidden="true"
          className="tw-h-10 tw-w-80 tw-max-w-full tw-animate-pulse tw-rounded tw-bg-white/10"
        />
        <div
          aria-hidden="true"
          className="tw-h-64 tw-w-full tw-animate-pulse tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03]"
        />
      </div>
    </main>
  );
}
