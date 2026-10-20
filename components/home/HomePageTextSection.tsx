export default function HomePageTextSection() {
  return (
    <section
      aria-labelledby="network-society-heading"
      data-home-section="About 6529"
      className="tw-relative tw-px-4 tw-pb-14 tw-pt-12 tw-text-left md:tw-px-6 md:tw-py-16 lg:tw-px-8 lg:tw-pb-16 lg:tw-pt-24"
    >
      <div
        className="tw-pointer-events-none tw-absolute tw-inset-0 tw-overflow-hidden"
        aria-hidden="true"
      >
        <div className="tw-absolute tw-left-1/2 tw-top-1/2 tw-h-[600px] tw-w-[600px] -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-[radial-gradient(circle,rgba(130,150,185,0.15)_0%,transparent_70%)] sm:tw-h-[800px] sm:tw-w-[800px] lg:tw-left-2/3" />
      </div>

      <div className="tw-relative tw-z-10 tw-grid tw-grid-cols-1 lg:tw-grid-cols-12 lg:tw-gap-x-8 xl:tw-gap-x-12">
        <h2
          id="network-society-heading"
          className="tw-m-0 tw-mb-3 tw-text-2xl tw-font-medium tw-leading-[1.15] tw-tracking-[-0.025em] tw-text-iron-200 md:tw-text-[26px] lg:tw-col-span-7 lg:tw-mb-4 lg:tw-text-3xl"
        >
          6529 is a network society
        </h2>

        <p className="tw-m-0 tw-max-w-[720px] tw-text-pretty tw-text-[17px] tw-font-normal tw-leading-[1.45] tw-tracking-[-0.01em] tw-text-iron-300 md:tw-text-lg lg:tw-col-span-7 lg:tw-row-start-2 lg:tw-text-xl">
          a decentralized, permissionless global network that funds, builds, and
          coordinates public-goods work across art, science, culture, and
          technology.
        </p>

        <p className="tw-mb-0 tw-mt-7 tw-flex tw-items-start tw-gap-2.5 tw-text-pretty tw-text-xs tw-font-normal tw-uppercase tw-leading-4 tw-tracking-[0.14em] tw-text-iron-400 md:tw-mt-8 lg:tw-col-span-7 lg:tw-row-start-3">
          <span
            aria-hidden="true"
            className="tw-mt-1.5 tw-size-1.5 tw-shrink-0 tw-rounded-full tw-bg-emerald-400"
          />
          <span>The long-term goal is nation-scale positive impact.</span>
        </p>

        <aside
          className="tw-mt-7 md:tw-mt-8 lg:tw-col-span-5 lg:tw-col-start-8 lg:tw-row-span-3 lg:tw-row-start-1 lg:tw-mt-0 lg:tw-self-center"
          aria-label="Mission statement"
        >
          <blockquote className="tw-m-0 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-p-6 tw-shadow-none">
            <p className="tw-m-0 tw-text-pretty tw-text-[15px] tw-font-normal tw-not-italic tw-leading-[1.65] tw-text-iron-300">
              We&apos;re extending what Bitcoin and Ethereum proved for money
              and code to human coordination itself, so any activity can be
              organized permissionlessly.
            </p>
          </blockquote>
        </aside>
      </div>
    </section>
  );
}
