"use client";

import type { TypeOptions} from "react-toastify";
import { Slide, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createContext, useState } from "react";

import type {
  AllowlistCustomTokenPool,
  AllowlistDescription,
  AllowlistOperation,
  AllowlistPhaseWithComponentAndItems,
  AllowlistTokenPool,
  AllowlistTransferPool,
} from "../allowlist-tool/allowlist-tool.types";
import RunOperations from "./run-operations/RunOperations";
import {
  distributionPlanApiFetch,
  distributionPlanApiPost,
} from "@/services/distribution-plan-api";

export enum DistributionPlanToolStep {
  CREATE_PLAN = "CREATE_PLAN",
  CREATE_SNAPSHOTS = "CREATE_SNAPSHOTS",
  CREATE_CUSTOM_SNAPSHOT = "CREATE_CUSTOM_SNAPSHOT",
  CREATE_PHASES = "CREATE_PHASES",
  BUILD_PHASES = "BUILD_PHASES",
  MAP_DELEGATIONS = "MAP_DELEGATIONS",
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
  fetchOperations: (distributionPlanId: string) => void;
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
  confirmedTokenId: string | null;
  setConfirmedTokenId: (tokenId: string | null) => void;
};

const setToast = ({
  message,
  type,
}: {
  message: string;
  type: TypeOptions;
}) => {
  toast(message, {
    position: "top-right",
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
    fetchOperations: () => {},
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
    confirmedTokenId: null,
    setConfirmedTokenId: () => {},
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
  const [confirmedTokenId, setConfirmedTokenId] = useState<string | null>(null);

  const runOperations = async () => {
    if (!distributionPlan) return;
    const endpoint = `/allowlists/${distributionPlan.id}/runs`;
    setFetching(true);
    const { success, data } =
      await distributionPlanApiPost<AllowlistDescription>({
        endpoint,
        body: {
          allowlistId: distributionPlan.id,
        },
      });
    if (success && data) {
      setState(data);
    }
    setFetching(false);
  };

  const fetchTransferPools = async (distributionPlanId: string) => {
    const endpoint = `/allowlists/${distributionPlanId}/transfer-pools`;
    const { success, data } = await distributionPlanApiFetch<
      AllowlistTransferPool[]
    >(endpoint);
    if (success && data) {
      setTransferPools(data);
    }
  };

  const fetchTokenPools = async (distributionPlanId: string) => {
    const endpoint = `/allowlists/${distributionPlanId}/token-pools`;
    const { success, data } = await distributionPlanApiFetch<
      AllowlistTokenPool[]
    >(endpoint);
    if (success && data) {
      setTokenPools(data);
    }
  };

  const fetchCustomTokenPools = async (distributionPlanId: string) => {
    const endpoint = `/allowlists/${distributionPlanId}/custom-token-pools`;
    const { success, data } = await distributionPlanApiFetch<
      AllowlistCustomTokenPool[]
    >(endpoint);
    if (success && data) {
      setCustomTokenPools(data);
    }
  };

  const fetchOperations = async (distributionPlanId: string) => {
    const endpoint = `/allowlists/${distributionPlanId}/operations`;
    const { success, data } = await distributionPlanApiFetch<
      AllowlistOperation[]
    >(endpoint);
    if (success && data) {
      setOperations(data);
    }
  };

  const fetchPhases = async (distributionPlanId: string) => {
    const endpoint = `/allowlists/${distributionPlanId}/phases?withComponentsAndItems=true`;
    const { success, data } = await distributionPlanApiFetch<
      AllowlistPhaseWithComponentAndItems[]
    >(endpoint);
    if (success && data) {
      setPhases(data);
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
      setStep(DistributionPlanToolStep.CREATE_SNAPSHOTS);
    }
  };

  return (
    <>
      <DistributionPlanToolContext.Provider
        value={{
          step,
          setStep,
          fetching,
          runOperations,
          operations,
          fetchOperations,
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
          confirmedTokenId,
          setConfirmedTokenId,
        }}>
        <div>{children}</div>
        <RunOperations />
      </DistributionPlanToolContext.Provider>
    </>
  );
}
