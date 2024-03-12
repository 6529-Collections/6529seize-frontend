import { useContext, useState } from "react";
import CommonInput from "../../utils/input/CommonInput";
import CurationBuildFilterSelectStatement from "./CurationBuildFilterSelectStatement";
import {
  CurationFilterRequest,
  CurationFilterResponse,
  FilterDirection,
  GeneralFilter,
} from "../../../helpers/filters/Filters.types";
import CurationBuildFilterStatement from "./CurationBuildFilterStatement";
import CurationBuildFilterStatementsList, {
  CommunityCurationFilterStatementType,
} from "./statements/CurationBuildFilterStatementsList";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../services/api/common-api";
import { AuthContext } from "../../auth/Auth";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import CurationBuildFilterSave from "./actions/CurationBuildFilterSave";
import CurationBuildFilterTest from "./actions/CurationBuildFilterTest";

export enum CommunityCurationFilterStatement {
  TDH = "TDH",
  REP = "REP",
  CIC = "CIC",
  LEVEL = "LEVEL",
}

export default function CurationBuildFilter({
  originalFilter,
  onSaved,
}: {
  readonly originalFilter: CurationFilterResponse | null;
  readonly onSaved: (response: CurationFilterResponse) => void;
}) {
  const [name, setName] = useState<string>(originalFilter?.name ?? "");
  const [statementType, setStatementType] =
    useState<CommunityCurationFilterStatement>(
      CommunityCurationFilterStatement.TDH
    );

  const [filters, setFilters] = useState<GeneralFilter>(
    originalFilter?.criteria ?? {
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
    }
  );

  const onRemoveFilters = (keys: CommunityCurationFilterStatementType[]) => {
    for (const key of keys) {
      switch (key) {
        case CommunityCurationFilterStatementType.TDH:
          setFilters((prev) => ({ ...prev, tdh: { min: null, max: null } }));
          break;
        case CommunityCurationFilterStatementType.REP:
          setFilters((prev) => ({
            ...prev,
            rep: {
              min: null,
              max: null,
              direction: FilterDirection.RECEIVED,
              user: null,
              category: null,
            },
          }));
          break;
        case CommunityCurationFilterStatementType.CIC:
          setFilters((prev) => ({
            ...prev,
            cic: {
              min: null,
              max: null,
              direction: FilterDirection.RECEIVED,
              user: null,
            },
          }));
          break;
        case CommunityCurationFilterStatementType.LEVEL:
          setFilters((prev) => ({ ...prev, level: { min: null, max: null } }));
          break;
        default:
          assertUnreachable(key);
      }
    }
  };

  return (
    <div className="tw-mt-8 tw-w-full tw-space-y-4">
      <div>BUIDL Filter</div>
      <CommonInput
        value={name}
        onChange={(newV) => setName(newV ?? "")}
        placeholder="Curation Name"
      />
      <CurationBuildFilterStatementsList
        filters={filters}
        onRemoveFilters={onRemoveFilters}
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

      <CurationBuildFilterTest filters={filters} name={name} />
      <CurationBuildFilterSave
        filters={filters}
        name={name}
        originalFilter={originalFilter}
        onSaved={onSaved}
      />
    </div>
  );
}
