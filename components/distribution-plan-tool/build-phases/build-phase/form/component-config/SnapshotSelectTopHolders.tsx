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

export default function SnapshotSelectTopHolders({
  onSelectTopHoldersSkip,
  onSelectTopHoldersFilter,
  config,
}: {
  onSelectTopHoldersSkip: () => void;
  onSelectTopHoldersFilter: (params: {
    type: TopHolderType;
    from: number | null;
    to: number | null;
    tdhBlockNumber: number | null;
  }) => void;
  config: PhaseGroupSnapshotConfig;
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
    const transferPoolId = operations.find(
      (operation) =>
        operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL &&
        operation.params.id === snapshotId
    )?.params.transferPoolId;
    if (!transferPoolId) {
      setIsMemes(false);
      return;
    }

    const { contract, blockNo } = operations.find(
      (operation) =>
        operation.code === AllowlistOperationCode.GET_COLLECTION_TRANSFERS &&
        operation.params.id === transferPoolId
    )?.params;

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

  const activeClasses = "tw-bg-primary-500 tw-border-primary-500";
  const inactiveClasses =
    "tw-bg-transparent hover:tw-bg-neutral-800/80 tw-border-neutral-700";
  const totalTokensCountBaseClasses =
    "tw-inline-flex tw-items-center tw-justify-center tw-rounded-l-lg tw-cursor-pointer tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid  tw-transition tw-duration-300 tw-ease-out";

  const memesTdhBaseClasses =
    "-tw-ml-px tw-inline-flex tw-items-center tw-justify-center tw-rounded-r-lg tw-cursor-pointer   tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid  tw-transition tw-duration-300 tw-ease-out";

  const [uniqueTokensCountBaseClasses, setUniqueTokensCountBaseClasses] =
    useState(
      "-tw-ml-px tw-inline-flex tw-items-center tw-justify-center tw-rounded-r-lg tw-cursor-pointer tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid  tw-transition tw-duration-300 tw-ease-out"
    );

  useEffect(() => {
    setUniqueTokensCountBaseClasses(
      `-tw-ml-px tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid  tw-transition tw-duration-300 tw-ease-out ${
        isMemes ? "" : "tw-rounded-r-lg"
      }`
    );
  }, [isMemes]);

  const [totalTokensCountClasses, setTotalTokensCountClasses] =
    useState<string>(`${totalTokensCountBaseClasses} ${activeClasses}`);
  const [uniqueTokensCountClasses, setUniqueTokensCountClasses] =
    useState<string>(`${uniqueTokensCountBaseClasses} ${inactiveClasses}`);
  const [memesTdhClasses, setMemesTdhClasses] = useState<string>(
    `${memesTdhBaseClasses} ${inactiveClasses}`
  );

  useEffect(() => {
    if (topHolderType === TopHolderType.TOTAL_TOKENS_COUNT) {
      setTotalTokensCountClasses(
        `${totalTokensCountBaseClasses} ${activeClasses}`
      );
      setUniqueTokensCountClasses(
        `${uniqueTokensCountBaseClasses} ${inactiveClasses}`
      );
      setMemesTdhClasses(`${memesTdhBaseClasses} ${inactiveClasses}`);
    } else if (topHolderType === TopHolderType.UNIQUE_TOKENS_COUNT) {
      setTotalTokensCountClasses(
        `${totalTokensCountBaseClasses} ${inactiveClasses}`
      );
      setUniqueTokensCountClasses(
        `${uniqueTokensCountBaseClasses} ${activeClasses}`
      );
      setMemesTdhClasses(`${memesTdhBaseClasses} ${inactiveClasses}`);
    } else if (topHolderType === TopHolderType.MEMES_TDH) {
      setTotalTokensCountClasses(
        `${totalTokensCountBaseClasses} ${inactiveClasses}`
      );
      setUniqueTokensCountClasses(
        `${uniqueTokensCountBaseClasses} ${inactiveClasses}`
      );
      setMemesTdhClasses(`${memesTdhBaseClasses} ${activeClasses}`);
    } else {
      setTotalTokensCountClasses(
        `${totalTokensCountBaseClasses} ${inactiveClasses}`
      );
      setUniqueTokensCountClasses(
        `${uniqueTokensCountBaseClasses} ${inactiveClasses}`
      );
      setMemesTdhClasses(`${memesTdhBaseClasses} ${inactiveClasses}`);
    }
  }, [topHolderType, uniqueTokensCountBaseClasses]);

  return (
    <div>
      <DistributionPlanSecondaryText>
        Do you want to include only some members of this group?
      </DistributionPlanSecondaryText>
      <div className="tw-mt-6">
        <span className="tw-isolate tw-inline-flex tw-rounded-lg tw-shadow-sm">
          <button
            onClick={() => setTopHolderType(TopHolderType.TOTAL_TOKENS_COUNT)}
            type="button"
            className={totalTokensCountClasses}
          >
            Total tokens count
          </button>
          <button
            onClick={() => setTopHolderType(TopHolderType.UNIQUE_TOKENS_COUNT)}
            type="button"
            className={uniqueTokensCountClasses}
          >
            Unique tokens count
          </button>
          {isMemes && (
            <button
              onClick={() => setTopHolderType(TopHolderType.MEMES_TDH)}
              type="button"
              className={memesTdhClasses}
            >
              TDH
            </button>
          )}
        </span>
      </div>

      <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-y-4">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
            From
          </label>
          <div className="tw-mt-1.5">
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
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
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
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

      <ComponentConfigNextBtn
        showSkip={true}
        onSkip={onSelectTopHoldersSkip}
        onNext={onSelectTopHolders}
      />
    </div>
  );
}
