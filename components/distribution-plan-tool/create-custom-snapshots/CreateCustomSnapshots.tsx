"use client";

import { useContext, useEffect, useState } from "react";
import {
    DistributionPlanToolContext,
    DistributionPlanToolStep,
} from "../DistributionPlanToolContext";

import {
    AllowlistCustomTokenPool,
    AllowlistOperationCode,
} from "@/components/allowlist-tool/allowlist-tool.types";
import AllowlistToolCsvIcon from "@/components/allowlist-tool/icons/AllowlistToolCsvIcon";
import DistributionPlanEmptyTablePlaceholder from "../common/DistributionPlanEmptyTablePlaceholder";
import DistributionPlanNextStepBtn from "../common/DistributionPlanNextStepBtn";
import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";
import StepHeader from "../common/StepHeader";
import CreateCustomSnapshotForm from "./form/CreateCustomSnapshotForm";
import CreateCustomSnapshotTable from "./table/CreateCustomSnapshotTable";

export default function CreateCustomSnapshots() {
  const { distributionPlan, setStep, operations } = useContext(
    DistributionPlanToolContext
  );
  useEffect(() => {
    if (!distributionPlan) setStep(DistributionPlanToolStep.CREATE_PLAN);
  }, [distributionPlan, setStep]);

  const [customSnapshots, setCustomSnapshots] = useState<
    AllowlistCustomTokenPool[]
  >([]);

  useEffect(() => {
    if (!distributionPlan) return;
    const customSnapshotOperations = operations.filter(
      (o) => o.code === AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL
    );
    setCustomSnapshots(
      customSnapshotOperations.map<AllowlistCustomTokenPool>((o) => ({
        id: o.params.id,
        allowlistId: distributionPlan.id,
        name: o.params.name,
        description: o.params.description,
        walletsCount: new Set(o.params.tokens.map((t: any) => t.owner)).size,
        tokensCount: o.params.tokens.length,
      }))
    );
  }, [operations, distributionPlan]);

  const [haveCustomSnapshots, setHaveCustomSnapshots] = useState(false);

  useEffect(() => {
    setHaveCustomSnapshots(!!customSnapshots.length);
  }, [customSnapshots]);

  const downloadExampleCsv = () => {
    const csv = [
      "Owner",
      ...[
        "0xc6400A5584db71e41B0E5dFbdC769b54B91256CD",
        "0x8BA68CFe71550EfC8988D81d040473709B7F9218",
        "0xa743c8c57c425B84Cb2eD18C6B9ae3aD21629Cb5",
        "0x1b7844CfaE4C823Ac6389855D47106a70c84F067",
        "0x76D078D7e5755B66fF50166863329D27F2566b43",
        "0xfd22004806a6846ea67ad883356be810f0428793",
        "0xc3c9737cce778d7583f31ae7c4f2ab8782ed51e5",
        "0xA62DA2Ea9F5bB03a58174060535ae32131973178",
        "0xE16dF6503Acd3c79b6E032f62c61752bEC16eeF2",
        "0x9769334FC882775F4951865aA473481880669D47",
        "0x3852471D266d9e2222CA9Fdd922BAFC904Dc49e5",
        "0x88D3574660711e03196aF8A96f268697590000Fa",
        "0x885846850aaBf20d8f8e051f400354D94a32FF55",
        "0x61D9d9cc8C3203daB7100eA79ceD77587201C990",
        "0xE359aB04cEC41AC8C62bc5016C10C749c7De5480",
        "0xfe3b3F0D64F354b69A5B40D02f714E69cA4B09bd",
        "0x8889EBB11295F456541901f50BCB5f382047cAaC",
        "0x4269AaDfd043b58cbA893BfE6029C9895C25cb61",
        "0xbDf82b13580b918ebc3c24b4034E8468EA168E21",
        "0x83EE335ca72759CAeDeD7b1afD11dCF75F48436b",
        "0xddA3cb2741FaC4a87CAebec9EFC7963087304097",
        "0xF9e129817BC576f937e4774E3C3Aec98787Cfb91",
        "0x8e63380aC1e34c7D61bf404aF63e885875C18Ce3",
        "0xaf5c021754Ab82Bf556BC6C90650dE21Cf92d1c7",
        "0x7f3774EAdae4beB01919deC7f32A72e417Ab5DE3",
        "0xC03E57b6acE9Dd62C84A095E11E494E3C8FD4D42",
        "0xe70d73c76fF3b4388EE9C58747F0EaA06C6b645B",
      ],
    ].join("\n");

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = "data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT} />
      <div
        onClick={downloadExampleCsv}
        className="tw-group tw-mt-4 tw-cursor-pointer tw-items-center tw-font-light tw-text-sm tw-text-iron-400 hover:tw-text-iron-50 tw-inline-flex tw-gap-x-2 tw-transition-all tw-duration-300 tw-ease-out">
        Download example CSV file
        <button
          type="button"
          className="-tw-mt-0.5 tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-400 tw-bg-iron-400/10 tw-ring-iron-400/20 group-hover:tw-bg-iron-400/20 tw-ease-out tw-transition tw-duration-300">
          <div className="tw-h-3.5 tw-w-3.5 tw-flex tw-items-center tw-justify-center">
            <AllowlistToolCsvIcon />
          </div>
        </button>
      </div>

      <DistributionPlanStepWrapper>
        <CreateCustomSnapshotForm />

        <div className="tw-mt-8">
          {haveCustomSnapshots ? (
            <CreateCustomSnapshotTable customSnapshots={customSnapshots} />
          ) : (
            <DistributionPlanEmptyTablePlaceholder
              title="No Custom Snapshots Added"
              description="To proceed, please add your custom snapshots. This space will showcase your snapshots once they're added. If you prefer not to add snapshots at this time, simply select 'Skip'."
            />
          )}
        </div>
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={false}
          onNextStep={() => setStep(DistributionPlanToolStep.CREATE_PHASES)}
          loading={false}
          showNextBtn={haveCustomSnapshots}
          showSkipBtn={!haveCustomSnapshots}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
