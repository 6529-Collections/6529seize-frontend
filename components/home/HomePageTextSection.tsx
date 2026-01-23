export default function HomePageTextSection() {
  return (
    <section className="tw-relative tw-isolate tw-overflow-hidden tw-px-4 tw-pb-6 tw-pt-8 md:tw-px-6 md:tw-pb-8 md:tw-pt-10 lg:tw-px-8">
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[radial-gradient(70%_50%_at_50%_0%,rgba(64,106,254,0.18),transparent_70%)]" />
      <div className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-0 tw-h-[220px] tw-w-[520px] tw--translate-x-1/2 tw-animate-fade-in-out tw-rounded-full tw-bg-[radial-gradient(circle_at_top,rgba(132,173,255,0.35),transparent_70%)] tw-blur-3xl" />
      <div className="tw-relative tw-mx-auto tw-max-w-5xl">
        <div className="tw-relative tw-animate-slideUp tw-overflow-hidden tw-rounded-[28px] tw-border tw-border-iron-800/80 tw-bg-[linear-gradient(135deg,rgba(19,19,22,0.95),rgba(28,28,33,0.75))] tw-p-6 tw-shadow-[0_25px_60px_rgba(0,0,0,0.55)] tw-ring-1 tw-ring-white/5 tw-backdrop-blur-xl md:tw-p-8 lg:tw-p-10">
          <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[radial-gradient(80%_80%_at_20%_20%,rgba(84,139,255,0.14),transparent_60%),radial-gradient(70%_70%_at_80%_80%,rgba(60,203,127,0.08),transparent_65%)]" />
          <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-primary-400/60 tw-to-transparent" />
          <div className="tw-relative tw-mx-auto tw-max-w-3xl tw-space-y-4 tw-text-base tw-leading-relaxed tw-text-iron-200 md:tw-text-lg">
            <p>
              6529 is a network society: a decentralized, permissionless global
              network that funds, builds, and coordinates public-goods work
              across art, science, culture, and technology.
            </p>
            <p>
              We're extending what Bitcoin and Ethereum proved for money and
              code to human coordination itself, so any activity can be
              organized permissionlessly.
            </p>
            <p className="tw-text-iron-100">
              The long-term goal is nation-scale positive impact.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
