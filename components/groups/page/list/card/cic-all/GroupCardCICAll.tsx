import { GroupFull } from "../../../../../../generated/models/GroupFull";
import GroupCardActionFooter from "../utils/GroupCardActionFooter";
import GroupCardActionStats from "../utils/GroupCardActionStats";
import GroupCardCICAllInput from "./GroupCardCICAllInput";

export default function GroupCardCICAll({
  group,
  onCancel,
}: {
  readonly group: GroupFull;
  readonly onCancel: () => void;
}) {
  return (
    <div className="tw-py-4 tw-flex tw-flex-col tw-h-full tw-gap-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
      <div className="tw-px-4 sm:tw-px-6">
        <GroupCardCICAllInput />
        <GroupCardActionStats />
      </div>
      <GroupCardActionFooter onCancel={onCancel} />
    </div>
  );
}
