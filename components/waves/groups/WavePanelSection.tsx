import type { ReactNode } from "react";

interface WavePanelSectionProps {
  readonly children: ReactNode;
  readonly title: string;
  readonly titleAccessory?: ReactNode | undefined;
}

export default function WavePanelSection({
  children,
  title,
  titleAccessory,
}: WavePanelSectionProps) {
  return (
    <section className="tw-px-4 tw-py-4">
      <div className="tw-flex tw-min-h-7 tw-items-center tw-justify-between tw-gap-x-4">
        <h2 className="tw-mb-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]">
          {title}
        </h2>
        {titleAccessory}
      </div>
      <div className="tw--mx-2 tw-mt-2 tw-flex tw-flex-col tw-gap-y-0.5">
        {children}
      </div>
    </section>
  );
}
