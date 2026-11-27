"use client";

import { createContext, useCallback, useEffect, useRef, useState } from "react";

import type { AppToastInput } from "@/components/utils/toast/AppToast";
import { showAppToast, showAppToasts } from "@/components/utils/toast/AppToast";
import type { TypeOptions } from "react-toastify";
import type {
  AllowlistCustomTokenPool,
  AllowlistDescription,
  AllowlistOperation,
  AllowlistPhaseWithComponentAndItems,
  AllowlistTokenPool,
  AllowlistTransferPool,
  DistributionPlanTokenPoolDownload,
} from "../allowlist-tool/allowlist-tool.types";
import RunOperations, {
  isAnalysisRunning,
} from "./run-operations/RunOperations";
import {
  distributionPlanApiFetch,
  distributionPlanApiPost,
} from "@/services/distribution-plan-api";

import {
  DistributionPlanToolStep,
  getRequestedEmmaPlanStep,
  restoreEmmaPlanStep,
  writeEmmaPlanStep,
} from "./emma-plan-step";

export { DistributionPlanToolStep } from "./emma-plan-step";

async function readPlanData<T>(endpoint: string): Promise<T | null> {
  const result = await distributionPlanApiFetch<T>(endpoint);
  return result.success ? result.data : null;
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
  setToast: (toast: AppToastInput) => void;
  confirmedTokenId: string | null;
  setConfirmedTokenId: (tokenId: string | null) => void;
};

const setToast = (toast: AppToastInput) => showAppToast(toast);

const setToasts = ({
  messages,
  type,
}: {
  messages: string[];
  type: TypeOptions;
}) => {
  showAppToasts({ messages, type });
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
    setToast: () => {},
    confirmedTokenId: null,
    setConfirmedTokenId: () => {},
  });

export default function DistributionPlanToolContextWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeStep, setActiveStep] = useState<DistributionPlanToolStep>(
    DistributionPlanToolStep.CREATE_PLAN
  );
  const stepRef = useRef(DistributionPlanToolStep.CREATE_PLAN);
  const planRequest = useRef(0);
  const activePlanId = useRef<string | null>(null);
  const runSubmission = useRef<{ pending: boolean } | null>(null);

  useEffect(
    () => () => {
      planRequest.current += 1;
      activePlanId.current = null;
      runSubmission.current = null;
    },
    []
  );

  const setStep = useCallback((next: DistributionPlanToolStep) => {
    stepRef.current = next;
    setActiveStep(next);
    if (activePlanId.current !== null) {
      writeEmmaPlanStep(activePlanId.current, next);
    }
  }, []);
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
    const planId = distributionPlan?.id;
    if (
      planId === undefined ||
      activePlanId.current !== planId ||
      runSubmission.current?.pending === true
    )
      return;

    const submission = { pending: true };
    runSubmission.current = submission;
    setFetching(true);
    try {
      const { success, data } =
        await distributionPlanApiPost<AllowlistDescription>({
          endpoint: `/allowlists/${planId}/runs`,
          body: { allowlistId: planId },
        });
      if (
        runSubmission.current === submission &&
        success &&
        data?.id === planId
      ) {
        await setState(data);
      }
    } finally {
      if (runSubmission.current === submission) {
        submission.pending = false;
        setFetching(false);
      }
    }
  };

  const pollRunStatus = async (planId: string) => {
    const submission = runSubmission.current;
    if (activePlanId.current !== planId || submission?.pending === true) return;

    const request = planRequest.current;
    const data = await readPlanData<AllowlistDescription>(
      `/allowlists/${planId}`
    );
    // A poll from before a submission must never replace the new run's state.
    if (request !== planRequest.current || submission !== runSubmission.current)
      return;

    const status = data?.activeRun?.status;
    if (
      data?.id === planId &&
      status !== undefined &&
      !isAnalysisRunning(status)
    ) {
      await setState(data);
    }
  };

  const fetchOperations = async (distributionPlanId: string) => {
    if (distributionPlanId !== activePlanId.current) return;
    // A newer plan load owns the operation list once setState starts it.
    const request = planRequest.current;
    const data = await readPlanData<AllowlistOperation[]>(
      `/allowlists/${distributionPlanId}/operations`
    );
    if (request === planRequest.current && data) setOperations(data);
  };

  const setState = useCallback(
    async (plan: AllowlistDescription | null) => {
      const request = ++planRequest.current;
      const planId = plan?.id ?? null;
      if (activePlanId.current !== planId) runSubmission.current = null;
      activePlanId.current = planId;
      if (!plan) {
        setStep(DistributionPlanToolStep.CREATE_PLAN);
        setDistributionPlan(null);
        setTransferPools([]);
        setTokenPools([]);
        setCustomTokenPools([]);
        setOperations([]);
        setPhases([]);
        setFetching(false);
        return;
      }

      const restoring =
        stepRef.current === DistributionPlanToolStep.CREATE_PLAN;
      const requested = restoring
        ? getRequestedEmmaPlanStep(window.location.search)
        : undefined;
      const endpoint = `/allowlists/${plan.id}`;
      setDistributionPlan(plan);
      setFetching(true);
      const [
        transfers,
        tokens,
        customTokens,
        savedOperations,
        savedPhases,
        downloads,
      ] = await Promise.all([
        readPlanData<AllowlistTransferPool[]>(`${endpoint}/transfer-pools`),
        readPlanData<AllowlistTokenPool[]>(`${endpoint}/token-pools`),
        readPlanData<AllowlistCustomTokenPool[]>(
          `${endpoint}/custom-token-pools`
        ),
        readPlanData<AllowlistOperation[]>(`${endpoint}/operations`),
        readPlanData<AllowlistPhaseWithComponentAndItems[]>(
          `${endpoint}/phases?withComponentsAndItems=true`
        ),
        requested !== undefined &&
        requested !== DistributionPlanToolStep.CREATE_PLAN &&
        requested !== DistributionPlanToolStep.CREATE_SNAPSHOTS
          ? readPlanData<DistributionPlanTokenPoolDownload[]>(
              `${endpoint}/token-pool-downloads`
            )
          : null,
      ]);
      if (request !== planRequest.current) return;

      if (transfers) setTransferPools(transfers);
      if (tokens) setTokenPools(tokens);
      if (customTokens) setCustomTokenPools(customTokens);
      if (savedOperations) setOperations(savedOperations);
      if (savedPhases) setPhases(savedPhases);
      if (
        restoring &&
        stepRef.current === DistributionPlanToolStep.CREATE_PLAN
      ) {
        setStep(
          restoreEmmaPlanStep(
            requested,
            savedOperations,
            savedPhases,
            downloads
          )
        );
      }
      setFetching(runSubmission.current?.pending === true);
    },
    [setStep]
  );

  return (
    <>
      <DistributionPlanToolContext.Provider
        value={{
          step: activeStep,
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
          setToast,
          confirmedTokenId,
          setConfirmedTokenId,
        }}
      >
        <div>{children}</div>
        <RunOperations
          distributionPlan={distributionPlan}
          fetching={fetching}
          isOpeningPlan={activeStep === DistributionPlanToolStep.CREATE_PLAN}
          pollRunStatus={pollRunStatus}
        />
      </DistributionPlanToolContext.Provider>
    </>
  );
}
