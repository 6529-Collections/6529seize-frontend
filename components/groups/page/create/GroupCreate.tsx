"use client";

import { useContext, useEffect, useState } from "react";
import GroupCreateConfig from "./config/GroupCreateConfig";
import GroupCreateActions from "./actions/GroupCreateActions";
import GroupCreateHeader from "./GroupCreateHeader";
import GroupCreateName from "./GroupCreateName";
import GroupCreateWrapper from "./GroupCreateWrapper";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { commonApiFetch } from "@/services/api/common-api";
import GroupCreateIncludeMeAndPrivate from "./config/include-me-and-private/GroupCreateIncludeMeAndPrivate";
import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

export default function GroupCreate({
  edit,
  onCompleted,
}: {
  readonly edit: string;
  readonly onCompleted: () => void;
}) {
  const isEditMode = !!edit && edit !== "new";
  const { connectedProfile } = useContext(AuthContext);
  const { data: originalGroup, isFetching: loadingOriginalGroup } =
    useQuery<ApiGroupFull>({
      queryKey: [QueryKey.GROUP, edit],
      queryFn: async () =>
        await commonApiFetch<ApiGroupFull>({
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

  const {
    data: originalGroupExcludedWallets,
    isFetching: loadingOriginalGroupExcludedWallets,
  } = useQuery<string[]>({
    queryKey: [
      QueryKey.GROUP_WALLET_GROUP_WALLETS,
      {
        group_id: originalGroup?.id,
        wallet_group_id: originalGroup?.group.excluded_identity_group_id,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<string[]>({
        endpoint: `groups/${originalGroup?.id}/identity_groups/${originalGroup?.group.excluded_identity_group_id}`,
      }),
    enabled:
      !!originalGroup?.id && !!originalGroup?.group.excluded_identity_group_id,
  });

  const [isFetching, setIsFetching] = useState(
    loadingOriginalGroup ||
    loadingOriginalGroupWallets ||
    loadingOriginalGroupExcludedWallets
  );
  useEffect(() => {
    setIsFetching(
      loadingOriginalGroup ||
      loadingOriginalGroupWallets ||
      loadingOriginalGroupExcludedWallets
    );
  }, [
    loadingOriginalGroup,
    loadingOriginalGroupWallets,
    loadingOriginalGroupExcludedWallets,
  ]);

  const [groupConfig, setGroupConfig] = useState<ApiCreateGroup>({
    name: "",
    group: {
      tdh: {
        min: null,
        max: null,
        inclusion_strategy: ApiGroupTdhInclusionStrategy.Tdh,
      },
      rep: {
        min: null,
        max: null,
        direction: ApiGroupFilterDirection.Received,
        user_identity: null,
        category: null,
      },
      cic: {
        min: null,
        max: null,
        direction: ApiGroupFilterDirection.Received,
        user_identity: null,
      },
      level: { min: null, max: null },
      owns_nfts: [],
      identity_addresses: null,
      excluded_identity_addresses: null,
    },
    is_private: false,
  });

  const [iAmIncluded, setIAmIncluded] = useState(false);

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
          inclusion_strategy:
            originalGroup.group.tdh?.inclusion_strategy ??
            ApiGroupTdhInclusionStrategy.Tdh,
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
        excluded_identity_addresses: originalGroupExcludedWallets ?? [],
      },
      is_private: originalGroup.is_private ?? false,
    });
  }, [originalGroup, originalGroupWallets, originalGroupExcludedWallets]);

  const getMyAddresses = () => {
    if (!connectedProfile) {
      return [];
    }
    return connectedProfile.wallets?.map((w) => w.wallet.toLowerCase()) ?? [];
  };

  useEffect(() => {
    if (!connectedProfile) {
      return;
    }

    const myAddresses = getMyAddresses();

    setIAmIncluded(
      groupConfig.group.identity_addresses?.some((address) =>
        myAddresses.includes(address.toLowerCase())
      ) ?? false
    );
  }, [connectedProfile, groupConfig]);

  const onSetIAmIncluded = (newState: boolean) => {
    const primaryWallet = connectedProfile?.primary_wallet?.toLowerCase();
    if (newState && !primaryWallet) {
      return;
    }
    setIAmIncluded(newState);
    const consolidatedAddresses =
      connectedProfile?.wallets?.map((w) => w.wallet.toLowerCase()) ?? [];
    const currentAddresses = groupConfig.group.identity_addresses ?? [];
    const newAddresses = currentAddresses.filter(
      (address) => !consolidatedAddresses.includes(address.toLowerCase())
    );
    if (newState && primaryWallet) {
      newAddresses.push(primaryWallet);
    }
    setGroupConfig((prev) => ({
      ...prev,
      group: { ...prev.group, identity_addresses: newAddresses },
    }));
  };

  if (isFetching) {
    return <div>Loading...</div>;
  }

  return (
    <GroupCreateWrapper>
      <div className="tw-flex tw-flex-col tw-gap-y-6 sm:tw-gap-y-8">
        <div className="tw-space-y-4 sm:tw-space-y-5">
          <GroupCreateHeader />
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
            <GroupCreateName
              name={groupConfig.name}
              setName={(name) =>
                setGroupConfig((prev) => ({
                  ...prev,
                  name,
                }))
              }
            />
            <GroupCreateIncludeMeAndPrivate
              isPrivate={groupConfig.is_private ?? false}
              iAmIncluded={iAmIncluded}
              setIsPrivate={(isPrivate) =>
                setGroupConfig((prev) => ({
                  ...prev,
                  is_private: isPrivate,
                }))
              }
              setIAmIncluded={onSetIAmIncluded}
            />
          </div>
        </div>
        <div className="tw-space-y-5">
          <div>
            <GroupCreateConfig
              level={groupConfig.group.level}
              tdh={groupConfig.group.tdh}
              cic={groupConfig.group.cic}
              rep={groupConfig.group.rep}
              wallets={groupConfig.group.identity_addresses}
              excludeWallets={groupConfig.group.excluded_identity_addresses}
              nfts={groupConfig.group.owns_nfts}
              iAmIncluded={iAmIncluded}
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
              setNfts={(nfts) =>
                setGroupConfig((prev) => ({
                  ...prev,
                  group: { ...prev.group, owns_nfts: nfts },
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
