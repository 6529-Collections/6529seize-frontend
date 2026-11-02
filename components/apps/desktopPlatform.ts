import type { DesktopPlatform } from "./appDownloads";

interface PlatformHints {
  readonly userAgent?: string;
  readonly platform?: string;
  readonly maxTouchPoints?: number;
  readonly userAgentData?: {
    readonly platform?: string;
    readonly mobile?: boolean;
  };
}

/** A landing-page convenience only; never infer desktop OS from mobile UAs. */
export function getDesktopPlatform(
  hints: PlatformHints
): DesktopPlatform | null {
  const ua = hints.userAgent ?? "";
  if (
    hints.userAgentData?.mobile ||
    /Android|iPhone|iPad|iPod|Mobile|CrOS/i.test(ua)
  )
    return null;
  const platform =
    [hints.userAgentData?.platform, hints.platform].find(
      (value) => value !== undefined && value.length > 0
    ) ?? ua;
  if (/Windows|^Win(?:32|64)$/i.test(platform)) return "windows";
  if (/mac/i.test(platform)) {
    return (hints.maxTouchPoints ?? 0) > 1 ? null : "mac";
  }
  if (/linux/i.test(platform)) return "linux";
  return null;
}
