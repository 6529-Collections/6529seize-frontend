import IdentitySearch, {
  IdentitySearchSize,
} from "../input/identity/IdentitySearch";
import SelectGroupModalSearchName from "./SelectGroupModalSearchName";

export default function SelectGroupModalSearch({
  groupName,
  groupUser,
  onUserSelect,
  onFilterNameSearch,
  showIdentitySearch = true,
}: {
  readonly groupName: string | null;
  readonly groupUser: string | null;
  readonly onUserSelect: (value: string | null) => void;
  readonly onFilterNameSearch: (value: string | null) => void;
  readonly showIdentitySearch?: boolean | undefined;
}) {
  return (
    <div className="tw-col-span-full tw-mt-4 tw-px-4">
      <div className="tw-grid tw-grid-cols-1 tw-gap-y-3">
        {showIdentitySearch && (
          <IdentitySearch
            size={IdentitySearchSize.SM}
            identity={groupUser}
            setIdentity={onUserSelect}
          />
        )}
        <SelectGroupModalSearchName
          filterName={groupName}
          setFilterName={onFilterNameSearch}
        />
      </div>
    </div>
  );
}
