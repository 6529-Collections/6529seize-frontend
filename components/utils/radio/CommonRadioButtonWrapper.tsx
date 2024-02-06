import { ReactNode } from "react";

export default function CommonRadioButtonWrapper({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <fieldset className="tw-px-4 sm:tw-px-6 tw-mt-6 tw-max-w-sm">
      <div className="tw-flex tw-items-center tw-space-x-6 tw-space-y-0">
        {children}
      </div>
    </fieldset>
  );
}
