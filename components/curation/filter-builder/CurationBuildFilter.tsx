import { useState } from "react";
import CommonInput from "../../utils/input/CommonInput";
import CurationBuildFilterSelectStatement from "./CurationBuildFilterSelectStatement";
import {
  CurationFilterResponse,
  FilterDirection,
  GeneralFilter,
} from "../../../helpers/filters/Filters.types";
import CurationBuildFilterStatement from "./CurationBuildFilterStatement";
import CurationBuildFilterStatementsList from "./statements/CurationBuildFilterStatementsList";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import CurationBuildFilterSave from "./actions/CurationBuildFilterSave";
import CurationBuildFilterTest from "./actions/CurationBuildFilterTest";
import { formatNumberWithCommas } from "../../../helpers/Helpers";

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
      CommunityCurationFilterStatement.LEVEL
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

  const onRemoveFilters = (keys: CommunityCurationFilterStatement[]) => {
    for (const key of keys) {
      switch (key) {
        case CommunityCurationFilterStatement.TDH:
          setFilters((prev) => ({ ...prev, tdh: { min: null, max: null } }));
          break;
        case CommunityCurationFilterStatement.REP:
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
        case CommunityCurationFilterStatement.CIC:
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
        case CommunityCurationFilterStatement.LEVEL:
          setFilters((prev) => ({ ...prev, level: { min: null, max: null } }));
          break;
        default:
          assertUnreachable(key);
      }
    }
  };

  const [testRunMembersCount, setTestRunMembersCount] = useState<number | null>(
    null
  );

  return (
    <div className="tw-mt-4 tw-pb-6 tw-w-full tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-800">
      <div className="tw-px-4 tw-pt-4">
        <p className="tw-text-base tw-text-iron-50 tw-font-semibold tw-mb-4">
          Build Filter
        </p>
      </div>
      <div className="tw-space-y-4">
        <div className="tw-px-4 tw-space-y-4">
          <CommonInput
            value={name}
            inputType="text"
            maxLength={100}
            onChange={(newV) => setName(newV ?? "")}
            placeholder="Curation Name"
          />
          <CurationBuildFilterStatementsList
            filters={filters}
            onRemoveFilters={onRemoveFilters}
            onStatementType={setStatementType}
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
        <div className="tw-pt-4 tw-px-4 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-800 tw-w-full tw-inline-flex tw-justify-between tw-items-center">
          {testRunMembersCount !== null && (
            <div className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-400">
              Members: {formatNumberWithCommas(testRunMembersCount)}
            </div>
          )}

          <div className="tw-w-full tw-flex tw-gap-x-3 tw-justify-end tw-items-center">
            <CurationBuildFilterTest
              filters={filters}
              name={name}
              onTestRunMembersCount={setTestRunMembersCount}
            />
            <CurationBuildFilterSave
              filters={filters}
              name={name}
              originalFilter={originalFilter}
              onSaved={onSaved}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
