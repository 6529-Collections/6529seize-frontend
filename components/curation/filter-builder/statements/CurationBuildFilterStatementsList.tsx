import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import {
  FilterDirection,
  GeneralFilter,
} from "../../../../helpers/filters/Filters.types";
import { CommunityCurationFilterStatement } from "../CurationBuildFilter";

export enum CommunityCurationFilterStatementType {
  MIN_TDH = "MIN_TDH",
  MAX_TDH = "MAX_TDH",
  MIN_REP = "MIN_REP",
  MAX_REP = "MAX_REP",
  USER_REP = "USER_REP",
  DIRECTION_REP = "DIRECTION_REP",
  CATEGORY_REP = "CATEGORY_REP",
  MIN_CIC = "MIN_CIC",
  MAX_CIC = "MAX_CIC",
  DIRECTION_CIC = "DIRECTION_CIC",
  USER_CIC = "USER_CIC",
  MIN_LEVEL = "MIN_LEVEL",
  MAX_LEVEL = "MAX_LEVEL",
}

export interface CommunityCurationFilterStatementItem {
  readonly key: CommunityCurationFilterStatementType;
  readonly label: string;
}

export default function CurationBuildFilterStatementsList({
  filters,
  setFilters,
}: {
  readonly filters: GeneralFilter;
  readonly setFilters: (filters: GeneralFilter) => void;
}) {
  const getStatements = (): CommunityCurationFilterStatementItem[] => {
    const response: CommunityCurationFilterStatementItem[] = [];
    if (filters.tdh.min !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.MIN_TDH,
        label: `Min TDH: ${formatNumberWithCommas(filters.tdh.min)}`,
      });
    }
    if (filters.tdh.max !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.MAX_TDH,
        label: `Max TDH: ${formatNumberWithCommas(filters.tdh.max)}`,
      });
    }

    if (filters.rep.user !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.USER_REP,
        label: `Rep User: ${filters.rep.user}`,
      });
    }
    if (filters.rep.direction !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.DIRECTION_REP,
        label: `Rep Direction: ${filters.rep.direction}`,
      });
    }
    if (filters.rep.category !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.CATEGORY_REP,
        label: `Rep Category: ${filters.rep.category}`,
      });
    }
    if (filters.rep.min !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.MIN_REP,
        label: `Min REP: ${formatNumberWithCommas(filters.rep.min)}`,
      });
    }
    if (filters.rep.max !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.MAX_REP,
        label: `Max REP: ${formatNumberWithCommas(filters.rep.max)}`,
      });
    }

    if (filters.cic.user !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.USER_CIC,
        label: `CIC User: ${filters.cic.user}`,
      });
    }

    if (filters.cic.direction !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.DIRECTION_CIC,
        label: `CIC Direction: ${filters.cic.direction}`,
      });
    }

    if (filters.cic.min !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.MIN_CIC,
        label: `Min CIC: ${formatNumberWithCommas(filters.cic.min)}`,
      });
    }
    if (filters.cic.max !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.MAX_CIC,
        label: `Max CIC: ${formatNumberWithCommas(filters.cic.max)}`,
      });
    }

    if (filters.level.min !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.MIN_LEVEL,
        label: `Min Level: ${formatNumberWithCommas(filters.level.min)}`,
      });
    }

    if (filters.level.max !== null) {
      response.push({
        key: CommunityCurationFilterStatementType.MAX_LEVEL,
        label: `Max Level: ${formatNumberWithCommas(filters.level.max)}`,
      });
    }

    return response;
  };

  const statements = getStatements();

  return (
    <ul>
      {statements.map((statement) => (
        <li key={statement.key}>{statement.label}</li>
      ))}
    </ul>
  );
}
