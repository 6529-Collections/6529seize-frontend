"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import AllowlistToolSelectMenuMultiple, {
  AllowlistToolSelectMenuMultipleOption,
} from "@/components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple";
import {
  DistributionPlanSnapshot,
  PhaseGroupSnapshotConfig,
  PhaseGroupSnapshotConfigExcludeSnapshot,
} from "../BuildPhaseFormConfigModal";
import BuildPhaseFormConfigModalTitle from "./BuildPhaseFormConfigModalTitle";
import DistributionPlanSecondaryText from "@/components/distribution-plan-tool/common/DistributionPlanSecondaryText";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import {
  AllowlistOperationCode,
  CustomTokenPoolParamsToken,
  Pool,
} from "@/components/allowlist-tool/allowlist-tool.types";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";
import ComponentConfigMeta from "./ComponentConfigMeta";
import { distributionPlanApiPost } from "@/services/distribution-plan-api";
import { useQuery } from "@tanstack/react-query";

const POOL_TYPE_TO_STRING: Record<Pool, string> = {
  [Pool.CUSTOM_TOKEN_POOL]: "Custom Snapshot",
  [Pool.TOKEN_POOL]: "Snapshot",
  [Pool.WALLET_POOL]: "Wallets",
};

export default function SnapshotExcludeOtherSnapshots({
  snapshots,
  config,
  onSkip,
  onSelectExcludeOtherSnapshots,
  title,
  onClose,
}: {
  snapshots: DistributionPlanSnapshot[];
  config: PhaseGroupSnapshotConfig;
  onSkip: () => void;
  onSelectExcludeOtherSnapshots: (param: {
    snapshotsToExclude: PhaseGroupSnapshotConfigExcludeSnapshot[];
    uniqueWalletsCount: number | null;
  }) => void;
  title: string;
  onClose: () => void;
}) {
  const { operations, distributionPlan, setToasts } = useContext(
    DistributionPlanToolContext
  );

  const options: AllowlistToolSelectMenuMultipleOption[] = snapshots
    .filter((s) => s.id !== config.snapshotId)
    .map((s) => ({
      title: s.name,
      subTitle: POOL_TYPE_TO_STRING[s.poolType],
      value: s.id,
    }));

  const [selectedOptions, setSelectedOptions] = useState<
    AllowlistToolSelectMenuMultipleOption[]
  >([]);

  const toggleSelectedOption = (
    option: AllowlistToolSelectMenuMultipleOption
  ) => {
    const isSelected = selectedOptions.some((o) => o.value === option.value);
    if (isSelected) {
      setSelectedOptions(
        selectedOptions.filter((o) => o.value !== option.value)
      );
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };
  const [localUniqueWalletsCount, setLocalUniqueWalletsCount] = useState<
    number | null
  >(config.uniqueWalletsCount);

  const [snapshotsToExclude, setSnapshotsToExclude] = useState<
    PhaseGroupSnapshotConfigExcludeSnapshot[]
  >([]);

  useEffect(() => {
    const poolStringToPoolType = (str: string): Pool => {
      const poolType = Object.entries(POOL_TYPE_TO_STRING)
        .find(([, value]) => value === str)
        ?.at(0);
      if (!poolType) {
        setToasts({
          type: "error",
          messages: [`Unknown pool type: ${str}`],
        });
        throw new Error(`Unknown pool type: ${str}`);
      }
      return poolType as Pool;
    };
    setSnapshotsToExclude(
      selectedOptions.map((o) => {
        const snapshotType = poolStringToPoolType(o.subTitle ?? "");
        const extraWallets: string[] =
          snapshotType === Pool.TOKEN_POOL
            ? []
            : snapshotType === Pool.WALLET_POOL
            ? Array.from(
                new Set(
                  operations.find(
                    (o2) =>
                      o2.code === AllowlistOperationCode.CREATE_WALLET_POOL &&
                      o2.params.id === o.value
                  )?.params.wallets ?? []
                )
              )
            : snapshotType === Pool.CUSTOM_TOKEN_POOL
            ? Array.from(
                new Set(
                  operations
                    .find(
                      (o2) =>
                        o2.code ===
                          AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL &&
                        o2.params.id === o.value
                    )
                    ?.params.tokens.map(
                      (token: CustomTokenPoolParamsToken) => token.owner
                    ) ?? []
                )
              )
            : assertUnreachable(snapshotType);
        return {
          snapshotId: o.value,
          snapshotType,
          extraWallets,
        };
      })
    );
  }, [selectedOptions, operations, setToasts]);

  const distributionPlanId = distributionPlan?.id ?? null;
  const currentSnapshotExtraWallets = useMemo(() => {
    if (config.snapshotType !== Pool.CUSTOM_TOKEN_POOL) {
      return [];
    }
    const operation = operations.find(
      (operationItem) =>
        operationItem.code ===
          AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL &&
        operationItem.params.id === config.snapshotId
    );
    if (!operation) {
      return [];
    }
    const tokens = operation.params
      .tokens as CustomTokenPoolParamsToken[] | undefined;
    const owners = (tokens ?? [])
      .map((token) => token?.owner)
      .filter((owner: unknown): owner is string => typeof owner === "string")
      .map((owner) => owner.toLowerCase());
    return Array.from(new Set(owners));
  }, [config.snapshotId, config.snapshotType, operations]);

  const shouldFetchUniqueWalletsCount =
    !!snapshotsToExclude.length &&
    !!distributionPlanId &&
    !!config.snapshotId &&
    !!config.snapshotType;

  const {
    data: fetchedUniqueWalletsCount,
    isFetching: isUniqueWalletsCountLoading,
    isError: isUniqueWalletsCountError,
  } = useQuery<number>({
    queryKey: [
      "distribution-plan",
      distributionPlanId,
      config.snapshotId,
      "unique-wallets-count",
      snapshotsToExclude,
      currentSnapshotExtraWallets,
    ],
    queryFn: async () => {
      if (!distributionPlanId || !config.snapshotId) {
        throw new Error("Missing required distribution plan data");
      }

      const { success, data } = await distributionPlanApiPost<number>({
        endpoint: `/allowlists/${distributionPlanId}/token-pool-downloads/token-pool/${config.snapshotId}/unique-wallets-count`,
        body: {
          excludeComponentWinners: [],
          excludeSnapshots: snapshotsToExclude,
          extraWallets: currentSnapshotExtraWallets,
        },
      });

      if (!success || typeof data !== "number") {
        throw new Error("Failed to fetch unique wallets count");
      }

      return data;
    },
    enabled: shouldFetchUniqueWalletsCount,
  });

  useEffect(() => {
    if (!shouldFetchUniqueWalletsCount) {
      setLocalUniqueWalletsCount(config.uniqueWalletsCount);
    }
  }, [shouldFetchUniqueWalletsCount, config.uniqueWalletsCount]);

  useEffect(() => {
    if (typeof fetchedUniqueWalletsCount === "number") {
      setLocalUniqueWalletsCount(fetchedUniqueWalletsCount);
    }
  }, [fetchedUniqueWalletsCount]);

  useEffect(() => {
    if (isUniqueWalletsCountError) {
      setLocalUniqueWalletsCount(config.uniqueWalletsCount);
    }
  }, [isUniqueWalletsCountError, config.uniqueWalletsCount]);

  const onNext = () => {
    onSelectExcludeOtherSnapshots({
      snapshotsToExclude,
      uniqueWalletsCount: localUniqueWalletsCount,
    });
  };
  return (
    <div className="tw-relative tw-p-6">
      <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
      <DistributionPlanSecondaryText>
        Exclude Other Snapshots Members.
      </DistributionPlanSecondaryText>

      <div className="tw-mt-6">
        <AllowlistToolSelectMenuMultiple
          label="Select Snapshots To Exclude"
          placeholder="No snapshots excluded"
          allSelectedTitle="All Snapshots Excluded"
          someSelectedTitleSuffix="Snapshots Excluded"
          options={options}
          selectedOptions={selectedOptions}
          toggleSelectedOption={toggleSelectedOption}
        />
      </div>
      <ComponentConfigNextBtn
        showSkipBtn={true}
        showNextBtn={!!selectedOptions.length}
        isDisabled={!selectedOptions.length}
        onSkip={onSkip}
        onNext={onNext}>
        <ComponentConfigMeta
          tags={[]}
          walletsCount={localUniqueWalletsCount}
          isLoading={isUniqueWalletsCountLoading}
        />
      </ComponentConfigNextBtn>
    </div>
  );
}
