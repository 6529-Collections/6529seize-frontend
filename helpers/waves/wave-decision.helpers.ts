import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { publicEnv } from "@/config/env";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type RenderableWaveDecisionWinner = ApiWaveDecisionWinner & {
  drop: ApiWaveDecisionWinner["drop"] & { id: string };
};

const hasRenderableWaveDecisionWinner = (
  winner: ApiWaveDecisionWinner | null | undefined
): winner is RenderableWaveDecisionWinner => {
  if (!isRecord(winner)) {
    return false;
  }

  const drop = winner["drop"];
  if (!isRecord(drop)) {
    return false;
  }

  const id = drop["id"];
  return typeof id === "string" && id.length > 0;
};

const getWinnerPlace = (winner: unknown): number => {
  if (!isRecord(winner)) {
    return Number.POSITIVE_INFINITY;
  }

  const place = winner["place"];
  return typeof place === "number" ? place : Number.POSITIVE_INFINITY;
};

export const getRenderableWaveDecisionWinners = (
  winners: readonly ApiWaveDecisionWinner[]
): RenderableWaveDecisionWinner[] =>
  winners.filter(hasRenderableWaveDecisionWinner);

export const getApprovedWaveDecisionWinners = (
  decisionPoints: readonly ApiWaveDecision[]
): ApiWaveDecisionWinner[] =>
  decisionPoints.flatMap((point) => point.winners).reverse();

export const prepareWaveDecisionPoint = (
  decisionPoint: ApiWaveDecision,
  waveId: string
): ApiWaveDecision => {
  const winners = Array.isArray(decisionPoint.winners)
    ? [...decisionPoint.winners]
    : [];
  const invalidWinnerCount =
    winners.length - getRenderableWaveDecisionWinners(winners).length;

  if (invalidWinnerCount > 0 && publicEnv.NODE_ENV !== "production") {
    console.warn(
      `[WaveDecisions] Found ${invalidWinnerCount} winner(s) without drop data for wave ${waveId} at decision ${decisionPoint.decision_time}`
    );
  }

  const sortedWinners = winners.sort(
    (a, b) => getWinnerPlace(a) - getWinnerPlace(b)
  );

  return {
    ...decisionPoint,
    winners: sortedWinners,
  };
};
