"use client";

import { MEMES_CONTRACT } from "@/constants/constants";
import { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import type { ReactNode } from "react";
import { Button } from "react-bootstrap";
import { DistributionAirdropsPhase } from "./ReviewDistributionPlanTableSubscriptionFooterPhaseAirdrops";
import {
  ReviewDistributionPlanTableSubscriptionFooterAlertRow,
  ReviewDistributionPlanTableSubscriptionFooterContractRow,
  ReviewDistributionPlanTableSubscriptionFooterLoadingRow,
  ReviewDistributionPlanTableSubscriptionFooterModal,
  ReviewDistributionPlanTableSubscriptionFooterRow,
} from "./ReviewDistributionPlanTableSubscriptionFooterModal";

function getPhaseLabel(phase: DistributionAirdropsPhase): string {
  return phase === "artist" ? "Artist" : "Team";
}

export function DistributionPhaseAirdropsViewerModal(
  props: Readonly<{
    phase: DistributionAirdropsPhase;
    confirmedTokenId: string;
    rows: PhaseAirdrop[];
    isLoading: boolean;
    error: string | null;
    handleClose(): void;
  }>
) {
  const phaseLabel = getPhaseLabel(props.phase);
  const totalAirdrops = props.rows.reduce(
    (total, row) => total + Number(row.amount ?? 0),
    0
  );
  let bodyContent: ReactNode;

  if (props.isLoading) {
    bodyContent = (
      <ReviewDistributionPlanTableSubscriptionFooterLoadingRow>
        Loading {props.phase} airdrops...
      </ReviewDistributionPlanTableSubscriptionFooterLoadingRow>
    );
  } else if (props.error) {
    bodyContent = (
      <ReviewDistributionPlanTableSubscriptionFooterAlertRow variant="danger">
        {props.error}
      </ReviewDistributionPlanTableSubscriptionFooterAlertRow>
    );
  } else if (props.rows.length === 0) {
    bodyContent = (
      <ReviewDistributionPlanTableSubscriptionFooterAlertRow variant="secondary">
        No {props.phase} airdrops found for this token.
      </ReviewDistributionPlanTableSubscriptionFooterAlertRow>
    );
  } else {
    bodyContent = (
      <>
        <ReviewDistributionPlanTableSubscriptionFooterRow>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <span className="tw-inline-flex tw-rounded-full tw-bg-sky-200 tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-text-sky-950">
              Addresses: {props.rows.length} | Count: {totalAirdrops}
            </span>
          </div>
        </ReviewDistributionPlanTableSubscriptionFooterRow>
        <ReviewDistributionPlanTableSubscriptionFooterRow>
          <div className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-iron-200">
            <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_120px] tw-bg-iron-100 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
              <span>Wallet</span>
              <span className="tw-text-right">Amount</span>
            </div>
            {props.rows.map((row, index) => (
              <div
                key={`${row.wallet}-${row.amount}`}
                className={`tw-grid tw-grid-cols-[minmax(0,1fr)_120px] tw-items-center tw-gap-4 tw-px-4 tw-py-3 tw-text-sm tw-text-iron-900 ${
                  index % 2 === 0 ? "tw-bg-white" : "tw-bg-iron-50"
                }`}
              >
                <span className="tw-break-all tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-700">
                  {row.wallet}
                </span>
                <span className="tw-text-right tw-font-semibold tw-text-iron-900">
                  {row.amount}
                </span>
              </div>
            ))}
          </div>
        </ReviewDistributionPlanTableSubscriptionFooterRow>
      </>
    );
  }

  return (
    <ReviewDistributionPlanTableSubscriptionFooterModal
      title={`${phaseLabel} Airdrops`}
      onClose={props.handleClose}
      size="lg"
      bodyTestId={`${props.phase}-airdrops-viewer-modal`}
      footer={
        <Button variant="secondary" onClick={props.handleClose}>
          Close
        </Button>
      }
    >
      <ReviewDistributionPlanTableSubscriptionFooterContractRow
        contract={MEMES_CONTRACT}
        tokenId={props.confirmedTokenId}
        muted
      />
      {bodyContent}
    </ReviewDistributionPlanTableSubscriptionFooterModal>
  );
}
