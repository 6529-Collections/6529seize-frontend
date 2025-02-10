import { ApiDropMetadata } from "../../../../generated/models/ApiDropMetadata";

interface ParticipationDropMetadataProps {
  readonly metadata: ApiDropMetadata[];
}

export default function ParticipationDropMetadata({
  metadata,
}: ParticipationDropMetadataProps) {
  if (!metadata || metadata.length === 0) return null;

  return (
    <div className="tw-px-6 tw-pt-4 tw-border-t tw-border-iron-800/30">
      <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-4">
        {metadata.map((meta) => (
          <div key={meta.data_key} className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-xs tw-font-medium tw-text-iron-400">
              {meta.data_key}
            </span>
            <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
              {meta.data_value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
