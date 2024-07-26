import { DropMetadata } from "../../../../../entities/IDrop";

export default function DropListItemDataContentMetadata({
  metadata,
}: {
  readonly metadata: DropMetadata[];
}) {
  return (
    <div>
      <p className="tw-mb-0 tw-text-xxs tw-text-iron-500 tw-font-normal">
        Metadata
      </p>
      <ul className="tw-pl-0 tw-mb-0 tw-inline-flex tw-flex-wrap tw-list-none tw-gap-x-1.5 tw-text-xxs tw-text-iron-50 tw-font-medium">
        {metadata.map((meta, i) => (
          <li key={meta.data_key} className="tw-whitespace-nowrap">
            <span className="tw-text-iron-300 tw-font-normal">
              {meta.data_key}:
            </span>{" "}
            <span>
              {meta.data_value}
              {i < metadata.length - 1 ? "," : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
