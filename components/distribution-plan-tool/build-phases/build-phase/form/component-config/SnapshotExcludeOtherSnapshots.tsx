"use client";

import { useContext, useEffect, useState } from "react";
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
  Pool,
} from "@/components/allowlist-tool/allowlist-tool.types";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";
import ComponentConfigMeta from "./ComponentConfigMeta";

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

  const [poolTypeToString] = useState<Record<Pool, string>>({
    [Pool.CUSTOM_TOKEN_POOL]: "Custom Snapshot",
    [Pool.TOKEN_POOL]: "Snapshot",
    [Pool.WALLET_POOL]: "Wallets",
  });

  const options: AllowlistToolSelectMenuMultipleOption[] = snapshots
    .filter((s) => s.id !== config.snapshotId)
    .map((s) => ({
      title: s.name,
      subTitle: poolTypeToString[s.poolType],
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
  >(null);

  const [snapshotsToExclude, setSnapshotsToExclude] = useState<
    PhaseGroupSnapshotConfigExcludeSnapshot[]
  >([]);

  useEffect(() => {
    const poolStringToPoolType = (str: string): Pool => {
      const poolType = Object.entries(poolTypeToString)
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
                    ?.params.tokens.map((t: any) => t.owner) ?? []
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
  }, [selectedOptions, operations, setToasts, poolTypeToString]);

  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const getCustomTokenPoolWallets = (): string[] => {
  //     const operation = operations.find(
  //       (o) =>
  //         o.code === AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL &&
  //         o.params.id === config.snapshotId
  //     );
  //     if (!operation) {
  //       return [];
  //     }

  //     return operation.params.tokens.map((t: any) => t.owner.toLowerCase());
  //   };

  //   const fetchUniqueWalletsCount = async () => {
  //     if (!snapshotsToExclude.length) {
  //       setLocalUniqueWalletsCount(config.uniqueWalletsCount);
  //       return;
  //     }
  //     if (!distributionPlan || !config.snapshotType) return;
  //     const extraWallets =
  //       config.snapshotType === Pool.CUSTOM_TOKEN_POOL
  //         ? getCustomTokenPoolWallets()
  //         : [];
  //     setLoading(true);
  //     const endpoint = `/allowlists/${distributionPlan.id}/token-pool-downloads/token-pool/${config.snapshotId}/unique-wallets-count`;
  //     const { success, data } = await distributionPlanApiPost<number>({
  //       endpoint,
  //       body: {
  //         excludeComponentWinners: [],
  //         excludeSnapshots: snapshotsToExclude,
  //         extraWallets,
  //       },
  //     });
  //     setLoading(false);
  //     if (!success) {
  //       return { success: false };
  //     }
  //     setLocalUniqueWalletsCount(data);
  //     return { success: true };
  //   };
  //   fetchUniqueWalletsCount();
  // }, [config, distributionPlan, snapshotsToExclude, setToasts, operations]);

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
          isLoading={loading}
        />
      </ComponentConfigNextBtn>
    </div>
  );
}
