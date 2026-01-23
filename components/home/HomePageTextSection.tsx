export default function HomePageTextSection() {
  return (
    <section className="tw-relative tw-px-3 tw-pb-10 tw-pt-8 sm:tw-px-4 md:tw-px-6 md:tw-pb-16 md:tw-pt-10 lg:tw-px-8">
      <div className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-h-[180%] tw-w-[180%] -tw-translate-x-1/2 -tw-translate-y-1/2 tw-bg-[radial-gradient(60%_60%_at_50%_50%,rgba(130,150,185,0.12),transparent_72%)] sm:tw-bg-[radial-gradient(60%_60%_at_50%_50%,rgba(130,150,185,0.18),transparent_72%)]" />
      <div className="tw-relative tw-z-10 tw-py-4 md:tw-py-8">
        <div className="tw-mx-auto tw-grid tw-grid-cols-1 tw-gap-y-2 lg:tw-gap-y-3 md:tw-max-w-2xl lg:tw-grid-cols-12 lg:tw-grid-rows-[auto_auto] lg:tw-gap-x-12 xl:tw-gap-x-4 lg:tw-max-w-none">
          <div className="lg:tw-col-span-7 lg:tw-row-start-1 md:tw-text-center lg:tw-text-left">
            <h2 className="tw-mb-0 tw-text-pretty sm:tw-text-balance tw-text-xl tw-tracking-tight tw-font-semibold tw-leading-tight tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl">
              6529 is a network society:
            </h2>
          </div>
          <div className="lg:tw-col-span-7 lg:tw-row-start-2 tw-flex tw-flex-col md:tw-text-center lg:tw-text-left">
            <p className="tw-mb-0 tw-text-balance tw-text-lg tw-font-normal tw-text-iron-300/85 sm:tw-text-xl md:tw-text-2xl">
              a decentralized, permissionless global network that funds, builds,
              and coordinates public-goods work across art, science, culture,
              and technology.
            </p>
            <p className="tw-mb-0 tw-mt-6 md:tw-mt-8 tw-text-pretty sm:tw-text-balance tw-text-xs tw-uppercase tw-tracking-[0.16em] tw-text-iron-400 lg:tw-whitespace-nowrap">
              The long-term goal is nation-scale positive impact.
            </p>
          </div>
          <div className="tw-relative tw-z-10 tw-mt-6 md:tw-mt-8 lg:tw-mt-1 tw-flex tw-flex-col tw-items-center tw-space-y-6 lg:tw-col-span-5 lg:tw-col-start-8 lg:tw-row-start-2 lg:tw-items-start">
            <div className="tw-group tw-relative tw-w-full tw-max-w-none md:tw-max-w-xl lg:tw-max-w-lg">
              <div className="tw-pointer-events-none tw-absolute -tw-inset-0.5 tw-rounded-xl tw-bg-gradient-to-r tw-from-iron-400/20 tw-to-iron-200/10 tw-opacity-50 sm:tw-opacity-30 tw-blur tw-transition tw-duration-1000 group-hover:tw-opacity-50" />
              <div className="tw-bg-surface-dark/80 tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-iron-700/60 tw-p-7 tw-shadow-xl tw-backdrop-blur-xl">
                <div className="tw-bg-primary/50 tw-absolute tw-right-3 tw-top-3 tw-h-1.5 tw-w-1.5 tw-animate-pulse tw-rounded-full" />
                <p className="tw-mb-0 md:tw-text-center lg:tw-text-left tw-font-mono tw-text-sm tw-leading-relaxed tw-text-gray-400 tw-tracking-normal">
                  We're extending what Bitcoin and Ethereum proved for money and
                  code to human coordination itself, so any activity can be
                  organized permissionlessly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
