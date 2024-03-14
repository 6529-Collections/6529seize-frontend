import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import {
  FilterDirection,
  GeneralFilter,
} from "../../../../helpers/filters/Filters.types";
import { CommunityCurationFilterStatement } from "../CurationBuildFilter";
import CurationBuildFilterStatementsListItem from "./CurationBuildFilterStatementsListItem";

export interface CommunityCurationFilterStatementItem {
  readonly key: CommunityCurationFilterStatement;
  readonly label: string;
}

export default function CurationBuildFilterStatementsList({
  filters,
  onRemoveFilters,
  onStatementType,
}: {
  readonly filters: GeneralFilter;
  readonly onRemoveFilters?: (keys: CommunityCurationFilterStatement[]) => void;
  readonly onStatementType?: (type: CommunityCurationFilterStatement) => void;
}) {
  const getLevelStatement = (): CommunityCurationFilterStatementItem | null => {
    if (filters.level.min && filters.level.max) {
      return {
        key: CommunityCurationFilterStatement.LEVEL,
        label: `Level: ${formatNumberWithCommas(
          filters.level.min
        )} to ${formatNumberWithCommas(filters.level.max)}`,
      };
    }
    if (filters.level.min) {
      return {
        key: CommunityCurationFilterStatement.LEVEL,
        label: `Level: ${formatNumberWithCommas(filters.level.min)}+`,
      };
    }

    if (filters.level.max) {
      return {
        key: CommunityCurationFilterStatement.LEVEL,
        label: `Level: Up to ${formatNumberWithCommas(filters.level.max)}`,
      };
    }
    return null;
  };

  const getTDHStatement = (): CommunityCurationFilterStatementItem | null => {
    if (filters.tdh.min && filters.tdh.max) {
      return {
        key: CommunityCurationFilterStatement.TDH,
        label: `TDH: ${formatNumberWithCommas(
          filters.tdh.min
        )} to ${formatNumberWithCommas(filters.tdh.max)}`,
      };
    }
    if (filters.tdh.min) {
      return {
        key: CommunityCurationFilterStatement.TDH,
        label: `TDH: ${formatNumberWithCommas(filters.tdh.min)}+`,
      };
    }

    if (filters.tdh.max) {
      return {
        key: CommunityCurationFilterStatement.TDH,
        label: `TDH: Up to ${formatNumberWithCommas(filters.tdh.max)}`,
      };
    }
    return null;
  };

  const getCICSubStatement = (): string => {
    if (filters.cic.user) {
      if (filters.cic.direction === FilterDirection.RECEIVED) {
        return `CIC from ${filters.cic.user}`;
      }
      return `CIC to ${filters.cic.user}`;
    }
    return "CIC";
  };

  const getCICStatement = (): CommunityCurationFilterStatementItem | null => {
    const subStatement = getCICSubStatement();
    if (filters.cic.min && filters.cic.max) {
      return {
        key: CommunityCurationFilterStatement.CIC,
        label: `${subStatement}: ${formatNumberWithCommas(
          filters.cic.min
        )} to ${formatNumberWithCommas(filters.cic.max)}`,
      };
    }
    if (filters.cic.min) {
      return {
        key: CommunityCurationFilterStatement.CIC,
        label: `${subStatement}: ${formatNumberWithCommas(filters.cic.min)}+`,
      };
    }

    if (filters.cic.max) {
      return {
        key: CommunityCurationFilterStatement.CIC,
        label: `${subStatement}: Up to ${formatNumberWithCommas(
          filters.cic.max
        )}`,
      };
    }
    if (subStatement !== "CIC") {
      return {
        key: CommunityCurationFilterStatement.CIC,
        label: subStatement,
      };
    }
    return null;
  };

  const getRepSubStatement = (): string => {
    if (filters.rep.user) {
      if (filters.rep.direction === FilterDirection.RECEIVED) {
        if (filters.rep.category) {
          return `${filters.rep.category} Rep from ${filters.rep.user}`;
        }
        return `Rep from ${filters.rep.user}`;
      }
      if (filters.rep.category) {
        return `${filters.rep.category} Rep to ${filters.rep.user}`;
      }
      return `Rep to ${filters.rep.user}`;
    }
    if (filters.rep.category) {
      if (filters.rep.direction === FilterDirection.RECEIVED) {
        return `Received ${filters.rep.category} Rep`;
      }
      return `Given ${filters.rep.category} Rep`;
    }
    return "Rep";
  };

  const getRepStatement = (): CommunityCurationFilterStatementItem | null => {
    const subStatement = getRepSubStatement();
    if (filters.rep.min && filters.rep.max) {
      return {
        key: CommunityCurationFilterStatement.REP,
        label: `${subStatement}: ${formatNumberWithCommas(
          filters.rep.min
        )} to ${formatNumberWithCommas(filters.rep.max)}`,
      };
    }
    if (filters.rep.min) {
      return {
        key: CommunityCurationFilterStatement.REP,
        label: `${subStatement}: ${formatNumberWithCommas(filters.rep.min)}+`,
      };
    }
    if (filters.rep.max) {
      return {
        key: CommunityCurationFilterStatement.REP,
        label: `${subStatement}: Up to ${formatNumberWithCommas(
          filters.rep.max
        )}`,
      };
    }
    if (subStatement !== "Rep") {
      return {
        key: CommunityCurationFilterStatement.REP,
        label: subStatement,
      };
    }
    return null;
  };

  const getStatements = (): CommunityCurationFilterStatementItem[] => {
    const response: CommunityCurationFilterStatementItem[] = [];
    const levelStatement = getLevelStatement();
    if (levelStatement) {
      response.push(levelStatement);
    }

    const tdhStatement = getTDHStatement();
    if (tdhStatement) {
      response.push(tdhStatement);
    }
    const cicStatement = getCICStatement();
    if (cicStatement) {
      response.push(cicStatement);
    }
    const repStatement = getRepStatement();
    if (repStatement) {
      response.push(repStatement);
    }
    return response;
  };

  const statements = getStatements();

  if (!statements.length) {
    return null;
  }

  return (
    <div className="tw-w-full tw-flex tw-flex-wrap tw-items-center tw-gap-2">
      {statements.map((statement) => (
        <CurationBuildFilterStatementsListItem
          key={statement.key}
          statement={statement}
          onRemoveFilters={onRemoveFilters}
          onStatementType={onStatementType}
        />
      ))}
    </div>
  );
}
