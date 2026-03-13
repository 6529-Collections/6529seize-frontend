import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export const getProfileWaveIdentity = (profile: ApiIdentity): string =>
  profile.handle ?? profile.query ?? profile.primary_wallet;
