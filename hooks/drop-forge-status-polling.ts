import type { QueryState } from "@tanstack/react-query";
import { ApiDropForgeActionStateEnum as ActionState } from "@/generated/models/ApiDropForgeAction";
import {
  ApiDropForgeLaunchStateEnum as LaunchState,
  type ApiDropForgeLaunch,
} from "@/generated/models/ApiDropForgeLaunch";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";

export function hasActiveLaunchWork(
  launch: ApiDropForgeLaunch | null | undefined
): boolean {
  return (
    launch !== undefined &&
    launch !== null &&
    (launch.state === LaunchState.Armed ||
      launch.state === LaunchState.Running ||
      launch.manual_pending === true ||
      launch.actions.some((action) => action.state === ActionState.Signed))
  );
}

function isAccessDenied(error: unknown): boolean {
  const status = getStructuredApiErrorStatus(error);
  return status === 401 || status === 403;
}

export const dropForgeStatusPolling = {
  refetchIntervalInBackground: false,
  retry: (failureCount: number, error: unknown) =>
    failureCount < 2 && !isAccessDenied(error),
};

export function dropForgeStatusInterval(
  state: Pick<QueryState<unknown, unknown>, "error" | "fetchFailureCount">,
  interval: number
): number | false {
  if (isAccessDenied(state.error)) return false;
  return Math.min(60_000, interval * 2 ** Math.min(state.fetchFailureCount, 4));
}
