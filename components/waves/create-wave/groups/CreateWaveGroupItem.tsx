import { ApiGroupFull } from "../../../../generated/models/ApiGroupFull";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { CreateWaveGroupStatus } from "../../../../types/waves.types";
import CommonBorderedRadioButton from "../../../utils/radio/CommonBorderedRadioButton";

export default function CreateWaveGroupItem({
  selectedGroup,
  disabled = false,
  switchSelected,
  onSelectedClick,
}: {
  readonly selectedGroup: ApiGroupFull | null;
  readonly disabled?: boolean;
  readonly switchSelected: (selectedType: CreateWaveGroupStatus) => void;
  readonly onSelectedClick: () => void;
}) {
  if (selectedGroup) {
    return (
      <CommonBorderedRadioButton
        type={CreateWaveGroupStatus.GROUP}
        selected={CreateWaveGroupStatus.GROUP}
        disabled={disabled}
        onChange={onSelectedClick}
      >
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            {selectedGroup.created_by.pfp ? (
              <img
                className="tw-flex-shrink-0 tw-object-contain tw-h-6 tw-w-6 tw-rounded-md tw-ring-1 tw-ring-iron-700"
                src={getScaledImageUri(
                  selectedGroup.created_by.pfp,
                  ImageScale.W_AUTO_H_50
                )}
                alt="Profile Picture"
              />
            ) : (
              <div className="tw-flex-shrink-0 tw-object-contain tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-iron-700" />
            )}
            <span className="tw-text-iron-50 tw-text-sm">
              {selectedGroup.created_by.handle}
            </span>
          </div>
          <div className="tw-text-primary-400 tw-whitespace-nowrap tw-font-semibold tw-text-sm tw-truncate">
            {selectedGroup.name}
          </div>
        </div>
      </CommonBorderedRadioButton>
    );
  }

  return (
    <CommonBorderedRadioButton
      type={CreateWaveGroupStatus.GROUP}
      selected={
        selectedGroup ? CreateWaveGroupStatus.GROUP : CreateWaveGroupStatus.NONE
      }
      label="A Group"
      onChange={switchSelected}
      disabled={disabled}
    />
  );
}
