import { useState } from "react";
import {
  CreateWaveDropsRequiredMetadata,
  WaveRequiredMetadataType,
} from "../../../../../types/waves.types";
import CommonBorderedRadioButton from "../../../../utils/radio/CommonBorderedRadioButton";
import { CREATE_WAVE_DROPS_REQUIRED_METADATA_TYPES_LABELS } from "../../../../../helpers/waves/waves.constants";

export default function CreateWaveDropsMetadataAdd({
  onRequiredMetadataChange,
}: {
  readonly onRequiredMetadataChange: (
    metadata: CreateWaveDropsRequiredMetadata
  ) => void;
}) {
  const [selectedType, setSelectedType] = useState<WaveRequiredMetadataType>(
    WaveRequiredMetadataType.STRING
  );
  const [key, setKey] = useState<string>("");

  const onKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKey(event.target.value);
  };

  const onAddRequiredMetadata = () => {
    onRequiredMetadataChange({
      key,
      type: selectedType,
    });
    setSelectedType(WaveRequiredMetadataType.STRING);
    setKey("");
  };

  return (
    <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
      <div className="tw-col-span-full tw-grid tw-grid-cols-3 tw-gap-4">
        {Object.values(WaveRequiredMetadataType).map((type) => (
          <CommonBorderedRadioButton
            key={type}
            type={type}
            selected={selectedType}
            label={CREATE_WAVE_DROPS_REQUIRED_METADATA_TYPES_LABELS[type]}
            onChange={setSelectedType}
          />
        ))}
      </div>
      <div className="tw-col-span-full">
        <div className="tw-group tw-w-full tw-relative">
          <input
            type="text"
            value={key}
            onChange={onKeyChange}
            id="required_metadata_key"
            className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            placeholder=" "
          />
          <label
            htmlFor="required_metadata_key"
            className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
          >
            Name
          </label>
        </div>
      </div>
      <button onClick={onAddRequiredMetadata}>Add</button>
    </div>
  );
}
