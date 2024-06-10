import { useState } from "react";
import GroupCreateConfig from "./config/GroupCreateConfig";
import GroupCreateActions from "./actions/GroupCreateActions";
import GroupCreateConfigHeader from "./GroupCreateConfigHeader";
import GroupCreateHeader from "./GroupCreateHeader";
import GroupCreateName from "./GroupCreateName";
import GroupCreateWrapper from "./GroupCreateWrapper";
import { GroupFilterDirection } from "../../../../generated/models/GroupFilterDirection";
import { CreateGroup } from "../../../../generated/models/CreateGroup";

export default function GroupCreate({
  onCompleted,
}: {
  readonly onCompleted: () => void;
}) {
  const [groupConfig, setGroupConfig] = useState<CreateGroup>({
    name: "",
    group: {
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
    },
  });

  return (
    <GroupCreateWrapper>
      <div className="tw-flex tw-flex-col tw-gap-y-8">
        <div className="tw-space-y-5">
          <GroupCreateHeader />
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-x-8">
            <GroupCreateName
              name={groupConfig.name}
              setName={(name) =>
                setGroupConfig((prev) => ({
                  ...prev,
                  name,
                }))
              }
            />
          </div>
        </div>
        <div className="tw-space-y-5">
          <GroupCreateConfigHeader />
          <div>
            <GroupCreateConfig
              level={groupConfig.group.level}
              tdh={groupConfig.group.tdh}
              cic={groupConfig.group.cic}
              rep={groupConfig.group.rep}
              wallets={groupConfig.group.wallets}
              setLevel={(level) =>
                setGroupConfig((prev) => ({
                  ...prev,
                  group: {
                    ...prev.group,
                    level,
                  },
                }))
              }
              setTDH={(tdh) =>
                setGroupConfig((prev) => ({
                  ...prev,
                  group: { ...prev.group, tdh },
                }))
              }
              setCIC={(cic) =>
                setGroupConfig((prev) => ({
                  ...prev,
                  group: { ...prev.group, cic },
                }))
              }
              setRep={(rep) =>
                setGroupConfig((prev) => ({
                  ...prev,
                  group: { ...prev.group, rep },
                }))
              }
              setWallets={(wallets) =>
                setGroupConfig((prev) => ({
                  ...prev,
                  group: { ...prev.group, wallets },
                }))
              }
            />
            <GroupCreateActions
              groupConfig={groupConfig}
              onCompleted={onCompleted}
            />
          </div>
        </div>
      </div>
    </GroupCreateWrapper>
  );
}
