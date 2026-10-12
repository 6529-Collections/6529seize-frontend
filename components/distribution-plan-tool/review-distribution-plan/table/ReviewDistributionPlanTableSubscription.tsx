"use client";
import { ApiDropForgeJobStatusEnum as JobStatus } from "@/generated/models/ApiDropForgeJob";
import { useContext, useState } from "react";
import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { MEMES_CONTRACT } from "@/constants/constants";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useDropForgeProcess } from "@/hooks/useDropForgeProcess";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { forgeList } from "@/services/api/drop-forge-api";
import { PUBLIC_SUBSCRIPTIONS_PHASE_ID } from "./constants";
import {
  ReviewDistributionPlanTableItemType,
  type ReviewDistributionPlanTableItem,
} from "./ReviewDistributionPlanTable.types";
import { isSubscriptionsAdmin } from "./ReviewDistributionPlanTableSubscription.utils";
export function SubscriptionLinks({
  plan,
  phase,
}: Readonly<{
  plan: AllowlistDescription;
  phase: ReviewDistributionPlanTableItem;
}>) {
  const { connectedProfile, setToast } = useContext(AuthContext);
  const { confirmedTokenId } = useContext(DistributionPlanToolContext);
  const { seizeSettings } = useSeizeSettings();
  const locale = useBrowserLocale();
  const operation = useDropForgeProcess(
    MEMES_CONTRACT,
    Number(confirmedTokenId),
    plan.id
  );
  const [downloading, setDownloading] = useState(false);
  if (
    !isSubscriptionsAdmin(
      connectedProfile,
      seizeSettings.distribution_admin_wallets ?? []
    ) ||
    phase.type !== ReviewDistributionPlanTableItemType.PHASE ||
    !confirmedTokenId
  )
    return null;
  const isPublic = phase.phaseId === PUBLIC_SUBSCRIPTIONS_PHASE_ID;
  const completed = operation.data?.status === JobStatus.Completed;
  async function download() {
    const job = operation.data;
    if (job?.status !== JobStatus.Completed || downloading) return;
    setDownloading(true);
    try {
      const lists: Array<
        "airdrops" | "airdrops_unconsolidated" | "allowlists"
      > = isPublic
        ? ["airdrops"]
        : ["airdrops", "airdrops_unconsolidated", "allowlists"];
      for (const list of lists) {
        const rows = await forgeList(
          job.id,
          isPublic ? "public" : phase.id,
          list
        );
        downloadCsv(phase.name, list, rows);
      }
    } catch (error) {
      setToast({
        type: "error",
        message:
          getToastErrorDetails(error) ?? "Unable to download completed lists",
      });
    } finally {
      setDownloading(false);
    }
  }
  return (
    <button
      type="button"
      disabled={!completed || downloading}
      onClick={() => {
        void download();
      }}
      title={!completed ? t(locale, "dropForge.pendingLists") : undefined}
      aria-busy={downloading}
      className="tw-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-3 tw-text-xs tw-font-medium tw-text-white disabled:tw-opacity-50"
    >
      {downloading && <CircleLoader />}
      {t(locale, downloading ? "dropForge.downloading" : "dropForge.download")}
    </button>
  );
}
export function downloadCsv(
  phase: string,
  list: string,
  rows: Array<{ wallet: string; amount: number }>
) {
  const csv = [
    "address,value",
    ...rows.map((row) => `${row.wallet},${row.amount}`),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${phase.replaceAll(" ", "_").toLowerCase()}_${list}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
