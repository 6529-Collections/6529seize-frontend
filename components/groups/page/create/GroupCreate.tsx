import { useState } from "react";
import { GroupDescription } from "../../../../generated/models/GroupDescription";
import GroupCreateConfig from "./config/GroupCreateConfig";
import GroupCreateActions from "./GroupCreateActions";
import GroupCreateConfigHeader from "./GroupCreateConfigHeader";
import GroupCreateHeader from "./GroupCreateHeader";
import GroupCreateName from "./GroupCreateName";
import GroupCreateWrapper from "./GroupCreateWrapper";
import { GroupFilterDirection } from "../../../../generated/models/GroupFilterDirection";

export default function GroupCreate() {
  const [groupName, setGroupName] = useState<string>("");
  const [groupConfig, setGroupConfig] = useState<GroupDescription>({
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
  });
  return (
    <GroupCreateWrapper>
      <div className="tw-flex tw-flex-col tw-gap-y-8">
        <div className="tw-space-y-5">
          <GroupCreateHeader />
          <GroupCreateName />
        </div>
        <div className="tw-space-y-5">
          <GroupCreateConfigHeader />
          <div className="tw-py-8 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
            <GroupCreateConfig
              level={groupConfig.level}
              tdh={groupConfig.tdh}
              cic={groupConfig.cic}
              rep={groupConfig.rep}
              setLevel={(level) =>
                setGroupConfig((prev) => ({ ...prev, level }))
              }
              setTDH={(tdh) => setGroupConfig((prev) => ({ ...prev, tdh }))}
              setCIC={(cic) => setGroupConfig((prev) => ({ ...prev, cic }))}
              setRep={(rep) => setGroupConfig((prev) => ({ ...prev, rep }))}
            />
            <GroupCreateActions />
          </div>
        </div>
      </div>
    </GroupCreateWrapper>
  );
}
