"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";
import DistributionPlanTableWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableWrapper";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import ReviewDistributionPlanTableBody from "./ReviewDistributionPlanTableBody";
import ReviewDistributionPlanTableHeader from "./ReviewDistributionPlanTableHeader";
import { ReviewDistributionPlanTableSubscriptionFooter } from "./ReviewDistributionPlanTableSubscriptionFooter";
import {
  buildReviewDistributionPlanTableRows,
  type ReviewDistributionPlanTablePhase,
} from "./ReviewDistributionPlanTable.types";

export default function ReviewDistributionPlanTable() {
  const { phases } = useContext(DistributionPlanToolContext);
  const { connectedProfile } = useContext(AuthContext);
  const { seizeSettings } = useSeizeSettings();

  const [rows, setRows] = useState<ReviewDistributionPlanTablePhase[]>([]);

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
      <DistributionPlanTableWrapper>
        <ReviewDistributionPlanTableHeader rows={rows} />
        <ReviewDistributionPlanTableBody rows={rows} />
      </DistributionPlanTableWrapper>
      <ReviewDistributionPlanTableSubscriptionFooter />
    </>
  );
}
