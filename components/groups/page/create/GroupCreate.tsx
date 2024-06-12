import { useEffect, useState } from "react";
import GroupCreateConfig from "./config/GroupCreateConfig";
import GroupCreateActions from "./actions/GroupCreateActions";
import GroupCreateConfigHeader from "./GroupCreateConfigHeader";
import GroupCreateHeader from "./GroupCreateHeader";
import GroupCreateName from "./GroupCreateName";
import GroupCreateWrapper from "./GroupCreateWrapper";
import { GroupFilterDirection } from "../../../../generated/models/GroupFilterDirection";
import { CreateGroup } from "../../../../generated/models/CreateGroup";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { GroupFull } from "../../../../generated/models/GroupFull";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";

export default function GroupCreate({
  edit,
  onCompleted,
}: {
  readonly edit: string;
  readonly onCompleted: () => void;
}) {
  const isEditMode = !!edit && edit !== "new";

  const { data, isFetching } = useQuery<GroupFull>({
    queryKey: [QueryKey.GROUP, edit],
    queryFn: async () =>
      await commonApiFetch<GroupFull>({
        endpoint: `groups/${edit}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!edit && isEditMode,
  });

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

  useEffect(() => {
    if (!data) {
      return;
    }
    setGroupConfig({
      name: data.name,
      group: {
        tdh: {
          min: data.group.tdh?.min,
          max: data.group.tdh?.max,
        },
        rep: {
          min: data.group.rep?.min,
          max: data.group.rep?.max,
          direction: data.group.rep?.direction,
          user_identity: data.group.rep?.user_identity,
          category: data.group.rep?.category,
        },
        cic: {
          min: data.group.cic?.min,
          max: data.group.cic?.max,
          direction: data.group.cic?.direction,
          user_identity: data.group.cic?.user_identity,
        },
        level: {
          min: data.group.level?.min,
          max: data.group.level?.max,
        },
        owns_nfts: data.group.owns_nfts,
        wallets: [], // TODO: we need to fetch wallets,
      },
    });
  }, [data]);

  if (isFetching) {
    return <div>Loading...</div>;
  }

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
