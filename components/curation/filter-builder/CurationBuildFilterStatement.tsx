import { GeneralFilter } from "../../../helpers/filters/Filters.types";
import { CommunityCurationFilterStatement } from "./CurationBuildFilter";
import CurationBuildFilterCIC from "./cic/CurationBuildFilterCIC";
import CurationBuildFilterLevel from "./level/CurationBuildFilterLevel";
import CurationBuildFilterRep from "./rep/CurationBuildFilterRep";
import CurationBuildFilterTDH from "./tdh/CurationBuildFilterTDH";

interface FilterComponentProps {
  filters: GeneralFilter;
  setFilters: (filters: GeneralFilter) => void;
}

type FilterComponentType = React.ComponentType<FilterComponentProps>;

export default function CurationBuildFilterStatement({
  statementType,
  filters,
  setFilters,
}: {
  readonly statementType: CommunityCurationFilterStatement;
  readonly filters: GeneralFilter;
  readonly setFilters: (filters: GeneralFilter) => void;
}) {
  const components: Record<
    CommunityCurationFilterStatement,
    FilterComponentType
  > = {
    [CommunityCurationFilterStatement.LEVEL]: CurationBuildFilterLevel,
    [CommunityCurationFilterStatement.CIC]: CurationBuildFilterCIC,
    [CommunityCurationFilterStatement.REP]: CurationBuildFilterRep,
    [CommunityCurationFilterStatement.TDH]: CurationBuildFilterTDH,
  };

  const Component = components[statementType];
  return <Component filters={filters} setFilters={setFilters} />;
}
