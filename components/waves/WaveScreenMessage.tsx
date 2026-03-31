import type { ReactNode } from "react";

interface WaveScreenMessageProps {
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly action?: ReactNode;
}

export default function WaveScreenMessage({
  title,
  description,
  action,
}: WaveScreenMessageProps) {
  return (
    <div className="tw-flex tw-h-full tw-flex-col tw-items-center tw-justify-center tw-p-8 tw-text-center">
      <h2 className="tw-mb-4 tw-text-xl tw-font-bold tw-text-iron-50">
        {title}
      </h2>
      <p className="tw-mb-6 tw-max-w-md tw-text-sm tw-text-iron-400 sm:tw-text-base">
        {description}
      </p>
      {action !== undefined && action !== null ? (
        <div className="tw-flex tw-justify-center">{action}</div>
      ) : null}
    </div>
  );
}
