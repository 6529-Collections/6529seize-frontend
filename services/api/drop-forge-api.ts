import type { ApiDropForgeRecoveryRequest } from "@/generated/models/ApiDropForgeRecoveryRequest";
import {
  commonApiFetch,
  commonApiPost,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import type { ApiDropForgeJob } from "@/generated/models/ApiDropForgeJob";
import {
  ApiDropForgeJobRequestKindEnum,
  type ApiDropForgeJobRequest,
} from "@/generated/models/ApiDropForgeJobRequest";
import type { ApiDropForgeLaunch } from "@/generated/models/ApiDropForgeLaunch";
import type { ApiDropForgeListPage } from "@/generated/models/ApiDropForgeListPage";
import {
  ApiDropForgeManualRequestActionEnum as ManualAction,
  ApiDropForgeManualRequestOperationEnum,
  type ApiDropForgeManualRequest,
} from "@/generated/models/ApiDropForgeManualRequest";
import type { ApiDropForgeManualResponse } from "@/generated/models/ApiDropForgeManualResponse";
const claimPath = (contract: string, claim: number) =>
  `drop-forge/launches/${contract}/${claim}`;
export async function getForgeLaunch(
  contract: string,
  claim: number
): Promise<ApiDropForgeLaunch | null> {
  try {
    return await commonApiFetch<ApiDropForgeLaunch>({
      endpoint: claimPath(contract, claim),
    });
  } catch (error) {
    if (getStructuredApiErrorStatus(error) === 404) return null;
    throw error;
  }
}
export function requestForgeLaunch(
  contract: string,
  claim: number,
  metadata: boolean
): Promise<ApiDropForgeLaunch> {
  return commonApiPost<Record<string, never>, ApiDropForgeLaunch>({
    endpoint: `${claimPath(contract, claim)}/${metadata ? "metadata" : "ready"}`,
    body: {},
  });
}
export async function latestForgeProcess(
  contract: string,
  claim: number,
  plan: string
): Promise<ApiDropForgeJob | null> {
  const rows = await commonApiFetch<ApiDropForgeJob[]>({
    endpoint: `drop-forge/distribution-jobs/${contract}/${claim}`,
    params: { plan_id: plan },
  });
  return rows[0] ?? null;
}
export function startForgeProcess(
  contract: string,
  claim: number,
  plan: string,
  ids: string[],
  requestId: string
): Promise<ApiDropForgeJob> {
  return commonApiPost<ApiDropForgeJobRequest, ApiDropForgeJob>({
    endpoint: `drop-forge/distribution-jobs/${contract}/${claim}`,
    body: {
      request_id: requestId,
      kind: ApiDropForgeJobRequestKindEnum.ProcessAll,
      plan_id: plan,
      phase_ids: ids,
    },
  });
}
export async function forgeList(
  job: string,
  phase: string,
  list: "airdrops" | "airdrops_unconsolidated" | "allowlists"
): Promise<Array<{ wallet: string; amount: number }>> {
  const rows: Array<{ wallet: string; amount: number }> = [];
  async function readPage(offset: number): Promise<void> {
    const page: ApiDropForgeListPage = await commonApiFetch({
      endpoint: `drop-forge/distribution-jobs/${job}/lists/${encodeURIComponent(phase)}/${list}`,
      params: { offset: String(offset) },
    });
    rows.push(...page.rows);
    if (page.next_offset !== null && page.next_offset <= offset)
      throw new Error("Invalid list pagination");
    if (page.next_offset !== null) await readPage(page.next_offset);
  }
  await readPage(0);
  return rows;
}
export function beginForgeManual(
  contract: string,
  claim: number,
  label?: string
): Promise<ApiDropForgeManualResponse> {
  const action = manualHint(label);
  return commonApiPost<ApiDropForgeManualRequest, ApiDropForgeManualResponse>({
    endpoint: `${claimPath(contract, claim)}/manual`,
    body: {
      operation: ApiDropForgeManualRequestOperationEnum.Begin,
      ...(action !== undefined ? { action } : {}),
    },
  });
}
export function finishForgeManual(
  contract: string,
  claim: number,
  leaseId: string | null,
  hash?: string,
  label?: string
): Promise<ApiDropForgeManualResponse> {
  const action = manualHint(label);
  return commonApiPost<ApiDropForgeManualRequest, ApiDropForgeManualResponse>({
    endpoint: `${claimPath(contract, claim)}/manual`,
    body: {
      operation: hash
        ? ApiDropForgeManualRequestOperationEnum.Submit
        : ApiDropForgeManualRequestOperationEnum.Cancel,
      ...(action !== undefined ? { action } : {}),
      ...(leaseId ? { lease_id: leaseId } : {}),
      ...(hash ? { hash } : {}),
    },
  });
}

function manualHint(label: string | undefined): ManualAction | undefined {
  const text = label?.toLowerCase() ?? "";
  if (text === "pay_artist" || text === "pay artist")
    return ManualAction.PayArtist;
  if (text.includes("artist")) return ManualAction.ArtistAirdrop;
  if (text.includes("team")) return ManualAction.TeamAirdrop;
  if (text.includes("research")) return ManualAction.ResearchAirdrop;
  if (text.includes("public")) return ManualAction.PublicPhaseAirdrop;
  const phase = /phase\s*([012])/.exec(text)?.[1];
  if (phase === "0") return ManualAction.Phase0Airdrop;
  if (phase === "1") return ManualAction.Phase1Airdrop;
  if (phase === "2") return ManualAction.Phase2Airdrop;
  return undefined;
}

export function requestForgeRecovery(
  contract: string,
  claimId: number,
  body: ApiDropForgeRecoveryRequest
): Promise<ApiDropForgeLaunch> {
  return commonApiPost<ApiDropForgeRecoveryRequest, ApiDropForgeLaunch>({
    endpoint: `drop-forge/launches/${contract}/${claimId}/recovery`,
    body,
  });
}
