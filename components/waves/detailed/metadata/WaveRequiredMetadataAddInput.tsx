import { ApiWaveMetadataType } from "../../../../generated/models/ApiWaveMetadataType";
import { CreateWaveDropsRequiredMetadata } from "../../../../types/waves.types";
import WaveRequiredMetadataAddTypeSelect from "./WaveRequiredMetadataAddTypeSelect";

export default function WaveRequiredMetadataAddInput({
  metadata,
  setMetadata,
}: {
  readonly metadata: CreateWaveDropsRequiredMetadata;
  readonly setMetadata: (metadata: CreateWaveDropsRequiredMetadata) => void;
}) {
  const onKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMetadata({ ...metadata, key: event.target.value });
  };

  const onTypeChange = (type: ApiWaveMetadataType) => {
    setMetadata({ ...metadata, type });
  };

  return (
    <div className="tw-flex">
      <WaveRequiredMetadataAddTypeSelect
        activeType={metadata.type}
        onTypeChange={onTypeChange}
      />
      <div className="tw-relative tw-w-full">
        <input
          value={metadata.key}
          onChange={onKeyChange}
          id="required_metadata_key_0"
          type="text"
          autoComplete="off"
          className="tw-border-iron-650 tw-ring-iron-650  focus:tw-border-blue-500  focus:tw-ring-primary-400
       tw-form-input tw-block tw-px-4 tw-pb-2 tw-pt-3 tw-w-full tw-text-sm tw-rounded-r-lg tw-border-0 tw-appearance-none tw-peer tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out"
          placeholder=" "
        />

        <label
          htmlFor="required_metadata_key_0"
          className="peer-focus:tw-text-primary-400 tw-text-iron-500 tw-absolute tw-cursor-text tw-text-sm tw-font-normal tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-placeholder-shown:tw-scale-100 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
        >
          Name
        </label>
      </div>
    </div>
  );
}
