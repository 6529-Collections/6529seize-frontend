import { Slide, ToastContainer, TypeOptions, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createContext, useState } from "react";
import { Poppins } from "next/font/google";
import {
  AllowlistCustomTokenPool,
  AllowlistDescription,
  AllowlistOperation,
  AllowlistPhaseWithComponentAndItems,
  AllowlistTokenPool,
  AllowlistToolResponse,
} from "../allowlist-tool/allowlist-tool.types";

import RunOperations from "./run-operations/RunOperations";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export enum DistributionPlanToolStep {
  CREATE_PLAN = "CREATE_PLAN",
  CREATE_SNAPSHOTS = "CREATE_SNAPSHOTS",
  CREATE_CUSTOM_SNAPSHOT = "CREATE_CUSTOM_SNAPSHOT",
  CREATE_PHASES = "CREATE_PHASES",
  BUILD_PHASES = "BUILD_PHASES",
}

type DistributionPlanToolContextType = {
  step: DistributionPlanToolStep;
  setStep: (step: DistributionPlanToolStep) => void;
  fetching: boolean;

  distributionPlan: AllowlistDescription | null;
  setState: (distributionPlan: AllowlistDescription | null) => void;
  operations: AllowlistOperation[];
  addOperations: (operations: AllowlistOperation[]) => void;
  tokenPools: AllowlistTokenPool[];
  setTokenPools: (tokenPools: AllowlistTokenPool[]) => void;
  customTokenPools: AllowlistCustomTokenPool[];
  setCustomTokenPools: (customTokenPools: AllowlistCustomTokenPool[]) => void;
  phases: AllowlistPhaseWithComponentAndItems[];
  setPhases: (phases: AllowlistPhaseWithComponentAndItems[]) => void;
  setToasts: ({
    messages,
    type,
  }: {
    messages: string[];
    type: TypeOptions;
  }) => void;
};

const setToast = ({
  message,
  type,
}: {
  message: string;
  type: TypeOptions;
}) => {
  toast(message, {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 3000,
    hideProgressBar: false,
    draggable: false,
    closeOnClick: true,
    transition: Slide,
    theme: "dark",
    type,
  });
};

const setToasts = ({
  messages,
  type,
}: {
  messages: string[];
  type: TypeOptions;
}) => {
  messages.forEach((message) => setToast({ message, type }));
};

export const DistributionPlanToolContext =
  createContext<DistributionPlanToolContextType>({
    step: DistributionPlanToolStep.CREATE_PLAN,
    setStep: () => {},
    fetching: false,
    operations: [],
    addOperations: () => {},
    distributionPlan: null,
    setState: () => {},
    tokenPools: [],
    setTokenPools: () => {},
    customTokenPools: [],
    setCustomTokenPools: () => {},
    phases: [],
    setPhases: () => {},
    setToasts: () => {},
  });

export default function DistributionPlanToolContextWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [step, setStep] = useState<DistributionPlanToolStep>(
    DistributionPlanToolStep.CREATE_PLAN
  );
  const [fetching, setFetching] = useState(false);
  const [operations, setOperations] = useState<AllowlistOperation[]>([]);
  const addOperations = (newOperations: AllowlistOperation[]) => {
    setOperations(structuredClone([...operations, ...newOperations]));
  };
  const [distributionPlan, setDistributionPlan] =
    useState<AllowlistDescription | null>(null);

  const [tokenPools, setTokenPools] = useState<AllowlistTokenPool[]>([]);
  const [customTokenPools, setCustomTokenPools] = useState<
    AllowlistCustomTokenPool[]
  >([]);
  const [phases, setPhases] = useState<AllowlistPhaseWithComponentAndItems[]>(
    []
  );

  const fetchTokenPools = async (distributionPlanId: string) => {
    try {
      const response = await fetch(
        `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlanId}/token-pools`
      );
      const data: AllowlistToolResponse<AllowlistTokenPool[]> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
      } else {
        setTokenPools(structuredClone(data));
      }
    } catch (error: any) {
      setToasts({ messages: [error.message], type: "error" });
    }
  };

  const fetchCustomTokenPools = async (distributionPlanId: string) => {
    try {
      const response = await fetch(
        `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlanId}/custom-token-pools`
      );
      const data: AllowlistToolResponse<AllowlistCustomTokenPool[]> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
      } else {
        setCustomTokenPools(data);
      }
    } catch (error: any) {
      setToasts({
        messages: ["Something went wrong. Please try again."],
        type: "error",
      });
    }
  };

  const fetchOperations = async (distributionPlanId: string) => {
    try {
      const response = await fetch(
        `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlanId}/operations`
      );
      const data: AllowlistToolResponse<AllowlistOperation[]> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return;
      }
      addOperations(structuredClone(data));
    } catch (error: any) {
      setToasts({ messages: [error.message], type: "error" });
    }
  };

  const fetchPhases = async (distributionPlanId: string) => {
    try {
      const response = await fetch(
        `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlanId}/phases?withComponentsAndItems=true`
      );
      const data: AllowlistToolResponse<AllowlistPhaseWithComponentAndItems[]> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
      } else {
        setPhases(data);
      }
    } catch (error: any) {
      setToasts({ messages: [error.message], type: "error" });
    }
  };

  const initState = async (distributionPlanId: string) => {
    setFetching(true);
    await fetchTokenPools(distributionPlanId);
    await fetchCustomTokenPools(distributionPlanId);
    await fetchPhases(distributionPlanId);
    await fetchOperations(distributionPlanId);
    setFetching(false);
  };

  const setState = async (distributionPlan: AllowlistDescription | null) => {
    if (!distributionPlan) {
      setStep(DistributionPlanToolStep.CREATE_PLAN);
      setDistributionPlan(null);
      setTokenPools([]);
      setCustomTokenPools([]);
      setOperations([]);
      setPhases([]);
      return;
    }
    setDistributionPlan(distributionPlan);
    await initState(distributionPlan.id);
    setStep(DistributionPlanToolStep.CREATE_SNAPSHOTS);
  };

  return (
    <div
      className={`tw-bg-neutral-900 ${poppins.className}`}
    >
      <div
        id="allowlist-tool"
        className="tw-max-w-[1250px] min-[1400px]:tw-max-w-[1350px] min-[1500px]:tw-max-w-[1450px] min-[1600px]:tw-max-w-[96.875rem] 
        min-[1800px]:tw-max-w-[109.375rem] min-[2000px]:tw-max-w-[121.875rem] tw-overflow-y-auto tw-mx-auto tw-min-h-screen tw-relative"
      >
        <DistributionPlanToolContext.Provider
          value={{
            step,
            setStep,
            fetching,
            operations,
            addOperations,
            setState,
            distributionPlan,
            tokenPools,
            setTokenPools,
            customTokenPools,
            setCustomTokenPools,
            phases,
            setPhases,
            setToasts,
          }}
        >
          <div>{children}</div>
          <RunOperations />
          <ToastContainer />
        </DistributionPlanToolContext.Provider>
      </div>
    </div>
  );
}
