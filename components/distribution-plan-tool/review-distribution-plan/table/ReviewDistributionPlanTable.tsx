"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import ReviewDistributionPlanTableBody from "./ReviewDistributionPlanTableBody";
import ReviewDistributionPlanTableHeader from "./ReviewDistributionPlanTableHeader";
import styles from "./ReviewDistributionPlanTable.module.css";
import clsx from "clsx";
import { ReviewDistributionPlanTableSubscriptionFooter } from "./ReviewDistributionPlanTableSubscriptionFooter";
import {
  buildReviewDistributionPlanTableRows,
  type ReviewDistributionPlanTablePhase,
} from "./ReviewDistributionPlanTable.types";

export default function ReviewDistributionPlanTable() {
  const { phases, distributionPlan, confirmedTokenId } = useContext(
    DistributionPlanToolContext
  );
  const { connectedProfile } = useContext(AuthContext);
  const { seizeSettings } = useSeizeSettings();

  const [rows, setRows] = useState<ReviewDistributionPlanTablePhase[]>([]);

  const [manualChoice, setManualChoice] = useState<{
    planId: string;
    tokenId: string;
  } | null>(null);
  const showManual =
    manualChoice !== null &&
    manualChoice.planId === distributionPlan?.id &&
    manualChoice.tokenId === confirmedTokenId;

  function chooseManual() {
    if (distributionPlan && confirmedTokenId)
      setManualChoice({
        planId: distributionPlan.id,
        tokenId: confirmedTokenId,
      });
  }

  useEffect(() => {
    setRows(
      buildReviewDistributionPlanTableRows({
        phases,
        connectedProfile,
        distributionAdminWallets:
          seizeSettings.distribution_admin_wallets ?? [],
      })
    );
  }, [phases, connectedProfile, seizeSettings.distribution_admin_wallets]);
  return (
    <>
      <div
        className={clsx(
          styles["frame"],
          "tw-min-w-0 tw-rounded-lg tw-ring-1 tw-ring-white/10"
        )}
      >
        <table
          className={clsx(styles["table"], "tw-divide-y tw-divide-iron-700/60")}
        >
          <ReviewDistributionPlanTableHeader rows={rows} />
          <ReviewDistributionPlanTableBody
            rows={rows}
            showManual={showManual}
          />
        </table>
      </div>
      <ReviewDistributionPlanTableSubscriptionFooter
        showManual={showManual}
        onChooseManual={chooseManual}
        onClearManualChoice={() => setManualChoice(null)}
      />
    </>
  );
}
