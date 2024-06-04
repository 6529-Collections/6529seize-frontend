import { CommonSelectItem } from "../../utils/select/CommonSelect";

import CommonTabs from "../../utils/select/tabs/CommonTabs";
import { GroupDescriptionStatement } from "./GroupBuild";

export default function GroupBuildSelectStatement({
  statementType,
  setStatementType,
}: {
  readonly statementType: GroupDescriptionStatement;
  readonly setStatementType: (statementType: GroupDescriptionStatement) => void;
}) {
  const items: CommonSelectItem<GroupDescriptionStatement>[] = [
    {
      label: "LEVEL",
      value: GroupDescriptionStatement.LEVEL,
      key: "level",
    },
    {
      label: "TDH",
      value: GroupDescriptionStatement.TDH,
      key: "tdh",
    },
    {
      label: "CIC",
      value: GroupDescriptionStatement.CIC,
      key: "cic",
    },
    {
      label: "REP",
      value: GroupDescriptionStatement.REP,
      key: "rep",
    },
  ];
  return (
    <CommonTabs
      items={items}
      activeItem={statementType}
      setSelected={setStatementType}
      filterLabel="Group Statement"
    />
  );
}
