import { useState } from "react";
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
      label: "TDH",
      value: CommunityCurationFilterStatement.TDH,
      key: "tdh",
    },
    {
      label: "REP",
      value: CommunityCurationFilterStatement.REP,
      key: "rep",
    },
    {
      label: "CIC",
      value: CommunityCurationFilterStatement.CIC,
      key: "cic",
    },
    {
      label: "LEVEL",
      value: CommunityCurationFilterStatement.LEVEL,
      key: "level",
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
