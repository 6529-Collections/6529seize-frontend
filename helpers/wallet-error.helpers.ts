import { UserRejectedRequestError } from "viem";

export function isUserRejectedSigningError(error: unknown): boolean {
  try {
    if (error instanceof UserRejectedRequestError) return true;
  } catch {
    // Wallet errors may cross realms; also recognize their standard shape.
  }
  if (error === null || typeof error !== "object") return false;
  const value = error as Record<string, unknown>;
  return (
    value["name"] === "UserRejectedRequestError" ||
    value["code"] === 4001 ||
    value["code"] === "4001"
  );
}
