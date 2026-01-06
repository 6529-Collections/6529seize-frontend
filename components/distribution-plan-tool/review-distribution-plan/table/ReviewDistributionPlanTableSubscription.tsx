"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { MEMES_CONTRACT, SUBSCRIPTIONS_ADMIN_WALLETS } from "@/constants";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useContext, useState } from "react";
import { PUBLIC_SUBSCRIPTIONS_PHASE_ID } from "./constants";
import type { ReviewDistributionPlanTableItem } from "./ReviewDistributionPlanTable";
import { ReviewDistributionPlanTableItemType } from "./ReviewDistributionPlanTable";

interface WalletResult {
  wallet: string;
  amount: number;
}

interface SubscriptionResult {
  airdrops: WalletResult[];
  airdrops_unconsolidated: WalletResult[];
  allowlists: WalletResult[];
}

export function SubscriptionLinks(
  props: Readonly<{
    plan: AllowlistDescription;
    phase: ReviewDistributionPlanTableItem;
  }>
) {
  const { connectedProfile, setToast } = useContext(AuthContext);
  const { confirmedTokenId } = useContext(DistributionPlanToolContext);

  const [downloading, setDownloading] = useState(false);

  if (
    !isSubscriptionsAdmin(connectedProfile) ||
    props.phase.type !== ReviewDistributionPlanTableItemType.PHASE ||
    !confirmedTokenId
  ) {
    return <></>;
  }

  const isPublic = props.phase.phaseId === PUBLIC_SUBSCRIPTIONS_PHASE_ID;
  const contract = MEMES_CONTRACT;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const downloadResponse = await download(
        contract,
        confirmedTokenId,
        props.plan.id,
        isPublic ? "public" : props.phase.id,
        isPublic ? "public" : props.phase.name
      );
      setToast({
        type: downloadResponse.success ? "success" : "error",
        message: downloadResponse.message,
      });
    } catch (error) {
      console.error("Download failed", error);
      setToast({
        type: "error",
        message: "Something went wrong.",
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
        <span className="d-flex gap-2 align-items-center">
          <CircleLoader />
          <span>Downloading</span>
        </span>
      ) : (
        <>{isPublic ? "Public Subscriptions" : "Subscription Lists"}</>
      )}
    </button>
  );
}

export const isSubscriptionsAdmin = (connectedProfile: ApiIdentity | null) => {
  const connectedWallets =
    connectedProfile?.wallets?.map((wallet) => wallet.wallet) ?? [];
  return connectedWallets.some((w) =>
    SUBSCRIPTIONS_ADMIN_WALLETS.some((a) => areEqualAddresses(a, w))
  );
};

export const download = async (
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
        message: "Download successful",
      };
    })
    .catch((error) => {
      return {
        success: false,
        message: `Download failed: ${error}`,
      };
    });
};

const processResults = (phaseName: string, results: SubscriptionResult) => {
  if (phaseName === "public") {
    downloadCSV(phaseName, results.airdrops, "airdrops");
  } else {
    downloadCSV(phaseName, results.airdrops, "airdrops");
    downloadCSV(
      phaseName,
      results.airdrops_unconsolidated,
      "airdrops_unconsolidated"
    );
    downloadCSV(phaseName, results.allowlists, "allowlists");
  }
};

function convertToCSV(arr: WalletResult[]): string {
  const headers = "address,value";

  if (arr.length === 0) {
    return headers;
  }
  const rows = arr.map(({ wallet, amount }) => `${wallet},${amount}`);
  return [headers, ...rows].join("\n");
}

function downloadCSV(
  phaseName: string,
  results: WalletResult[],
  filename: string
) {
  const csv = convertToCSV(results);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute(
    "download",
    `${phaseName.replaceAll(" ", "_").toLowerCase()}_${filename}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
