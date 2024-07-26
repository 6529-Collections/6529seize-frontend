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

  const { data: originalGroup, isFetching: loadingOriginalGroup } =
    useQuery<GroupFull>({
      queryKey: [QueryKey.GROUP, edit],
      queryFn: async () =>
        await commonApiFetch<GroupFull>({
          endpoint: `groups/${edit}`,
        }),
      placeholderData: keepPreviousData,
      enabled: !!edit && isEditMode,
    });

  const {
    data: originalGroupWallets,
    isFetching: loadingOriginalGroupWallets,
  } = useQuery<string[]>({
    queryKey: [
      QueryKey.GROUP_WALLET_GROUP_WALLETS,
      {
        group_id: originalGroup?.id,
        wallet_group_id: originalGroup?.group.identity_group_id,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<string[]>({
        endpoint: `groups/${originalGroup?.id}/identity_groups/${originalGroup?.group.identity_group_id}`,
      }),
    enabled: !!originalGroup?.id && !!originalGroup?.group.identity_group_id,
  });

  const [isFetching, setIsFetching] = useState(
    loadingOriginalGroup || loadingOriginalGroupWallets
  );
  useEffect(() => {
    setIsFetching(loadingOriginalGroup || loadingOriginalGroupWallets);
  }, [loadingOriginalGroup, loadingOriginalGroupWallets]);

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
      identity_addresses: null,
      excluded_identity_addresses: null,
    },
  });

  useEffect(() => {
    if (!originalGroup) {
      return;
    }
    setGroupConfig({
      name: originalGroup.name,
      group: {
        tdh: {
          min: originalGroup.group.tdh?.min,
          max: originalGroup.group.tdh?.max,
        },
        rep: {
          min: originalGroup.group.rep?.min,
          max: originalGroup.group.rep?.max,
          direction: originalGroup.group.rep?.direction,
          user_identity: originalGroup.group.rep?.user_identity,
          category: originalGroup.group.rep?.category,
        },
        cic: {
          min: originalGroup.group.cic?.min,
          max: originalGroup.group.cic?.max,
          direction: originalGroup.group.cic?.direction,
          user_identity: originalGroup.group.cic?.user_identity,
        },
        level: {
          min: originalGroup.group.level?.min,
          max: originalGroup.group.level?.max,
        },
        owns_nfts: originalGroup.group.owns_nfts,
        identity_addresses: originalGroupWallets ?? [],
        excluded_identity_addresses: [],
      },
    });
  }, [originalGroup, originalGroupWallets]);

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
              wallets={groupConfig.group.identity_addresses}
              excludeWallets={groupConfig.group.excluded_identity_addresses}
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
                  group: { ...prev.group, identity_addresses: wallets },
                }))
              }
              setExcludeWallets={(wallets) =>
                setGroupConfig((prev) => ({
                  ...prev,
                  group: {
                    ...prev.group,
                    excluded_identity_addresses: wallets,
                  },
                }))
              }
            />
            <GroupCreateActions
              originalGroup={originalGroup ?? null}
              groupConfig={groupConfig}
              onCompleted={onCompleted}
            />
          </div>
        </div>
      </div>
    </GroupCreateWrapper>
  );
}
