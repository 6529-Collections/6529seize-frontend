"use client";

import {
    AllowlistOperationCode,
    Pool,
} from "@/components/allowlist-tool/allowlist-tool.types";
import DistributionPlanSecondaryText from "@/components/distribution-plan-tool/common/DistributionPlanSecondaryText";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { useContext, useEffect, useState } from "react";
import type {
    PhaseGroupSnapshotConfig} from "../BuildPhaseFormConfigModal";
import {
    TopHolderType,
} from "../BuildPhaseFormConfigModal";
import type {
    BuildPhaseFormConfigModalSidebarOption,
} from "./BuildPhaseFormConfigModalSidebar";
import BuildPhaseFormConfigModalSidebar from "./BuildPhaseFormConfigModalSidebar";
import BuildPhaseFormConfigModalTitle from "./BuildPhaseFormConfigModalTitle";
import ComponentConfigMeta from "./ComponentConfigMeta";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";

export default function SnapshotSelectTopHolders({
  onSelectTopHoldersSkip,
  onSelectTopHoldersFilter,
  config,
  title,
  onClose,
}: {
  onSelectTopHoldersSkip: () => void;
  onSelectTopHoldersFilter: (params: {
    type: TopHolderType;
    from: number | null;
    to: number | null;
    tdhBlockNumber: number | null;
    uniqueWalletsCount: number | null;
  }) => void;
  config: PhaseGroupSnapshotConfig;
  title: string;
  onClose: () => void;
}) {
  const { operations } = useContext(DistributionPlanToolContext);

  const [isMemes, setIsMemes] = useState<boolean>(false);
  const [tdhBlockNumber, setTdhBlockNumber] = useState<number | null>(null);

  useEffect(() => {
    const { snapshotId, snapshotType } = config;
    if (!snapshotId || !snapshotType) {
      setIsMemes(false);
      return;
    }
    if (snapshotType !== Pool.TOKEN_POOL) {
      setIsMemes(false);
      return;
    }

    const tokenPool = operations.find(
      (operation) =>
        operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL &&
        operation.params["id"] === snapshotId &&
        operation.params["contract"].toLowerCase() ===
          "0x33fd426905f149f8376e227d0c9d3340aad17af1"
    );
    if (!tokenPool) {
      setIsMemes(false);
      return;
    }

    const { contract, blockNo } = tokenPool.params;

    if (!contract || !blockNo) {
      setIsMemes(false);
      return;
    }

    setIsMemes(
      contract.toLowerCase() === "0x33fd426905f149f8376e227d0c9d3340aad17af1"
    );
    setTdhBlockNumber(blockNo);
  }, [operations, config]);

  const [topHolderType, setTopHolderType] = useState<TopHolderType | null>(
    TopHolderType.TOTAL_TOKENS_COUNT
  );

  const [from, setFrom] = useState<number | string>("");
  const [to, setTo] = useState<number | string>("");

  const [errors, setErrors] = useState<{
    missingTopHolderType: boolean;
    localUniqueWalletsHigherThanTotal: boolean;
    fromAndToMissing: boolean;
    fromHigherThanTo: boolean;
    fromLowerThanOne: boolean;
    fromHigherThanTotalError: boolean;
    toLowerThanOne: boolean;
    toHigherThanTotal: boolean;
  }>({
    missingTopHolderType: false,
    localUniqueWalletsHigherThanTotal: false,
    fromAndToMissing: false,
    fromHigherThanTo: false,
    fromLowerThanOne: false,
    fromHigherThanTotalError: false,
    toLowerThanOne: false,
    toHigherThanTotal: false,
  });

  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  const [localUniqueWalletsCount, setLocalUniqueWalletsCount] = useState<
    number | null
  >(config.uniqueWalletsCount);

  useEffect(() => {
    if (!config.uniqueWalletsCount) return;
    const localFrom =
      typeof from === "number" ? (from > 0 ? from - 1 : from) : 0;
    const localTo = typeof to === "number" ? to : config.uniqueWalletsCount;
    setLocalUniqueWalletsCount(localTo - localFrom);
  }, [config.uniqueWalletsCount, from, to]);

  useEffect(() => {
    const missingTopHolderTypeError = !topHolderType;

    const localUniqueWalletsHigherThanTotalError =
      typeof localUniqueWalletsCount === "number" &&
      typeof config.uniqueWalletsCount === "number" &&
      localUniqueWalletsCount > config.uniqueWalletsCount;

    const fromAndToMissingError =
      typeof from !== "number" && typeof to !== "number";

    const fromHigherThanToError =
      typeof from === "number" && typeof to === "number" && from > to;
    const fromLowerThanOneError = typeof from === "number" && from < 1;
    const fromHigherThanTotalError =
      typeof from === "number" &&
      typeof config.uniqueWalletsCount === "number" &&
      from > config.uniqueWalletsCount;
    const toLowerThanOneError = typeof to === "number" && to < 1;
    const toHigherThanTotalError =
      typeof to === "number" &&
      typeof config.uniqueWalletsCount === "number" &&
      to > config.uniqueWalletsCount;

    setErrors({
      missingTopHolderType: missingTopHolderTypeError,
      localUniqueWalletsHigherThanTotal: localUniqueWalletsHigherThanTotalError,
      fromAndToMissing: fromAndToMissingError,
      fromHigherThanTo: fromHigherThanToError,
      fromLowerThanOne: fromLowerThanOneError,
      fromHigherThanTotalError: fromHigherThanTotalError,
      toLowerThanOne: toLowerThanOneError,
      toHigherThanTotal: toHigherThanTotalError,
    });
  }, [
    topHolderType,
    from,
    to,
    localUniqueWalletsCount,
    config.uniqueWalletsCount,
  ]);

  useEffect(() => {
    setIsDisabled(Object.values(errors).some((error) => error));
  }, [errors]);

  const [isToError, setIsToError] = useState<boolean>(false);
  const [isFromError, setIsFromError] = useState<boolean>(false);

  useEffect(() => {
    const toError = errors.toLowerThanOne || errors.toHigherThanTotal;
    setIsToError(toError);
  }, [errors.toLowerThanOne, errors.toHigherThanTotal]);

  useEffect(() => {
    const fromError =
      errors.fromLowerThanOne ||
      errors.fromHigherThanTo ||
      errors.fromHigherThanTotalError;
    setIsFromError(fromError);
  }, [
    errors.fromLowerThanOne,
    errors.fromHigherThanTotalError,
    errors.fromHigherThanTo,
  ]);

  const onSelectTopHolders = () => {
    if (isDisabled || !topHolderType) return;
    onSelectTopHoldersFilter({
      type: topHolderType,
      from: typeof from === "number" ? from : null,
      to: typeof to === "number" ? to : null,
      tdhBlockNumber,
      uniqueWalletsCount: localUniqueWalletsCount,
    });
  };

  const [sideBarOptions, setSideBarOptions] = useState<
    BuildPhaseFormConfigModalSidebarOption[]
  >([
    {
      label: "Total tokens count",
      value: TopHolderType.TOTAL_TOKENS_COUNT,
    },
  ]);

  useEffect(() => {
    const options: BuildPhaseFormConfigModalSidebarOption[] = [
      {
        label: "Total tokens count",
        value: TopHolderType.TOTAL_TOKENS_COUNT,
      },
    ];
    if (config.snapshotSchema === "erc1155") {
      options.push({
        label: "Unique tokens count",
        value: TopHolderType.UNIQUE_TOKENS_COUNT,
      });
    }

    if (isMemes) {
      options.push({
        label: "TDH",
        value: TopHolderType.MEMES_TDH,
      });
    }

    setSideBarOptions(options);
  }, [isMemes, config.snapshotSchema]);

  return (
    <div>
      <div className="tw-flex">
        <BuildPhaseFormConfigModalSidebar
          label="Ranked by"
          options={sideBarOptions}
          selectedOption={topHolderType}
          setSelectedOption={(type) => setTopHolderType(type as TopHolderType)}
        />

        <div className="tw-w-full tw-p-6">
          <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
          <DistributionPlanSecondaryText>
            Do you want to include only some members of this group?
          </DistributionPlanSecondaryText>

          <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-y-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
                From (included)
              </label>
              <div className="tw-mt-1.5">
                <div
                  className={`
                  tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset focus-within:tw-ring-1 focus-within:tw-ring-inset tw-transition tw-duration-300 tw-ease-out ${
                    isFromError
                      ? "tw-ring-error focus-within:tw-ring-error"
                      : "tw-ring-iron-700/40 focus-within:tw-ring-primary-400"
                  }`}>
                  <input
                    type="number"
                    value={from}
                    min={1}
                    max={config.uniqueWalletsCount ?? Infinity}
                    onChange={(event) =>
                      event.target.value
                        ? setFrom(Number(event.target.value))
                        : setFrom("")
                    }
                    className="tw-form-input tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-iron-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6 "
                    placeholder={`From (1 - ${
                      config.uniqueWalletsCount ?? "∞"
                    })`}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
                To (included)
              </label>
              <div className="tw-mt-1.5">
                <div
                  className={`
                  tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset focus-within:tw-ring-1 focus-within:tw-ring-inset tw-transition tw-duration-300 tw-ease-out ${
                    isToError
                      ? "tw-ring-error focus-within:tw-ring-error"
                      : "tw-ring-iron-700/40 focus-within:tw-ring-primary-400"
                  }`}>
                  <input
                    type="number"
                    min={1}
                    max={config.uniqueWalletsCount ?? Infinity}
                    value={to}
                    onChange={(event) =>
                      event.target.value
                        ? setTo(Number(event.target.value))
                        : setTo("")
                    }
                    className="tw-form-input tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-iron-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                    placeholder={`To (1 - ${config.uniqueWalletsCount ?? "∞"})`}
                  />
                </div>
              </div>
            </div>
          </div>
          <ComponentConfigNextBtn
            showSkipBtn={true}
            showNextBtn={!isDisabled}
            isDisabled={isDisabled}
            onSkip={onSelectTopHoldersSkip}
            onNext={onSelectTopHolders}>
            <ComponentConfigMeta
              tags={[]}
              walletsCount={localUniqueWalletsCount}
              isLoading={false}
            />
          </ComponentConfigNextBtn>
        </div>
      </div>
    </div>
  );
}
