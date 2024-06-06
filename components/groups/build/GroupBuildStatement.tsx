import { CreateGroupDescription } from "../../../generated/models/CreateGroupDescription";
import { GroupDescription } from "../../../generated/models/GroupDescription";
import { GroupDescriptionStatement } from "./GroupBuild";
import GroupBuildCIC from "./cic/GroupBuildCIC";
import GroupBuildLevel from "./level/GroupBuildLevel";
import GroupBuildRep from "./rep/GroupBuildRep";
import GroupBuildTDH from "./tdh/GroupBuildTDH";

interface FilterComponentProps {
  filters: CreateGroupDescription;
  setFilters: (filters: CreateGroupDescription) => void;
}

type FilterComponentType = React.ComponentType<FilterComponentProps>;

export default function GroupBuildStatement({
  statementType,
  filters,
  setFilters,
}: {
  readonly statementType: GroupDescriptionStatement;
  readonly filters: CreateGroupDescription;
  readonly setFilters: (filters: CreateGroupDescription) => void;
}) {
  const components: Record<GroupDescriptionStatement, FilterComponentType> = {
    [GroupDescriptionStatement.LEVEL]: GroupBuildLevel,
    [GroupDescriptionStatement.CIC]: GroupBuildCIC,
    [GroupDescriptionStatement.REP]: GroupBuildRep,
    [GroupDescriptionStatement.TDH]: GroupBuildTDH,
  };

  const Component = components[statementType];
  return <Component filters={filters} setFilters={setFilters} />;
}
