import type { CSSProperties } from "react";

import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";

const FALLBACK_BANNER_PRIMARY = "#2B3548";
const FALLBACK_BANNER_SECONDARY = "#111827";

export const getIdentityDisplayLabel = ({
  profile,
  fallbackValue,
}: {
  readonly profile:
    | Pick<ApiProfileMin, "handle" | "primary_address">
    | null
    | undefined;
  readonly fallbackValue?: string | null | undefined;
}): string | null => {
  return profile?.handle ?? profile?.primary_address ?? fallbackValue ?? null;
};

export const getIdentityHref = (value: string) =>
  `/${encodeURIComponent(value.toLowerCase())}`;

export const getIdentityCardGradientStyle = (
  profile:
    | Pick<ApiProfileMin, "banner1_color" | "banner2_color">
    | null
    | undefined
): CSSProperties => ({
  background: `linear-gradient(135deg, ${
    profile?.banner1_color ?? FALLBACK_BANNER_PRIMARY
  } 0%, ${profile?.banner2_color ?? FALLBACK_BANNER_SECONDARY} 100%)`,
});
