"use client";

import DropForgeStatusPill from "@/components/drop-forge/DropForgeStatusPill";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useDropForgeLaunch } from "@/hooks/useDropForgeLaunch";
import { t } from "@/i18n/messages";

export function DropForgeAutoLaunchPill() {
  const locale = useBrowserLocale();
  return (
    <DropForgeStatusPill
      className="tw-w-fit tw-bg-fuchsia-950 tw-text-fuchsia-200 tw-ring-fuchsia-400/40"
      label={t(locale, "dropForge.autoLaunch")}
    />
  );
}

export function DropForgeSavedPlanPill({
  claimId,
}: Readonly<{ claimId: number }>) {
  const { data } = useDropForgeLaunch(claimId);
  return data ? <DropForgeAutoLaunchPill /> : null;
}
