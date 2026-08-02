export default function MuseumNetworkLoading() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-iron-950 tw-px-4 tw-py-8 sm:tw-px-6 lg:tw-px-10">
      <div className="tw-mx-auto tw-w-full tw-max-w-6xl tw-animate-pulse">
        <div className="tw-h-6 tw-w-40 tw-rounded tw-bg-iron-800" />
        <div className="tw-mt-4 tw-h-12 tw-max-w-xl tw-rounded tw-bg-iron-800" />
        <div className="tw-mt-8 tw-h-28 tw-rounded-2xl tw-bg-iron-900" />
        <div className="tw-mt-8 tw-grid tw-gap-4 md:tw-grid-cols-3">
          <div className="tw-h-36 tw-rounded-2xl tw-bg-iron-900" />
          <div className="tw-h-36 tw-rounded-2xl tw-bg-iron-900" />
          <div className="tw-h-36 tw-rounded-2xl tw-bg-iron-900" />
        </div>
      </div>
    </main>
  );
}
