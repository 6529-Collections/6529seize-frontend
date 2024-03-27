import { useState } from "react";
import CommonInput from "../../../../utils/input/CommonInput";
import { DropMetadata } from "../../../../../entities/IDrop";
import CreateDropMetadataItems from "../../utils/metadata/CreateDropMetadataItems";

export default function CreateDropFullDesktopMetadata({
  metadata,
  onMetadataEdit,
  onMetadataRemove,
}: {
  readonly metadata: DropMetadata[];
  readonly onMetadataEdit: (param: DropMetadata) => void;
  readonly onMetadataRemove: (key: string) => void;
}) {
  const [key, setKey] = useState<string | null>(null);
  const [value, setValue] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (key && value) {
      onMetadataEdit({ data_key: key, data_value: value });
      setKey(null);
      setValue(null);
    }
  };

  return (
    <div>
      <form onSubmit={onSubmit} className="tw-flex tw-gap-x-3 tw-w-full">
        <div className="tw-w-full">
          <input
            type="text"
            placeholder="Metadata Key"
            value={key ?? ""}
            onChange={(e) => setKey(e.target.value)}
            maxLength={250}
            className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
        <div className="tw-w-full">
          <input
            type="text"
            placeholder="Value"
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value)}
            maxLength={250}
            className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
        <button
          type="submit"
          className="tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
        >
          Add
        </button>
      </form>
      <CreateDropMetadataItems
        items={metadata}
        onMetadataRemove={onMetadataRemove}
      />
    </div>
  );
}
