import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import {
  FilterDirection,
  GeneralFilter,
} from "../../../../helpers/filters/Filters.types";

export enum CommunityCurationFilterStatementType {
  TDH = "TDH",
  CIC = "CIC",
  REP = "REP",
  LEVEL = "LEVEL",
}

export interface CommunityCurationFilterStatementItem {
  readonly key: CommunityCurationFilterStatementType;
  readonly label: string;
}

export default function CurationBuildFilterStatementsList({
  filters,
  onRemoveFilters,
}: {
  readonly filters: GeneralFilter;
  readonly onRemoveFilters?: (
    keys: CommunityCurationFilterStatementType[]
  ) => void;
}) {
  const showRemoveButton = !!onRemoveFilters;

  const getLevelStatement = (): CommunityCurationFilterStatementItem | null => {
    if (filters.level.min && filters.level.max) {
      return {
        key: CommunityCurationFilterStatementType.LEVEL,
        label: `Level: ${formatNumberWithCommas(
          filters.level.min
        )} to ${formatNumberWithCommas(filters.level.max)}`,
      };
    }
    if (filters.level.min) {
      return {
        key: CommunityCurationFilterStatementType.LEVEL,
        label: `Level: ${formatNumberWithCommas(filters.level.min)}+`,
      };
    }

    if (filters.level.max) {
      return {
        key: CommunityCurationFilterStatementType.LEVEL,
        label: `Level: Up to ${formatNumberWithCommas(filters.level.max)}`,
      };
    }
    return null;
  };

  const getTDHStatement = (): CommunityCurationFilterStatementItem | null => {
    if (filters.tdh.min && filters.tdh.max) {
      return {
        key: CommunityCurationFilterStatementType.TDH,
        label: `TDH: ${formatNumberWithCommas(
          filters.tdh.min
        )} to ${formatNumberWithCommas(filters.tdh.max)}`,
      };
    }
    if (filters.tdh.min) {
      return {
        key: CommunityCurationFilterStatementType.TDH,
        label: `TDH: ${formatNumberWithCommas(filters.tdh.min)}+`,
      };
    }

    if (filters.tdh.max) {
      return {
        key: CommunityCurationFilterStatementType.TDH,
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
        key: CommunityCurationFilterStatementType.CIC,
        label: `${subStatement}: ${formatNumberWithCommas(
          filters.cic.min
        )} to ${formatNumberWithCommas(filters.cic.max)}`,
      };
    }
    if (filters.cic.min) {
      return {
        key: CommunityCurationFilterStatementType.CIC,
        label: `${subStatement}: ${formatNumberWithCommas(filters.cic.min)}+`,
      };
    }

    if (filters.cic.max) {
      return {
        key: CommunityCurationFilterStatementType.CIC,
        label: `${subStatement}: Up to ${formatNumberWithCommas(
          filters.cic.max
        )}`,
      };
    }
    if (subStatement !== "CIC") {
      return {
        key: CommunityCurationFilterStatementType.CIC,
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
        key: CommunityCurationFilterStatementType.REP,
        label: `${subStatement}: ${formatNumberWithCommas(
          filters.rep.min
        )} to ${formatNumberWithCommas(filters.rep.max)}`,
      };
    }
    if (filters.rep.min) {
      return {
        key: CommunityCurationFilterStatementType.REP,
        label: `${subStatement}: ${formatNumberWithCommas(filters.rep.min)}+`,
      };
    }
    if (filters.rep.max) {
      return {
        key: CommunityCurationFilterStatementType.REP,
        label: `${subStatement}: Up to ${formatNumberWithCommas(
          filters.rep.max
        )}`,
      };
    }
    if (subStatement !== "Rep") {
      return {
        key: CommunityCurationFilterStatementType.REP,
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
  return (
    <div className="tw-w-full tw-space-y-1">
      {statements.map((statement) => (
        <div
          key={statement.key}
          className="tw-w-full tw-inline-flex tw-items-center tw-justify-between tw-gap-x-0.5 tw-rounded-md  tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-400 tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
        >
          {statement.label}
          {showRemoveButton && (
            <button
              onClick={() => onRemoveFilters([statement.key])}
              type="button"
              className="tw-bg-transparent tw-border-none tw-group tw-relative -tw-mr-1 tw-h-3.5 tw-w-3.5 tw-rounded-sm hover:tw-bg-blue-600/20"
            >
              <span className="tw-sr-only">Remove</span>
              <svg
                viewBox="0 0 14 14"
                className="tw-h-3.5 tw-w-3.5 tw-stroke-blue-800/50 group-hover:tw-stroke-blue-800/75"
              >
                <path d="M4 4l6 6m0-6l-6 6" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
