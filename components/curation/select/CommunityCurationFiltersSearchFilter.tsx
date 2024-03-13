import CommonInput from "../../utils/input/CommonInput";

export default function CommunityCurationFiltersSearchFilter({
  filterName,
  setFilterName,
}: {
  readonly filterName: string | null;
  readonly setFilterName: (name: string | null) => void;
}) {
  return (
    <CommonInput
      inputType="text"
      placeholder="Search filter"
      value={filterName ?? ""}
      showSearchIcon={true}
      onChange={setFilterName}
    />
  );
}
