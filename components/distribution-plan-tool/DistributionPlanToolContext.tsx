import { Slide, ToastContainer, TypeOptions, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createContext, useEffect, useState } from "react";
import { Poppins } from "next/font/google";
import {
  AllowlistCustomTokenPool,
  AllowlistDescription,
  AllowlistOperation,
  AllowlistPhaseWithComponentAndItems,
  AllowlistTokenPool,
  AllowlistToolResponse,
  AllowlistTransferPool,
} from "../allowlist-tool/allowlist-tool.types";
import RunOperations from "./run-operations/RunOperations";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";

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
  REVIEW = "REVIEW",
}

type DistributionPlanToolContextType = {
  step: DistributionPlanToolStep;
  setStep: (step: DistributionPlanToolStep) => void;
  fetching: boolean;
  distributionPlan: AllowlistDescription | null;
  runOperations: () => void;
  setState: (distributionPlan: AllowlistDescription | null) => void;
  operations: AllowlistOperation[];
  addOperations: (operations: AllowlistOperation[]) => void;
  transferPools: AllowlistTransferPool[];
  setTransferPools: (transferPools: AllowlistTransferPool[]) => void;
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
    runOperations: () => {},
    operations: [],
    addOperations: () => {},
    distributionPlan: null,
    setState: () => {},
    transferPools: [],
    setTransferPools: () => {},
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
    setOperations((prev) => structuredClone([...prev, ...newOperations]));
  };
  const [distributionPlan, setDistributionPlan] =
    useState<AllowlistDescription | null>(null);
  const [transferPools, setTransferPools] = useState<AllowlistTransferPool[]>(
    []
  );
  const [tokenPools, setTokenPools] = useState<AllowlistTokenPool[]>([]);
  const [customTokenPools, setCustomTokenPools] = useState<
    AllowlistCustomTokenPool[]
  >([]);
  const [phases, setPhases] = useState<AllowlistPhaseWithComponentAndItems[]>(
    []
  );

  const runOperations = async () => {
    if (!distributionPlan) return;
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/runs`;
    try {
      setFetching(true);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allowlistId: distributionPlan.id,
        }),
      });
      const data: AllowlistToolResponse<AllowlistDescription> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return;
      }
      setState(data);
      setToasts({
        messages: ["Started running operations"],
        type: "success",
      });
    } catch (error) {
      setToasts({
        messages: ["Something went wrong"],
        type: "error",
      });
    }
  };

  const fetchTransferPools = async (distributionPlanId: string) => {
    try {
      const response = await fetch(
        `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlanId}/transfer-pools`
      );
      const data: AllowlistToolResponse<AllowlistTransferPool[]> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
      } else {
        setTransferPools(data);
      }
    } catch (error: any) {
      setToasts({ messages: [error.message], type: "error" });
    }
  };

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
      setOperations(structuredClone(data));
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
    await fetchTransferPools(distributionPlanId);
    await fetchTokenPools(distributionPlanId);
    await fetchCustomTokenPools(distributionPlanId);
    await fetchOperations(distributionPlanId);
    await fetchPhases(distributionPlanId);
    setFetching(false);
  };

  const setState = async (distributionPlan: AllowlistDescription | null) => {
    if (!distributionPlan) {
      setStep(DistributionPlanToolStep.CREATE_PLAN);
      setDistributionPlan(null);
      setTransferPools([]);
      setTokenPools([]);
      setCustomTokenPools([]);
      setOperations([]);
      setPhases([]);
      return;
    }
    setDistributionPlan(distributionPlan);
    await initState(distributionPlan.id);
    if (step === DistributionPlanToolStep.CREATE_PLAN) {
      setStep(DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT);
    }
  };

  const [defaultBreadCrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Distribution plan tool" },
  ]);

  const [breadcrumbs, setBreadCrumbs] = useState<Crumb[]>(defaultBreadCrumbs);

  useEffect(() => {
    if (distributionPlan) {
      setBreadCrumbs([
        ...defaultBreadCrumbs,
        { display: distributionPlan.name },
      ]);
      return;
    }

    setBreadCrumbs(defaultBreadCrumbs);
  }, [distributionPlan, defaultBreadCrumbs]);
  return (
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <div className={`tw-bg-neutral-900 ${poppins.className}`}>
        <div
          id="allowlist-tool"
          className="tw-overflow-y-auto tw-min-h-screen tw-relative"
        >
          <DistributionPlanToolContext.Provider
            value={{
              step,
              setStep,
              fetching,
              runOperations,
              operations,
              addOperations,
              setState,
              distributionPlan,
              transferPools,
              setTransferPools,
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
    </>
  );
}
