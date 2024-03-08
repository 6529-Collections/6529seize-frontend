import CurationBuildFilter from "./filter-builder/CurationBuildFilter";
import CurationHeader from "./CurationHeader";



export default function CommunityCurationFilters({
  setOpen,
}: {
  readonly setOpen: (open: boolean) => void;
}) {
  return (
    <div className="tw-px-2">
      <CurationHeader setOpen={setOpen} />
      <CurationBuildFilter />
    </div>
  );
}
