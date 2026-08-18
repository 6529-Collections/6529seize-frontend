"use client";

import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { normalizeGroupNftOwnerships } from "@/helpers/groups/group-nft-ownership";
import { dedupeWallets } from "@/helpers/WalletHelpers";
import { commonApiFetch } from "@/services/api/common-api";
import GroupCreateActions from "./actions/GroupCreateActions";
import GroupCreateConfig from "./config/GroupCreateConfig";
import GroupCreateIncludeMeAndPrivate from "./config/include-me-and-private/GroupCreateIncludeMeAndPrivate";
import type { GroupCreateWalletSources } from "./config/wallets/GroupCreateWallets";
import GroupCreateHeader from "./GroupCreateHeader";
import GroupCreateName from "./GroupCreateName";
import GroupCreateWrapper from "./GroupCreateWrapper";
import Button from "@/components/utils/button/Button";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";

function createEmptyGroupConfig(): ApiCreateGroup {
  return {
    name: "",
    group: {
      tdh: {
        min: null,
        max: null,
        inclusion_strategy: ApiGroupTdhInclusionStrategy.Both,
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
      is_beneficiary_of_grant_id: null,
      is_beneficiary_of_grant_match_mode:
        ApiGroupBeneficiaryGrantMatchMode.AnyToken,
    },
    is_private: false,
  };
}

function createEditGroupConfig(
  originalGroup: ApiGroupFull,
  originalGroupWallets: string[] | undefined,
  originalGroupExcludedWallets: string[] | undefined
): ApiCreateGroup {
  return {
    name: originalGroup.name,
    group: {
      tdh: {
        min: originalGroup.group.tdh.min,
        max: originalGroup.group.tdh.max,
        inclusion_strategy: originalGroup.group.tdh.inclusion_strategy,
      },
      rep: {
        min: originalGroup.group.rep.min,
        max: originalGroup.group.rep.max,
        direction: originalGroup.group.rep.direction,
        user_identity: originalGroup.group.rep.user_identity,
        category: originalGroup.group.rep.category,
      },
      cic: {
        min: originalGroup.group.cic.min,
        max: originalGroup.group.cic.max,
        direction: originalGroup.group.cic.direction,
        user_identity: originalGroup.group.cic.user_identity,
      },
      level: {
        min: originalGroup.group.level.min,
        max: originalGroup.group.level.max,
      },
      owns_nfts: normalizeGroupNftOwnerships(originalGroup.group.owns_nfts),
      identity_addresses: dedupeWallets(originalGroupWallets ?? []),
      excluded_identity_addresses: dedupeWallets(
        originalGroupExcludedWallets ?? []
      ),
      is_beneficiary_of_grant_id:
        originalGroup.group.is_beneficiary_of_grant_id,
      is_beneficiary_of_grant_match_mode:
        originalGroup.group.is_beneficiary_of_grant_match_mode,
    },
    is_private: originalGroup.is_private,
  };
}

function createWalletSources(
  wallets: string[] | null
): GroupCreateWalletSources {
  return {
    uploadedWallets: wallets !== null && wallets.length > 0 ? wallets : null,
    emmaWallets: null,
    selectedIdentities: [],
  };
}

function hasGroupInitialLoadError({
  isEditMode,
  isOriginalGroupError,
  hasIdentityGroupId,
  isOriginalGroupWalletsError,
  hasExcludedIdentityGroupId,
  isOriginalGroupExcludedWalletsError,
}: {
  readonly isEditMode: boolean;
  readonly isOriginalGroupError: boolean;
  readonly hasIdentityGroupId: boolean;
  readonly isOriginalGroupWalletsError: boolean;
  readonly hasExcludedIdentityGroupId: boolean;
  readonly isOriginalGroupExcludedWalletsError: boolean;
}): boolean {
  return (
    isEditMode &&
    (isOriginalGroupError ||
      (hasIdentityGroupId && isOriginalGroupWalletsError) ||
      (hasExcludedIdentityGroupId && isOriginalGroupExcludedWalletsError))
  );
}

function removeWalletsFromSources(
  sources: GroupCreateWalletSources,
  walletKeys: ReadonlySet<string>
): GroupCreateWalletSources {
  const filterWallets = (wallets: string[] | null) => {
    const filtered =
      wallets?.filter((wallet) => !walletKeys.has(wallet.toLowerCase())) ?? [];
    return filtered.length ? filtered : null;
  };
  const selectedIdentities = sources.selectedIdentities.filter((identity) => {
    return !walletKeys.has(identity.wallet.toLowerCase());
  });

  return {
    uploadedWallets: filterWallets(sources.uploadedWallets),
    emmaWallets: filterWallets(sources.emmaWallets),
    selectedIdentities,
  };
}

function GroupCreateForm({
  initialGroupConfig,
  originalGroup,
  onCompleted,
}: {
  readonly initialGroupConfig: ApiCreateGroup;
  readonly originalGroup: ApiGroupFull | null;
  readonly onCompleted: () => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const [groupConfig, setGroupConfig] = useState(() => initialGroupConfig);
  const [includeWalletSources, setIncludeWalletSources] =
    useState<GroupCreateWalletSources>(() =>
      createWalletSources(initialGroupConfig.group.identity_addresses)
    );
  const [excludeWalletSources, setExcludeWalletSources] =
    useState<GroupCreateWalletSources>(() =>
      createWalletSources(initialGroupConfig.group.excluded_identity_addresses)
    );

  const connectedWalletKeys = new Set([
    ...(connectedProfile?.wallets?.map((wallet) =>
      wallet.wallet.toLowerCase()
    ) ?? []),
    ...(connectedProfile?.primary_wallet
      ? [connectedProfile.primary_wallet.toLowerCase()]
      : []),
  ]);
  const iAmIncluded =
    groupConfig.group.identity_addresses?.some((address) =>
      connectedWalletKeys.has(address.toLowerCase())
    ) ?? false;

  const onSetIAmIncluded = (newState: boolean) => {
    const primaryWallet = connectedProfile?.primary_wallet?.toLowerCase();
    if (newState && !primaryWallet) {
      return;
    }

    if (!newState) {
      setIncludeWalletSources((sources) =>
        removeWalletsFromSources(sources, connectedWalletKeys)
      );
    }

    setGroupConfig((previousConfig) => {
      const currentAddresses = previousConfig.group.identity_addresses ?? [];
      const nextAddresses = currentAddresses.filter(
        (address) => !connectedWalletKeys.has(address.toLowerCase())
      );
      if (newState && primaryWallet) {
        nextAddresses.push(primaryWallet);
      }

      return {
        ...previousConfig,
        group: {
          ...previousConfig.group,
          identity_addresses: dedupeWallets(nextAddresses),
        },
      };
    });
  };

  return (
    <GroupCreateWrapper>
      <div className="tw-flex tw-flex-col tw-gap-y-6 sm:tw-gap-y-8">
        <div className="tw-space-y-4 sm:tw-space-y-5">
          <GroupCreateHeader />
          <div className="tw-grid tw-grid-cols-1 tw-gap-6 lg:tw-grid-cols-2">
            <GroupCreateName
              name={groupConfig.name}
              setName={(name) =>
                setGroupConfig((previousConfig) => ({
                  ...previousConfig,
                  name,
                }))
              }
            />
            <GroupCreateIncludeMeAndPrivate
              isPrivate={groupConfig.is_private ?? false}
              iAmIncluded={iAmIncluded}
              setIsPrivate={(isPrivate) =>
                setGroupConfig((previousConfig) => ({
                  ...previousConfig,
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
              beneficiaryGrantId={groupConfig.group.is_beneficiary_of_grant_id}
              beneficiaryGrantMatchMode={
                groupConfig.group.is_beneficiary_of_grant_match_mode
              }
              iAmIncluded={iAmIncluded}
              includeWalletSources={includeWalletSources}
              excludeWalletSources={excludeWalletSources}
              setIncludeWalletSources={setIncludeWalletSources}
              setExcludeWalletSources={setExcludeWalletSources}
              setLevel={(level) =>
                setGroupConfig((previousConfig) => ({
                  ...previousConfig,
                  group: { ...previousConfig.group, level },
                }))
              }
              setTDH={(tdh) =>
                setGroupConfig((previousConfig) => ({
                  ...previousConfig,
                  group: { ...previousConfig.group, tdh },
                }))
              }
              setCIC={(cic) =>
                setGroupConfig((previousConfig) => ({
                  ...previousConfig,
                  group: { ...previousConfig.group, cic },
                }))
              }
              setRep={(rep) =>
                setGroupConfig((previousConfig) => ({
                  ...previousConfig,
                  group: { ...previousConfig.group, rep },
                }))
              }
              setWallets={(wallets) =>
                setGroupConfig((previousConfig) => ({
                  ...previousConfig,
                  group: {
                    ...previousConfig.group,
                    identity_addresses: wallets,
                  },
                }))
              }
              setExcludeWallets={(wallets) =>
                setGroupConfig((previousConfig) => ({
                  ...previousConfig,
                  group: {
                    ...previousConfig.group,
                    excluded_identity_addresses: wallets,
                  },
                }))
              }
              setNfts={(nfts) =>
                setGroupConfig((previousConfig) => ({
                  ...previousConfig,
                  group: { ...previousConfig.group, owns_nfts: nfts },
                }))
              }
              setBeneficiaryGrantId={(grantId) =>
                setGroupConfig((previousConfig) => ({
                  ...previousConfig,
                  group: {
                    ...previousConfig.group,
                    is_beneficiary_of_grant_id: grantId ?? null,
                    ...(grantId
                      ? {}
                      : {
                          is_beneficiary_of_grant_match_mode:
                            ApiGroupBeneficiaryGrantMatchMode.AnyToken,
                        }),
                  },
                }))
              }
              setBeneficiaryGrantMatchMode={(matchMode) =>
                setGroupConfig((previousConfig) => ({
                  ...previousConfig,
                  group: {
                    ...previousConfig.group,
                    is_beneficiary_of_grant_match_mode:
                      matchMode ?? ApiGroupBeneficiaryGrantMatchMode.AnyToken,
                  },
                }))
              }
            />
            <GroupCreateActions
              originalGroup={originalGroup}
              groupConfig={groupConfig}
              onCompleted={onCompleted}
            />
          </div>
        </div>
      </div>
    </GroupCreateWrapper>
  );
}

export default function GroupCreate({
  edit,
  onCompleted,
}: {
  readonly edit: string;
  readonly onCompleted: () => void;
}) {
  const isEditMode = !!edit && edit !== "new";
  const {
    data: originalGroup,
    isError: isOriginalGroupError,
    refetch: refetchOriginalGroup,
  } = useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUP, edit],
    queryFn: async () =>
      await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${edit}`,
      }),
    enabled: !!edit && isEditMode,
  });
  const originalGroupId = originalGroup?.id;
  const identityGroupId = originalGroup?.group.identity_group_id;
  const excludedIdentityGroupId =
    originalGroup?.group.excluded_identity_group_id;

  const hasIdentityGroupId =
    identityGroupId !== null && identityGroupId !== undefined;
  const hasExcludedIdentityGroupId =
    excludedIdentityGroupId !== null && excludedIdentityGroupId !== undefined;

  const {
    data: originalGroupWallets,
    isError: isOriginalGroupWalletsError,
    refetch: refetchOriginalGroupWallets,
  } = useQuery<string[]>({
    queryKey: [
      QueryKey.GROUP_WALLET_GROUP_WALLETS,
      {
        group_id: originalGroupId,
        wallet_group_id: identityGroupId,
      },
    ],
    queryFn: async () => {
      if (
        originalGroupId === undefined ||
        identityGroupId === null ||
        identityGroupId === undefined
      ) {
        throw new Error("Group wallet query is missing its identifiers");
      }
      return await commonApiFetch<string[]>({
        endpoint: `groups/${originalGroupId}/identity_groups/${identityGroupId}`,
      });
    },
    enabled: originalGroupId !== undefined && hasIdentityGroupId,
  });

  const {
    data: originalGroupExcludedWallets,
    isError: isOriginalGroupExcludedWalletsError,
    refetch: refetchOriginalGroupExcludedWallets,
  } = useQuery<string[]>({
    queryKey: [
      QueryKey.GROUP_WALLET_GROUP_WALLETS,
      {
        group_id: originalGroupId,
        wallet_group_id: excludedIdentityGroupId,
      },
    ],
    queryFn: async () => {
      if (
        originalGroupId === undefined ||
        excludedIdentityGroupId === null ||
        excludedIdentityGroupId === undefined
      ) {
        throw new Error(
          "Excluded group wallet query is missing its identifiers"
        );
      }
      return await commonApiFetch<string[]>({
        endpoint: `groups/${originalGroupId}/identity_groups/${excludedIdentityGroupId}`,
      });
    },
    enabled: originalGroupId !== undefined && hasExcludedIdentityGroupId,
  });

  const hasInitialLoadError = hasGroupInitialLoadError({
    isEditMode,
    isOriginalGroupError,
    hasIdentityGroupId,
    isOriginalGroupWalletsError,
    hasExcludedIdentityGroupId,
    isOriginalGroupExcludedWalletsError,
  });

  if (hasInitialLoadError) {
    return (
      <GroupCreateWrapper>
        <div
          role="alert"
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5"
        >
          <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
            Unable to load this group
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
            Please try loading the group details again.
          </p>
          <Button
            variant="tertiary"
            size="sm"
            className="tw-mt-4"
            onClick={() => {
              void refetchOriginalGroup();
              if (hasIdentityGroupId) {
                void refetchOriginalGroupWallets();
              }
              if (hasExcludedIdentityGroupId) {
                void refetchOriginalGroupExcludedWallets();
              }
            }}
          >
            Retry
          </Button>
        </div>
      </GroupCreateWrapper>
    );
  }

  const isLoadingInitialData =
    isEditMode &&
    (originalGroup === undefined ||
      (hasIdentityGroupId && originalGroupWallets === undefined) ||
      (hasExcludedIdentityGroupId &&
        originalGroupExcludedWallets === undefined));

  if (isLoadingInitialData) {
    return (
      <GroupCreateWrapper>
        <div
          role="status"
          aria-live="polite"
          className="tw-flex tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 tw-text-sm tw-text-iron-300"
        >
          <CircleLoader size={CircleLoaderSize.MEDIUM} />
          <span>Loading group...</span>
        </div>
      </GroupCreateWrapper>
    );
  }

  const resolvedOriginalGroup = isEditMode ? (originalGroup ?? null) : null;
  const initialGroupConfig = resolvedOriginalGroup
    ? createEditGroupConfig(
        resolvedOriginalGroup,
        originalGroupWallets,
        originalGroupExcludedWallets
      )
    : createEmptyGroupConfig();

  return (
    <GroupCreateForm
      key={resolvedOriginalGroup?.id ?? "new"}
      initialGroupConfig={initialGroupConfig}
      originalGroup={resolvedOriginalGroup}
      onCompleted={onCompleted}
    />
  );
}
