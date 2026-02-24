import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";

export const getGrantStatusLabel = ({
  status,
  validFrom,
  validTo,
}: {
  readonly status: ApiXTdhGrantStatus;
  readonly validFrom?: number | null | undefined;
  readonly validTo?: number | null | undefined;
}): string => {
  if (status === ApiXTdhGrantStatus.Granted) {
    const now = Date.now();
    const normalizedValidFrom = validFrom ?? null;
    const normalizedValidTo = validTo ?? null;

    if (
      typeof normalizedValidTo === "number" &&
      normalizedValidTo > 0 &&
      normalizedValidTo < now
    ) {
      return "ENDED";
    }
    if (typeof normalizedValidFrom === "number" && normalizedValidFrom > now) {
      return "SCHEDULED";
    }
    return "ACTIVE";
  }

  if (status === ApiXTdhGrantStatus.Disabled) {
    return "REVOKED";
  }

  return status;
};

export const isSelectableNonGrantedStatus = (
  status: ApiXTdhGrantStatus
): boolean => status !== ApiXTdhGrantStatus.Granted;

export const toShortGrantId = (grantId: string): string => {
  const normalizedGrantId = grantId.trim();
  if (normalizedGrantId.length <= 16) {
    return normalizedGrantId;
  }
  return `${normalizedGrantId.slice(0, 8)}...${normalizedGrantId.slice(-4)}`;
};
