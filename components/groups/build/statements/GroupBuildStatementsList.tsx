import { GroupDescription } from "../../../../generated/models/GroupDescription";
import { GroupFilterDirection } from "../../../../generated/models/GroupFilterDirection";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { GroupDescriptionStatement } from "../GroupBuild";
import GroupBuildStatement from "./GroupBuildStatement";

export interface GroupDescriptionStatementItem {
  readonly key: GroupDescriptionStatement;
  readonly label: string;
}

export default function GroupBuildStatementsList({
  groupDescription,
  onRemoveFilters,
  onStatementType,
}: {
  readonly groupDescription: GroupDescription;
  readonly onRemoveFilters?: (keys: GroupDescriptionStatement[]) => void;
  readonly onStatementType?: (type: GroupDescriptionStatement) => void;
}) {
  const getLevelStatement = (): GroupDescriptionStatementItem | null => {
    if (groupDescription.level.min && groupDescription.level.max) {
      return {
        key: GroupDescriptionStatement.LEVEL,
        label: `Level: ${formatNumberWithCommas(
          groupDescription.level.min
        )} to ${formatNumberWithCommas(groupDescription.level.max)}`,
      };
    }
    if (groupDescription.level.min) {
      return {
        key: GroupDescriptionStatement.LEVEL,
        label: `Level: ${formatNumberWithCommas(groupDescription.level.min)}+`,
      };
    }

    if (groupDescription.level.max) {
      return {
        key: GroupDescriptionStatement.LEVEL,
        label: `Level: Up to ${formatNumberWithCommas(
          groupDescription.level.max
        )}`,
      };
    }
    return null;
  };

  const getTDHStatement = (): GroupDescriptionStatementItem | null => {
    if (groupDescription.tdh.min && groupDescription.tdh.max) {
      return {
        key: GroupDescriptionStatement.TDH,
        label: `TDH: ${formatNumberWithCommas(
          groupDescription.tdh.min
        )} to ${formatNumberWithCommas(groupDescription.tdh.max)}`,
      };
    }
    if (groupDescription.tdh.min) {
      return {
        key: GroupDescriptionStatement.TDH,
        label: `TDH: ${formatNumberWithCommas(groupDescription.tdh.min)}+`,
      };
    }

    if (groupDescription.tdh.max) {
      return {
        key: GroupDescriptionStatement.TDH,
        label: `TDH: Up to ${formatNumberWithCommas(groupDescription.tdh.max)}`,
      };
    }
    return null;
  };

  const getCICSubStatement = (): string => {
    if (groupDescription.cic.user_identity) {
      if (groupDescription.cic.direction === GroupFilterDirection.Received) {
        return `CIC from ${groupDescription.cic.user_identity}`;
      }
      return `CIC to ${groupDescription.cic.user_identity}`;
    }
    return "CIC";
  };

  const getCICStatement = (): GroupDescriptionStatementItem | null => {
    const subStatement = getCICSubStatement();
    if (groupDescription.cic.min && groupDescription.cic.max) {
      return {
        key: GroupDescriptionStatement.CIC,
        label: `${subStatement}: ${formatNumberWithCommas(
          groupDescription.cic.min
        )} to ${formatNumberWithCommas(groupDescription.cic.max)}`,
      };
    }
    if (groupDescription.cic.min) {
      return {
        key: GroupDescriptionStatement.CIC,
        label: `${subStatement}: ${formatNumberWithCommas(
          groupDescription.cic.min
        )}+`,
      };
    }

    if (groupDescription.cic.max) {
      return {
        key: GroupDescriptionStatement.CIC,
        label: `${subStatement}: Up to ${formatNumberWithCommas(
          groupDescription.cic.max
        )}`,
      };
    }
    if (subStatement !== "CIC") {
      return {
        key: GroupDescriptionStatement.CIC,
        label: subStatement,
      };
    }
    return null;
  };

  const getRepSubStatement = (): string => {
    if (groupDescription.rep.user_identity) {
      if (groupDescription.rep.direction === GroupFilterDirection.Received) {
        if (groupDescription.rep.category) {
          return `${groupDescription.rep.category} Rep from ${groupDescription.rep.user_identity}`;
        }
        return `Rep from ${groupDescription.rep.user_identity}`;
      }
      if (groupDescription.rep.category) {
        return `${groupDescription.rep.category} Rep to ${groupDescription.rep.user_identity}`;
      }
      return `Rep to ${groupDescription.rep.user_identity}`;
    }
    if (groupDescription.rep.category) {
      if (groupDescription.rep.direction === GroupFilterDirection.Received) {
        return `Received ${groupDescription.rep.category} Rep`;
      }
      return `Given ${groupDescription.rep.category} Rep`;
    }
    return "Rep";
  };

  const getRepStatement = (): GroupDescriptionStatementItem | null => {
    const subStatement = getRepSubStatement();
    if (groupDescription.rep.min && groupDescription.rep.max) {
      return {
        key: GroupDescriptionStatement.REP,
        label: `${subStatement}: ${formatNumberWithCommas(
          groupDescription.rep.min
        )} to ${formatNumberWithCommas(groupDescription.rep.max)}`,
      };
    }
    if (groupDescription.rep.min) {
      return {
        key: GroupDescriptionStatement.REP,
        label: `${subStatement}: ${formatNumberWithCommas(
          groupDescription.rep.min
        )}+`,
      };
    }
    if (groupDescription.rep.max) {
      return {
        key: GroupDescriptionStatement.REP,
        label: `${subStatement}: Up to ${formatNumberWithCommas(
          groupDescription.rep.max
        )}`,
      };
    }
    if (subStatement !== "Rep") {
      return {
        key: GroupDescriptionStatement.REP,
        label: subStatement,
      };
    }
    return null;
  };

  const getStatements = (): GroupDescriptionStatementItem[] => {
    const response: GroupDescriptionStatementItem[] = [];
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
        <GroupBuildStatement
          key={statement.key}
          statement={statement}
          onRemoveFilters={onRemoveFilters}
          onStatementType={onStatementType}
        />
      ))}
    </div>
  );
}
