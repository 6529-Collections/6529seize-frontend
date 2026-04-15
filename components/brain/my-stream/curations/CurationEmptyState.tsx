"use client";

interface CurationEmptyStateProps {
  readonly curationTitle: string;
  readonly containerClassName?: string | undefined;
  readonly description?: string | undefined;
}

const DEFAULT_CONTAINER_CLASS_NAME =
  "tw-flex tw-min-h-[20rem] tw-items-center tw-justify-center tw-px-6";

const DEFAULT_DESCRIPTION =
  "This tab will show the drops added to this curation.";

export default function CurationEmptyState({
  curationTitle,
  containerClassName = DEFAULT_CONTAINER_CLASS_NAME,
  description = DEFAULT_DESCRIPTION,
}: CurationEmptyStateProps) {
  return (
    <div className={containerClassName}>
      <div className="tw-max-w-md tw-rounded-2xl tw-border tw-border-dashed tw-border-iron-700 tw-bg-iron-950/70 tw-px-6 tw-py-8 tw-text-center">
        <p className="tw-mb-2 tw-text-base tw-font-semibold tw-text-iron-100">
          {curationTitle} is empty
        </p>
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">{description}</p>
      </div>
    </div>
  );
}
