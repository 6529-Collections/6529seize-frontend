import { useState } from "react";
import CommonInput from "../../../../utils/input/CommonInput";
import { DropMetadata } from "../../../../../entities/IDrop";
import CreateDropMetadataItems from "../../utils/metadata/CreateDropMetadataItems";

export default function CreateDropFullMobileMetadata({
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
      <CreateDropMetadataItems
        items={metadata}
        onMetadataRemove={onMetadataRemove}
      />
      <form onSubmit={onSubmit} className="tw-space-y-2">
        <CommonInput
          inputType="text"
          placeholder="Key"
          value={key ?? ""}
          onChange={setKey}
        />
        <CommonInput
          inputType="text"
          placeholder="Value"
          value={value ?? ""}
          onChange={setValue}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
