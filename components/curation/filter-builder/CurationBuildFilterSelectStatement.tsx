import { CommonSelectItem } from "../../utils/select/CommonSelect";

import CommonTabs from "../../utils/select/tabs/CommonTabs";
import { CommunityCurationFilterStatement } from "./CurationBuildFilter";

export default function CurationBuildFilterSelectStatement({
  statementType,
  setStatementType,
}: {
  readonly statementType: CommunityCurationFilterStatement;
  readonly setStatementType: (
    statementType: CommunityCurationFilterStatement
  ) => void;
}) {
  const items: CommonSelectItem<CommunityCurationFilterStatement>[] = [
    {
      label: "LEVEL",
      value: CommunityCurationFilterStatement.LEVEL,
      key: "level",
    },
    {
      label: "TDH",
      value: CommunityCurationFilterStatement.TDH,
      key: "tdh",
    },
    {
      label: "CIC",
      value: CommunityCurationFilterStatement.CIC,
      key: "cic",
    },
    {
      label: "REP",
      value: CommunityCurationFilterStatement.REP,
      key: "rep",
    },
  ];
  return (
    <CommonTabs
      items={items}
      activeItem={statementType}
      setSelected={setStatementType}
      filterLabel="Curation Statement"
    />
  );
}
