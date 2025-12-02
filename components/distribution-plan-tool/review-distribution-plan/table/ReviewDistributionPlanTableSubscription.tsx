"use client";

import { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { MEMES_CONTRACT, SUBSCRIPTIONS_ADMIN_WALLETS } from "@/constants";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  areEqualAddresses,
  extractAllNumbers,
  formatAddress,
} from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useContext, useState } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { PUBLIC_SUBSCRIPTIONS_PHASE_ID } from "./constants";
import {
  ReviewDistributionPlanTableItem,
  ReviewDistributionPlanTableItemType,
} from "./ReviewDistributionPlanTable";

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

  const [showConfirm, setShowConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (
    !isSubscriptionsAdmin(connectedProfile) ||
    props.phase.type !== ReviewDistributionPlanTableItemType.PHASE
  ) {
    return <></>;
  }

  const isPublic = props.phase.phaseId === PUBLIC_SUBSCRIPTIONS_PHASE_ID;

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={downloading}
        type="button"
        className="tw-px-3 tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-white tw-bg-blue-500 tw-ring-iron-500/50 hover:tw-bg-blue-500/50 tw-ease-out tw-transition tw-duration-300">
        {downloading ? (
          <span className="d-flex gap-2 align-items-center">
            <CircleLoader />
            <span>Downloading</span>
          </span>
        ) : (
          <>{isPublic ? "Public Subscriptions" : "Subscription Lists"}</>
        )}
      </button>
      <SubscriptionConfirm
        title={
          isPublic ? "Download Public Subscriptions" : "Download Subscriptions"
        }
        plan={props.plan}
        show={showConfirm}
        handleClose={() => setShowConfirm(false)}
        confirmedTokenId={confirmedTokenId}
        onConfirm={async (contract: string, tokenId: string) => {
          setShowConfirm(false);
          setDownloading(true);
          try {
            const downloadResponse = await download(
              contract,
              tokenId,
              props.plan.id,
              isPublic ? "public" : props.phase.id,
              isPublic ? "public" : props.phase.name
            );
            setToast({
              type: downloadResponse.success ? "success" : "error",
              message: downloadResponse.message,
            });
          } catch (error: any) {
            console.error("Download failed", error);
            setToast({
              type: "error",
              message: "Something went wrong.",
            });
          } finally {
            setDownloading(false);
          }
        }}
      />
    </>
  );
}

export function SubscriptionConfirm(
  props: Readonly<{
    title: string;
    plan: AllowlistDescription;
    show: boolean;
    handleClose(): void;
    isNormalized?: boolean;
    confirmedTokenId?: string | null;
    onConfirm(contract: string, tokenId: string): void;
  }>
) {
  const contract = MEMES_CONTRACT;
  const numbers = extractAllNumbers(props.plan.name);
  const defaultTokenId = numbers.length > 0 ? numbers[0].toString() : "";
  const [tokenId, setTokenId] = useState<string>(
    props.confirmedTokenId ?? defaultTokenId
  );

  const displayTokenId = props.confirmedTokenId ?? tokenId;

  return (
    <Modal show={props.show} onHide={props.handleClose}>
      <Modal.Header closeButton>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          Confirm {props.title} Info
        </Modal.Title>
      </Modal.Header>
      <hr className="mb-0 mt-0" />
      <Modal.Body>
        <Container>
          <Row className="pt-2 pb-2">
            <Col>
              Contract: The Memes - <span>{formatAddress(contract)}</span>
            </Col>
          </Row>
          <Row className="pt-2 pb-2">
            <Col>
              Token ID:{" "}
              {props.confirmedTokenId !== undefined &&
              props.confirmedTokenId !== null ? (
                <span>{displayTokenId}</span>
              ) : (
                <input
                  style={{
                    color: "black",
                    width: "100px",
                  }}
                  min={1}
                  step={1}
                  type="number"
                  value={tokenId}
                  onChange={(e) => {
                    setTokenId(e.target.value);
                  }}
                />
              )}
            </Col>
          </Row>
          {props.isNormalized !== undefined && props.isNormalized && (
            <Row className="pt-2 pb-2">
              <Col>
                <div className="alert alert-warning mb-0 border border-dark">
                  ⚠️ Distribution is already normalized. This will recalculate
                  and overwrite existing normalized data.
                </div>
              </Col>
            </Row>
          )}
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.handleClose}>
          Close
        </Button>
        <Button
          disabled={
            !displayTokenId || Number.isNaN(Number.parseInt(displayTokenId, 10))
          }
          variant="primary"
          onClick={() => props.onConfirm(contract, displayTokenId)}>
          Looks good
        </Button>
      </Modal.Footer>
    </Modal>
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
