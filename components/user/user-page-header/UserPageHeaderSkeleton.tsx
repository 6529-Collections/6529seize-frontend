/**
 * Placeholder for the profile header while its server data streams in.
 * Banner height mirrors UserPageHeaderBanner so the page does not jump when the
 * real header replaces it. It carries no text, so it stays out of the
 * accessibility tree until the real header arrives.
 */
export default function UserPageHeaderSkeleton() {
  return (
    <div className="tailwind-scope" aria-hidden="true">
      <div className="tw-h-28 tw-w-full tw-bg-iron-900 sm:tw-h-40 md:tw-h-52" />
      <div className="tw-relative tw-bg-black tw-px-4 tw-pb-4 tw-pt-3.5 sm:tw-px-6 md:tw-px-8 md:tw-pb-8">
        <div className="-tw-mt-10 tw-size-20 tw-rounded-xl tw-bg-iron-800 motion-safe:tw-animate-pulse sm:tw-absolute sm:-tw-top-14 sm:tw-mt-0 sm:tw-size-28" />
        <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-3 sm:tw-mt-0 sm:tw-pt-16 lg:tw-pl-[132px] lg:tw-pt-1">
          <div className="tw-h-7 tw-w-48 tw-rounded tw-bg-iron-800 motion-safe:tw-animate-pulse" />
          <div className="tw-h-4 tw-w-72 tw-max-w-full tw-rounded tw-bg-iron-900 motion-safe:tw-animate-pulse" />
        </div>
      </div>
    </div>
  );
}
