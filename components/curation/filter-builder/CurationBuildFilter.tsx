import { useState } from "react";
import CommonInput from "../../utils/input/CommonInput";
import CurationBuildFilterSelectStatement from "./CurationBuildFilterSelectStatement";
import {
  FilterDirection,
  GeneralFilter,
} from "../../../helpers/filters/Filters.types";
import CurationBuildFilterStatement from "./CurationBuildFilterStatement";

export enum CommunityCurationFilterStatement {
  TDH = "TDH",
  REP = "REP",
  CIC = "CIC",
  LEVEL = "LEVEL",
}

export default function CurationBuildFilter() {
  const [name, setName] = useState<string>("");
  const [statementType, setStatementType] =
    useState<CommunityCurationFilterStatement>(
      CommunityCurationFilterStatement.TDH
    );

  const [filters, setFilters] = useState<GeneralFilter>({
    tdh: { min: null, max: null },
    rep: {
      min: null,
      max: null,
      direction: FilterDirection.RECEIVED,
      user: null,
      category: null,
    },
    cic: {
      min: null,
      max: null,
      direction: FilterDirection.RECEIVED,
      user: null,
    },
    level: { min: null, max: null },
  });

  return (
    <div className="tw-mt-8 tw-w-full tw-space-y-4">
      <div>BUIDL Filter</div>
      <CommonInput
        value={name}
        onChange={(newV) => setName(newV ?? "")}
        placeholder="Curation Name"
      />
      <CurationBuildFilterSelectStatement
        statementType={statementType}
        setStatementType={setStatementType}
      />
      <CurationBuildFilterStatement
        statementType={statementType}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}
