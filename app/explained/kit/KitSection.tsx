import type { ReactNode } from "react";

/**
 * A section of the kit gallery and one specimen in it: the component's name
 * and state over the component itself. Dev-only page copy.
 */
export function KitSection({
  id,
  title,
  lede,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly lede: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      className="tw-pt-[76px] md:tw-pt-[120px]"
      id={id}
      data-kit-section={id}
    >
      <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-y-4 lg:tw-grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:tw-gap-x-16">
        <h2 className="tw-m-0 tw-text-[29px] tw-font-semibold tw-leading-[35px] tw-tracking-[-0.026em] tw-text-iron-50 md:tw-text-[44px] md:tw-leading-[50px]">
          {title}
        </h2>
        <p className="tw-m-0 tw-max-w-[660px] tw-pt-1.5 tw-text-base tw-leading-[26px] tw-text-iron-300 md:tw-text-[18px] md:tw-leading-[29px]">
          {lede}
        </p>
      </div>
      <div className="tw-mt-12 tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)] tw-gap-12">
        {children}
      </div>
    </section>
  );
}

export function Specimen({
  name,
  state,
  children,
  wide = false,
}: {
  readonly name: string;
  readonly state?: string;
  readonly children: ReactNode;
  readonly wide?: boolean;
}) {
  return (
    <div
      className={`tw-min-w-0 ${wide ? "" : "tw-max-w-[860px]"}`}
      data-specimen={name}
      {...(state ? { "data-state": state } : {})}
    >
      <p className="tw-m-0 tw-mb-3 tw-font-mono tw-text-[13px] tw-leading-5 tw-text-iron-400">
        {name}
        {state ? ` · ${state}` : ""}
      </p>
      {children}
    </div>
  );
}

export function Row({ children }: { readonly children: ReactNode }) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-[18px] tw-gap-y-2.5">
      {children}
    </div>
  );
}
