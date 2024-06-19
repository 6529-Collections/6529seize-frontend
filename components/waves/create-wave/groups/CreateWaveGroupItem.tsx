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
        <div className="-tw-mt-0.5 tw-flex tw-flex-col tw-gap-y-2">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            {selectedGroup.created_by.pfp ? (
              <img
                className="tw-flex-shrink-0 tw-object-contain tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-700 tw-ring-2 tw-ring-iron-900"
                src={selectedGroup.created_by.pfp}
                alt="Profile Picture"
              />
            ) : (
              <div className="tw-flex-shrink-0 tw-object-contain tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-700 tw-ring-2 tw-ring-iron-900" />
            )}
            <span className="tw-text-primary-400 tw-font-bold tw-text-sm">
              {selectedGroup.created_by.handle}
            </span>
          </div>
          <div className="tw-text-primary-400 tw-font-bold">
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
