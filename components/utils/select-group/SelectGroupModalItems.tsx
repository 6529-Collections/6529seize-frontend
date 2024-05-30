import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";

export default function SelectGroupModalItems({
  groups,
  onGroupSelect,
}: {
  readonly groups: CurationFilterResponse[];
  readonly onGroupSelect: (group: CurationFilterResponse) => void;
}) {
  return (
    <ul>
      {groups.map((group) => (
        <li
          key={group.id}
          className="tw-cursor-pointer"
          onClick={() => onGroupSelect(group)}
        >
          {group.created_by?.handle} - {group.name}
        </li>
      ))}
    </ul>
  );
}
