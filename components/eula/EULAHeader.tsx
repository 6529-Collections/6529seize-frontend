import LogoIcon from "@/components/common/icons/LogoIcon";

export default function EULAHeader({
  titleId,
  title,
  lastUpdated,
}: {
  readonly titleId: string;
  readonly title: string;
  readonly lastUpdated: string;
}) {
  return (
    <header className="tw-shrink-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-bg-black/30 tw-px-4 tw-pb-4 tw-pt-[max(1rem,env(safe-area-inset-top,0px))] sm:tw-px-8 sm:tw-pb-5">
      <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-4xl tw-items-center tw-gap-3">
        <LogoIcon className="tw-size-10 tw-shrink-0 tw-text-iron-50 sm:tw-size-11" />
        <div className="tw-min-w-0">
          <h2
            id={titleId}
            className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-2xl"
          >
            {title}
          </h2>
          <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-400 sm:tw-text-sm">
            {lastUpdated}
          </p>
        </div>
      </div>
    </header>
  );
}
