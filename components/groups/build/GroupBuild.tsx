import { useEffect, useState } from "react";
import CommonInput from "../../utils/input/CommonInput";
import GroupBuildSelectStatement from "./GroupBuildSelectStatement";
import GroupBuildStatement from "./GroupBuildStatement";
import GroupBuildStatementsList from "./statements/GroupBuildStatementsList";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import GroupBuildSave from "./actions/GroupBuildSave";
import GroupBuildTest from "./actions/GroupBuildTest";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import { GroupFull } from "../../../generated/models/GroupFull";
import { GroupDescription } from "../../../generated/models/GroupDescription";
import { GroupFilterDirection } from "../../../generated/models/GroupFilterDirection";
import { CreateGroupDescription } from "../../../generated/models/CreateGroupDescription";

export enum GroupDescriptionStatement {
  TDH = "TDH",
  REP = "REP",
  CIC = "CIC",
  LEVEL = "LEVEL",
}

export default function GroupBuild({
  originalGroup,
  onSaved,
}: {
  readonly originalGroup: GroupFull | null;
  readonly onSaved: (response: GroupFull) => void;
}) {
  const [name, setName] = useState<string>(originalGroup?.name ?? "");
  const [statementType, setStatementType] = useState<GroupDescriptionStatement>(
    GroupDescriptionStatement.LEVEL
  );

  const [groupDescription, setGroupDescription] =
    useState<CreateGroupDescription>(
      originalGroup?.group
        ? {
            tdh: originalGroup.group.tdh,
            rep: originalGroup.group.rep,
            cic: originalGroup.group.cic,
            level: originalGroup.group.level,
            owns_nfts: originalGroup.group.owns_nfts,
            // TODO: originalGroupWallets
            wallets: null,
          }
        : {
            tdh: { min: null, max: null },
            rep: {
              min: null,
              max: null,
              direction: GroupFilterDirection.Received,
              user_identity: null,
              category: null,
            },
            cic: {
              min: null,
              max: null,
              direction: GroupFilterDirection.Received,
              user_identity: null,
            },
            level: { min: null, max: null },
            owns_nfts: [],
            wallets: null,
          }
    );

  const onRemoveGroupDescription = (keys: GroupDescriptionStatement[]) => {
    for (const key of keys) {
      switch (key) {
        case GroupDescriptionStatement.TDH:
          setGroupDescription((prev) => ({
            ...prev,
            tdh: { min: null, max: null },
          }));
          break;
        case GroupDescriptionStatement.REP:
          setGroupDescription((prev) => ({
            ...prev,
            rep: {
              min: null,
              max: null,
              direction: GroupFilterDirection.Received,
              user_identity: null,
              category: null,
            },
          }));
          break;
        case GroupDescriptionStatement.CIC:
          setGroupDescription((prev) => ({
            ...prev,
            cic: {
              min: null,
              max: null,
              direction: GroupFilterDirection.Received,
              user_identity: null,
            },
          }));
          break;
        case GroupDescriptionStatement.LEVEL:
          setGroupDescription((prev) => ({
            ...prev,
            level: { min: null, max: null },
          }));
          break;
        default:
          assertUnreachable(key);
      }
    }
  };

  const [testRunMembersCount, setTestRunMembersCount] = useState<number | null>(
    null
  );

  const getIsEmptyFilters = (): boolean => {
    if (
      groupDescription.level.min !== null ||
      groupDescription.level.max !== null
    ) {
      return false;
    }
    if (
      groupDescription.tdh.min !== null ||
      groupDescription.tdh.max !== null
    ) {
      return false;
    }
    if (
      groupDescription.rep.min !== null ||
      groupDescription.rep.max !== null
    ) {
      return false;
    }
    if (
      groupDescription.rep.user_identity !== null ||
      groupDescription.rep.category !== null
    ) {
      return false;
    }
    if (
      groupDescription.cic.min !== null ||
      groupDescription.cic.max !== null
    ) {
      return false;
    }
    if (groupDescription.cic.user_identity !== null) {
      return false;
    }
    return true;
  };

  const [isEmptyFilters, setIsEmptyFilters] = useState<boolean>(
    getIsEmptyFilters()
  );

  useEffect(() => {
    setIsEmptyFilters(getIsEmptyFilters());
    setTestRunMembersCount(null);
  }, [groupDescription]);

  return (
    <div className="tw-mt-4 lg:tw-mt-6 tw-pb-6 tw-w-full tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-800">
      <div className="tw-px-4 tw-pt-4">
        <p className="tw-text-base tw-text-iron-50 tw-font-semibold tw-mb-4">
          Create a Group
        </p>
      </div>
      <div className="tw-space-y-4">
        <div className="tw-px-4 tw-space-y-4">
          <CommonInput
            value={name}
            inputType="text"
            maxLength={100}
            onChange={(newV) => setName(newV ?? "")}
            placeholder="Group Name"
          />
          <GroupBuildStatementsList
            groupDescription={groupDescription}
            onRemoveFilters={onRemoveGroupDescription}
            onStatementType={setStatementType}
          />
          <GroupBuildSelectStatement
            statementType={statementType}
            setStatementType={setStatementType}
          />
          <GroupBuildStatement
            statementType={statementType}
            filters={groupDescription}
            setFilters={setGroupDescription}
          />
        </div>
        <div className="tw-pt-4 tw-px-4 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-800 tw-w-full tw-inline-flex tw-justify-between tw-items-center">
          {testRunMembersCount !== null && (
            <div className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-400">
              Members: {formatNumberWithCommas(testRunMembersCount)}
            </div>
          )}

          <div className="tw-w-full tw-flex tw-gap-x-3 tw-justify-end tw-items-center">
            <GroupBuildTest
              groupDescription={groupDescription}
              name={name}
              disabled={isEmptyFilters}
              onTestRunMembersCount={setTestRunMembersCount}
            />
            <GroupBuildSave
              groupDescription={groupDescription}
              name={name}
              originalFilter={originalGroup}
              disabled={isEmptyFilters}
              onSaved={onSaved}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
