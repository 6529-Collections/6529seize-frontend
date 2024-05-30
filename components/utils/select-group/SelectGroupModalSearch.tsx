import SelectGroupModalSearchName from "./SelectGroupModalSearchName";
import SelectGroupModalSearchUser from "./SelectGroupModalSearchUser";

export default function SelectGroupModalSearch({
  groupName,
  groupUser,
  onUserSelect,
  onFilterNameSearch,
}: {
  readonly groupName: string | null;
  readonly groupUser: string | null;
  readonly onUserSelect: (value: string | null) => void;
  readonly onFilterNameSearch: (value: string | null) => void;
}) {
  return (
    <div className="tw-col-span-full">
      <div className="tw-grid md:tw-grid-cols-2 tw-gap-4">
        <SelectGroupModalSearchUser value={groupUser} setValue={onUserSelect} />
        <SelectGroupModalSearchName
          filterName={groupName}
          setFilterName={onFilterNameSearch}
        />
      </div>
    </div>
  );
}
