import { sha256 } from "js-sha256";
import { omitDeviceSignature } from "@/lib/device-signing/device-signature-body";
import { v4 as uuidv4 } from "uuid";

const pendingKeys = new Map<string, string>();
const MAX_PENDING_SUBMISSIONS = 128;

function isModeratedSubmission(endpoint: string): boolean {
  const path = endpoint.split("/").filter(Boolean).join("/");
  return (
    path === "drops" ||
    /^drops\/[^/]+$/.test(path) ||
    /^profiles\/[^/]+\/cic\/statements$/.test(path) ||
    /^groups\/[^/]+\/visible$/.test(path)
  );
}

/** Retains only a digest and UUID while the outcome of a submission is unknown. */
export function prepareSubmissionRequestKey(
  endpoint: string,
  body: unknown,
  getScope: () => string
) {
  if (!isModeratedSubmission(endpoint) || typeof window === "undefined")
    return null;
  const scope = getScope();
  if (!scope) return null;
  // A re-signed retry of the same content keeps its request key.
  const fingerprint = sha256(
    JSON.stringify([scope, endpoint, omitDeviceSignature(body)])
  );
  let key = pendingKeys.get(fingerprint);
  if (!key) {
    // UUIDs must also work on HTTP LAN origins used by native device testing.
    key = uuidv4();
    if (pendingKeys.size >= MAX_PENDING_SUBMISSIONS) {
      const oldest = pendingKeys.keys().next().value;
      if (oldest) pendingKeys.delete(oldest);
    }
    pendingKeys.set(fingerprint, key);
  }
  return {
    key,
    complete: () => {
      pendingKeys.delete(fingerprint);
    },
  };
}

export function clearSubmissionRequestKeys(): void {
  pendingKeys.clear();
}
