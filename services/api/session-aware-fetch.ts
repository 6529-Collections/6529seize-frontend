import {
  getAuthJwt,
  getWalletAddress,
  getWalletRole,
  isAuthJwtUsable,
  hasActiveSessionV2Auth,
} from "../auth/auth.utils";
import { createAbortError } from "../auth/session-refresh-coordination.utils";
import { recoverActiveSession } from "../auth/session-recovery-handler";

export async function sessionAwareFetch(
  url: string,
  init: RequestInit,
  manageWalletAuth: boolean
): Promise<Response> {
  if (
    typeof window === "undefined" ||
    !manageWalletAuth ||
    /\/api\/auth\//.test(url)
  )
    return fetch(url, init);
  const address = getWalletAddress();
  const initialJwt = getAuthJwt();
  const initialRole = getWalletRole();
  const headers = new Headers(init.headers);
  const suppliedAuth = headers.get("Authorization");
  const managesSession =
    Boolean(address) &&
    hasActiveSessionV2Auth({ address: address! }) &&
    (!suppliedAuth ||
      (initialJwt !== null && suppliedAuth === `Bearer ${initialJwt}`));
  if (!managesSession) return fetch(url, init);

  const isCurrentAccount = () =>
    getWalletAddress() === address && getWalletRole() === initialRole;
  const updateAuth = async (force: boolean) => {
    if (!isCurrentAccount() || init.signal?.aborted) throw createAbortError();
    const current = getAuthJwt();
    if (!force && current && isAuthJwtUsable(current)) {
      headers.set("Authorization", `Bearer ${current}`);
      return;
    }
    const token = await recoverActiveSession({
      signal: init.signal ?? undefined,
      force,
    });
    if (!isCurrentAccount() || !token || init.signal?.aborted)
      throw createAbortError();
    headers.set("Authorization", `Bearer ${token}`);
  };
  await updateAuth(false);
  const response = await fetch(url, { ...init, headers });
  const canReplayBody =
    init.body === undefined ||
    init.body === null ||
    typeof init.body === "string" ||
    init.body instanceof URLSearchParams;
  if (response.status !== 401 || !canReplayBody) return response;
  if (!isCurrentAccount() || init.signal?.aborted) throw createAbortError();
  // A different caller may already have renewed the credential rejected here.
  const currentJwt = getAuthJwt();
  await updateAuth(
    currentJwt !== null &&
      headers.get("Authorization") === `Bearer ${currentJwt}`
  );
  // common-api supplies replayable JSON/string bodies. Authentication rejects
  // before route handlers run, so those requests can be retried once.
  return fetch(url, { ...init, headers });
}
