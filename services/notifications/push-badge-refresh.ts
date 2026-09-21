import type { ApiRefreshPushInstallationBadgeRequest } from "@/generated/models/ApiRefreshPushInstallationBadgeRequest";
import type { ApiRefreshPushInstallationBadgeResponse } from "@/generated/models/ApiRefreshPushInstallationBadgeResponse";
import { commonApiPost } from "@/services/api/common-api";
import { getPushInstallationBadgeRefreshRequest } from "./push-installation";

export interface BadgeRefreshRegistration {
  deviceId: string;
  token: string;
  authKey: string;
}

const inFlight = new Map<string, Promise<void>>();

export async function requestPushBadgeRefresh(
  registration: BadgeRefreshRegistration,
  isCurrent: () => boolean
): Promise<void> {
  const body = await getPushInstallationBadgeRefreshRequest(
    registration.deviceId,
    registration.token,
    registration.authKey
  );
  if (!body || !isCurrent()) return;
  // Coalesce repeated registration/activation triggers for the same proof.
  const key = JSON.stringify(body);
  const existing = inFlight.get(key);
  if (existing) return existing;
  const work = sendBadgeRefresh(body);
  inFlight.set(key, work);
  try {
    await work;
  } finally {
    if (inFlight.get(key) === work) inFlight.delete(key);
  }
}

async function sendBadgeRefresh(
  body: ApiRefreshPushInstallationBadgeRequest
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    await commonApiPost<
      ApiRefreshPushInstallationBadgeRequest,
      ApiRefreshPushInstallationBadgeResponse
    >({
      endpoint: "push-notifications/installations/badge-refresh",
      body,
      includeWalletAuth: false,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
