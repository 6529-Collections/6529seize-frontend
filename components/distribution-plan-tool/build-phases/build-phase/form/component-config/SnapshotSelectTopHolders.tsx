import { useContext, useEffect, useState } from "react";
import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import {
  PhaseGroupSnapshotConfig,
  TopHolderType,
} from "../BuildPhaseFormConfigModal";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";
import { DistributionPlanToolContext } from "../../../../DistributionPlanToolContext";
import {
  AllowlistOperationCode,
  Pool,
} from "../../../../../allowlist-tool/allowlist-tool.types";
import BuildPhaseFormConfigModalTitle from "./BuildPhaseFormConfigModalTitle";
import BuildPhaseFormConfigModalSidebar, {
  BuildPhaseFormConfigModalSidebarOption,
} from "./BuildPhaseFormConfigModalSidebar";

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
  }) => void;
  config: PhaseGroupSnapshotConfig;
  title: string;
  onClose: () => void;
}) {
  const { setToasts, operations } = useContext(DistributionPlanToolContext);

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
        operation.params.id === snapshotId &&
        operation.params.contract.toLowerCase() ===
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

  const onSelectTopHolders = () => {
    if (!topHolderType) {
      setToasts({
        messages: ["Please select a top holder type."],
        type: "error",
      });
      return;
    }

    if (typeof from !== "number" && typeof to !== "number") {
      setToasts({
        messages: ["Please insert a from or to value."],
        type: "error",
      });
      return;
    }

    if (typeof from === "number" && typeof to === "number" && from > to) {
      setToasts({
        messages: ["From value must be less than to value."],
        type: "error",
      });
      return;
    }

    if (typeof from === "number" && from < 1) {
      setToasts({
        messages: ["From value must be greater than 0."],
        type: "error",
      });
      return;
    }

    if (typeof to === "number" && to < 1) {
      setToasts({
        messages: ["To value must be greater than 0."],
        type: "error",
      });
      return;
    }

    onSelectTopHoldersFilter({
      type: topHolderType,
      from: typeof from === "number" ? from : null,
      to: typeof to === "number" ? to : null,
      tdhBlockNumber,
    });
  };

  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  useEffect(() => {
    if (!topHolderType) {
      setIsDisabled(true);
      return;
    }

    if (typeof from !== "number" && typeof to !== "number") {
      setIsDisabled(true);
      return;
    }

    if (typeof from === "number" && typeof to === "number" && from > to) {
      setIsDisabled(true);
      return;
    }

    if (typeof from === "number" && from < 1) {
      setIsDisabled(true);
      return;
    }

    if (typeof to === "number" && to < 1) {
      setIsDisabled(true);
      return;
    }

    setIsDisabled(false);
  }, [topHolderType, from, to]);

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
      <div className="tw-flex tw-gap-x-8">
        <BuildPhaseFormConfigModalSidebar
          options={sideBarOptions}
          selectedOption={topHolderType}
          setSelectedOption={(type) => setTopHolderType(type as TopHolderType)}
        />

        <div className="tw-w-full">
          <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
          <DistributionPlanSecondaryText>
            Do you want to include only some members of this group?
          </DistributionPlanSecondaryText>

          <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-y-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
                From
              </label>
              <div className="tw-mt-1.5">
                <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-1 focus-within:tw-ring-inset focus-within:tw-ring-primary-400">
                  <input
                    type="number"
                    value={from}
                    onChange={(event) =>
                      event.target.value
                        ? setFrom(Number(event.target.value))
                        : setFrom("")
                    }
                    className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                    placeholder="From"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
                To
              </label>
              <div className="tw-mt-1.5">
                <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-1 focus-within:tw-ring-inset focus-within:tw-ring-primary-400">
                  <input
                    type="number"
                    value={to}
                    onChange={(event) =>
                      event.target.value
                        ? setTo(Number(event.target.value))
                        : setTo("")
                    }
                    className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ComponentConfigNextBtn
        showSkipBtn={true}
        showNextBtn={!isDisabled}
        isDisabled={isDisabled}
        onSkip={onSelectTopHoldersSkip}
        onNext={onSelectTopHolders}
      />
    </div>
  );
}
