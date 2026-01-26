export default function HomePageTextSection() {
  return (
    <section className="tw-relative tw-px-3 tw-pb-12 tw-pt-10 sm:tw-px-4 md:tw-px-6 md:tw-pb-16 md:tw-pt-12 lg:tw-px-8">
      <div
        className="tw-pointer-events-none tw-absolute tw-inset-0 tw-overflow-hidden"
        aria-hidden="true"
      >
        <div className="tw-absolute tw-left-1/2 tw-top-1/2 tw-h-[600px] tw-w-[600px] -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-[radial-gradient(circle,rgba(130,150,185,0.15)_0%,transparent_70%)] sm:tw-h-[800px] sm:tw-w-[800px]" />
      </div>

      <div className="tw-relative tw-z-10 tw-py-4 md:tw-py-8">
        <div className="tw-mx-auto tw-grid tw-grid-cols-1 md:tw-max-w-2xl lg:tw-max-w-none lg:tw-grid-cols-12 lg:tw-gap-x-8 tw-gap-y-1 md:tw-gap-y-2 lg:tw-gap-y-0 xl:tw-gap-x-12">
          <header className="md:tw-text-center lg:tw-col-span-7 lg:tw-row-start-1 lg:tw-text-left">
            <h2 className="tw-mb-0 tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl">
              6529 is a network society
            </h2>
          </header>

          <div className="tw-flex tw-flex-col md:tw-text-center lg:tw-col-span-7 lg:tw-row-start-2 lg:tw-text-left xl:tw-pr-8">
            <p className="tw-mb-0 tw-text-lg tw-text-balance lg:tw-text-pretty tw-font-normal tw-text-iron-300 sm:tw-text-xl">
              a decentralized, permissionless global network that funds, builds,
              and coordinates public-goods work across art, science, culture,
              and technology.
            </p>

            <p className="tw-mb-0 tw-mt-6 tw-text-xs tw-uppercase tw-text-pretty tw-tracking-widest tw-text-iron-400 md:tw-mt-8 lg:tw-whitespace-nowrap">
              The long-term goal is nation-scale positive impact.
            </p>
          </div>

          <aside
            className="tw-relative tw-z-10 tw-mt-6 tw-flex tw-items-center md:tw-mt-8 lg:tw-col-span-5 lg:tw-col-start-8 lg:tw-row-span-2 lg:tw-row-start-1 lg:tw-mt-0"
            aria-label="Mission statement"
          >
            <div className="tw-group tw-relative tw-w-full">
              <div
                className="tw-pointer-events-none tw-absolute -tw-inset-0.5 tw-rounded-xl tw-bg-gradient-to-r tw-from-iron-400/20 tw-to-iron-200/10 tw-opacity-30 tw-blur tw-transition-opacity tw-duration-500 group-hover:tw-opacity-50"
                aria-hidden="true"
              />
              <blockquote className="tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-iron-700/70 tw-bg-iron-950/80 tw-px-4 tw-py-5 tw-shadow-lg tw-backdrop-blur-xl">
                <p className="tw-mb-0 tw-font-mono tw-text-sm tw-leading-relaxed tw-text-iron-400 md:tw-text-center lg:tw-text-left">
                  We're extending what Bitcoin and Ethereum proved for money and
                  code to human coordination itself, so any activity can be
                  organized permissionlessly.
                </p>
              </blockquote>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
