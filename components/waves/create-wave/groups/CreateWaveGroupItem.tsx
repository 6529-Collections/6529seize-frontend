import { GroupFull } from "../../../../generated/models/GroupFull";
import { CreateWaveGroupStatus } from "../../../../types/waves.types";
import CommonBorderedRadioButton from "../../../utils/radio/CommonBorderedRadioButton";

export default function CreateWaveGroupItem({
  selectedGroup,
  switchSelected,
}: {
  readonly selectedGroup: GroupFull | null;
  readonly switchSelected: (selectedType: CreateWaveGroupStatus) => void;
}) {
  if (selectedGroup) {
    return (
      <CommonBorderedRadioButton
        type={CreateWaveGroupStatus.GROUP}
        selected={
          !!selectedGroup
            ? CreateWaveGroupStatus.GROUP
            : CreateWaveGroupStatus.NONE
        }
        onChange={() => undefined}
      >
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            {selectedGroup.created_by.pfp ? (
              <img
                className="tw-flex-shrink-0 tw-object-contain tw-h-6 tw-w-6 tw-rounded-md"
                src={selectedGroup.created_by.pfp}
                alt="Profile Picture"
              />
            ) : (
              <div className="tw-flex-shrink-0 tw-object-contain tw-h-5 tw-w-5 tw-rounded-md" />
            )}
            <span className="tw-text-iron-50 tw-text-sm">
              {selectedGroup.created_by.handle}
            </span>
          </div>
          <div className="tw-text-primary-400 tw-whitespace-nowrap tw-font-semibold tw-text-sm">
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
        !!selectedGroup
          ? CreateWaveGroupStatus.GROUP
          : CreateWaveGroupStatus.NONE
      }
      label="A Group"
      onChange={switchSelected}
    />
  );
}
