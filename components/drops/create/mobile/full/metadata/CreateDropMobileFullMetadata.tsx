import { useState } from "react";
import CommonInput from "../../../../../utils/input/CommonInput";
import CreateDropMobileFullMetadataItem from "./CreateDropMobileFullMetadataItem";


export default function CreateDropMobileFullMetadata({
  metadata,
  onMetadataEdit,
  onMetadataRemove,

}: {
  readonly metadata: { readonly key: string; readonly value: string }[];
  readonly onMetadataEdit: (param: {
    readonly key: string;
    readonly value: string;
  }) => void;
  readonly onMetadataRemove: (key: string) => void;

}) {
  const [key, setKey] = useState<string | null>(null);
  const [value, setValue] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (key && value) {
      onMetadataEdit({ key, value });
      setKey(null);
      setValue(null);
    }
  };

  return (
    <div>
      <div className="tw-space-x-2 tw-mb-2">
        {metadata.map((item, index) => (
          <CreateDropMobileFullMetadataItem
            key={index}
            item={item}
            onMetadataRemove={onMetadataRemove}
          />
        ))}
      </div>
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
