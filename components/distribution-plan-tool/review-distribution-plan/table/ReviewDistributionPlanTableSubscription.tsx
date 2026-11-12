"use client";
import { ApiDropForgeJobStatusEnum as JobStatus } from "@/generated/models/ApiDropForgeJob";
import { useContext, useState } from "react";
import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { MEMES_CONTRACT } from "@/constants/constants";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { buildCsv } from "@/helpers/csv-export.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useDropForgeSettings } from "@/hooks/useDropForgeSettings";
import { useDropForgeProcess } from "@/hooks/useDropForgeProcess";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  forgeProcessInputsMatch,
  getForgePhaseIds,
} from "@/services/api/drop-forge-process-inputs";
import { forgeList } from "@/services/api/drop-forge-api";
import { PUBLIC_SUBSCRIPTIONS_PHASE_ID } from "./constants";
import {
  ReviewDistributionPlanTableItemType,
  type ReviewDistributionPlanTableItem,
} from "./ReviewDistributionPlanTable.types";
import { isSubscriptionsAdmin } from "./ReviewDistributionPlanTableSubscription.utils";
type SubscriptionLinksProps = Readonly<{
  plan: AllowlistDescription;
  phase: ReviewDistributionPlanTableItem;
}>;

export function SubscriptionLinks({ plan, phase }: SubscriptionLinksProps) {
  const { connectedProfile } = useContext(AuthContext);
  const { confirmedTokenId } = useContext(DistributionPlanToolContext);
  const { seizeSettings } = useSeizeSettings();
  const { data: settings } = useDropForgeSettings();
  if (
    !isSubscriptionsAdmin(
      connectedProfile,
      seizeSettings.distribution_admin_wallets ?? []
    ) ||
    phase.type !== ReviewDistributionPlanTableItemType.PHASE ||
    !confirmedTokenId
  )
    return null;
  return settings?.preparation_enabled === true ? (
    <PreparedSubscriptionLinks plan={plan} phase={phase} />
  ) : (
    <ManualSubscriptionLinks
      plan={plan}
      phase={phase}
      tokenId={confirmedTokenId}
    />
  );
}

function PreparedSubscriptionLinks({ plan, phase }: SubscriptionLinksProps) {
  const { setToast } = useContext(AuthContext);
  const { confirmedTokenId, phases } = useContext(DistributionPlanToolContext);
  const locale = useBrowserLocale();
  const operation = useDropForgeProcess(
    MEMES_CONTRACT,
    Number(confirmedTokenId),
    plan.id
  );
  const [downloading, setDownloading] = useState(false);
  const isPublic = phase.phaseId === PUBLIC_SUBSCRIPTIONS_PHASE_ID;
  const phaseIds = getForgePhaseIds(phases);
  const completed =
    operation.data?.status === JobStatus.Completed &&
    forgeProcessInputsMatch(operation.data, phaseIds);
  async function download() {
    const job = operation.data;
    if (
      job?.status !== JobStatus.Completed ||
      !forgeProcessInputsMatch(job, phaseIds) ||
      downloading
    )
      return;
    setDownloading(true);
    try {
      const lists: Array<
        "airdrops" | "airdrops_unconsolidated" | "allowlists"
      > = isPublic
        ? ["airdrops"]
        : ["airdrops", "airdrops_unconsolidated", "allowlists"];
      const savedLists = await Promise.all(
        lists.map(async (list) => ({
          list,
          rows: await forgeList(job.id, isPublic ? "public" : phase.id, list),
        }))
      );
      savedLists.forEach(({ list, rows }) =>
        downloadCsv(phase.name, list, rows)
      );
    } catch (error) {
      setToast({
        type: "error",
        message:
          getToastErrorDetails(error) ?? t(locale, "dropForge.downloadError"),
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
interface WalletResult {
  wallet: string;
  amount: number;
}

interface SubscriptionResult {
  airdrops: WalletResult[];
  airdrops_unconsolidated: WalletResult[];
  allowlists: WalletResult[];
}

function ManualSubscriptionLinks({
  plan,
  phase,
  tokenId,
}: SubscriptionLinksProps & { tokenId: string }) {
  const { setToast } = useContext(AuthContext);
  const [downloading, setDownloading] = useState(false);
  const isPublic = phase.phaseId === PUBLIC_SUBSCRIPTIONS_PHASE_ID;
  const contract = MEMES_CONTRACT;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const downloadResponse = await download(
        contract,
        tokenId,
        plan.id,
        isPublic ? "public" : phase.id,
        isPublic ? "public" : phase.name
      );
      setToast({
        type: downloadResponse.success ? "success" : "error",
        title: downloadResponse.success
          ? "Download ready."
          : "Couldn't download subscriptions.",
        description: downloadResponse.success
          ? downloadResponse.message
          : "Please try again.",
        details: downloadResponse.success
          ? undefined
          : downloadResponse.message,
      });
    } catch (error) {
      console.error("Download failed", error);
      setToast({
        type: "error",
        title: "Couldn't download subscriptions.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      type="button"
      className="tw-group tw-flex tw-h-8 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-blue-500 tw-px-3 tw-text-xs tw-font-medium tw-text-white tw-ring-1 tw-ring-inset tw-ring-iron-500/50 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-blue-500/50"
    >
      {downloading ? (
        <span className="tw-flex tw-items-center tw-gap-2">
          <CircleLoader />
          <span>Downloading</span>
        </span>
      ) : (
        <>{isPublic ? "Public Subscriptions" : "Subscription Lists"}</>
      )}
    </button>
  );
}

const download = async (
  contract: string,
  tokenId: string,
  planId: string,
  phaseId: string,
  phaseName: string
) => {
  return await commonApiFetch<SubscriptionResult>({
    endpoint: `subscriptions/allowlists/${contract}/${tokenId}/${planId}/${phaseId}`,
  })
    .then((response) => {
      processResults(phaseName, response);
      return {
        success: true,
        message: "Subscription lists downloaded.",
      };
    })
    .catch((error) => {
      return {
        success: false,
        message: getToastErrorDetails(error) ?? "Download failed.",
      };
    });
};

const processResults = (phaseName: string, results: SubscriptionResult) => {
  if (phaseName === "public") {
    downloadCsv(phaseName, "airdrops", results.airdrops);
  } else {
    downloadCsv(phaseName, "airdrops", results.airdrops);
    downloadCsv(
      phaseName,
      "airdrops_unconsolidated",
      results.airdrops_unconsolidated
    );
    downloadCsv(phaseName, "allowlists", results.allowlists);
  }
};

function downloadCsv(
  phase: string,
  list: string,
  rows: Array<{ wallet: string; amount: number }>
) {
  const csv = buildCsv([
    ["address", "value"],
    ...rows.map(({ wallet, amount }) => [wallet, amount]),
  ]);
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
