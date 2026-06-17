import type { ReactNode } from "react";

type ProfileCmsStateProps = {
  readonly title: string;
  readonly children: ReactNode;
  readonly action?: ReactNode | undefined;
};

export function ProfileCmsState({
  title,
  children,
  action,
}: ProfileCmsStateProps) {
  return (
    <div className="tailwind-scope tw-min-h-[60vh] tw-bg-black tw-px-4 tw-py-16 tw-text-iron-100 sm:tw-px-6 lg:tw-px-8">
      <div className="tw-mx-auto tw-max-w-3xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-6 sm:tw-p-8">
        <p className="tw-mb-2 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
          Profile website
        </p>
        <h1 className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-white">
          {title}
        </h1>
        <div className="tw-text-base tw-leading-7 tw-text-iron-300">
          {children}
        </div>
        {action ? <div className="tw-mt-6">{action}</div> : null}
      </div>
    </div>
  );
}

export function ProfileCmsLoadingState() {
  return (
    <ProfileCmsState title="Loading website">
      <div className="tw-space-y-3" aria-hidden="true">
        <div className="tw-h-4 tw-w-3/4 tw-animate-pulse tw-bg-iron-800" />
        <div className="tw-h-4 tw-w-full tw-animate-pulse tw-bg-iron-800" />
        <div className="tw-h-4 tw-w-2/3 tw-animate-pulse tw-bg-iron-800" />
      </div>
    </ProfileCmsState>
  );
}

export function ProfileCmsEmptyState({
  title = "Website page not found",
}: {
  readonly title?: string | undefined;
}) {
  return (
    <ProfileCmsState title={title}>
      <p>This profile website is published, but this page is not available.</p>
    </ProfileCmsState>
  );
}
