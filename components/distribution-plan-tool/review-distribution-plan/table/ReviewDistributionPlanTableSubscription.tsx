"use client";

import { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import {
    MEMES_CONTRACT,
    SUBSCRIPTIONS_ADMIN_WALLETS,
} from "@/constants";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses, formatAddress } from "@/helpers/Helpers";
import {
    commonApiFetch,
    commonApiPost,
} from "@/services/api/common-api";
import { useContext, useState } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";
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

  const [showConfirm, setShowConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (
    isSubscriptionsAdmin(connectedProfile) &&
    props.phase.type === ReviewDistributionPlanTableItemType.PHASE
  ) {
    return (
      <>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={downloading}
          type="button"
          className="tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-400 tw-bg-iron-400/10 tw-ring-iron-400/20 hover:tw-bg-iron-400/20 tw-ease-out tw-transition tw-duration-300">
          {downloading ? (
            <span className="d-flex gap-2 align-items-center">
              <CircleLoader />
              <span>Downloading</span>
            </span>
          ) : (
            <>Subscription Lists</>
          )}
        </button>
        <SubscriptionConfirm
          title="Download Subscriptions"
          plan={props.plan}
          show={showConfirm}
          handleClose={() => setShowConfirm(false)}
          onConfirm={async (contract: string, tokenId: string) => {
            setShowConfirm(false);
            setDownloading(true);
            try {
              const downloadResponse = await download(
                contract,
                tokenId,
                props.plan.id,
                props.phase.id,
                props.phase.name
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
}

export function SubscriptionConfirm(
  props: Readonly<{
    title: string;
    plan: AllowlistDescription;
    show: boolean;
    handleClose(): void;
    onConfirm(contract: string, tokenId: string): void;
  }>
) {
  function extractAllNumbers(str: string): number[] {
    const regex = /\d+/g;
    const numbers = [];
    let match;

    while ((match = regex.exec(str)) !== null) {
      numbers.push(parseInt(match[0]));
    }

    return numbers;
  }

  const contract = MEMES_CONTRACT;
  const [tokenId, setTokenId] = useState<string>(
    extractAllNumbers(props.plan.name)[0].toString() ?? ""
  );

  return (
    <Modal show={props.show} onHide={props.handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Confirm {props.title} Info</Modal.Title>
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
              <input
                style={{
                  color: "black",
                  width: "100px",
                }}
                min={1}
                type="number"
                value={parseInt(tokenId)}
                onChange={(e) => {
                  setTokenId(e.target.value);
                }}
              />
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.handleClose}>
          Close
        </Button>
        <Button
          disabled={!tokenId || isNaN(parseInt(tokenId))}
          variant="primary"
          onClick={() => props.onConfirm(contract, tokenId)}>
          Looks good
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

const mergeResults = (results: WalletResult[]): WalletResult[] => {
  const mergedResults = new Map<string, number>();
  for (const r of results) {
    const currentAmount = mergedResults.get(r.wallet) ?? 0;
    mergedResults.set(r.wallet, currentAmount + r.amount);
  }
  return Array.from(mergedResults).map(([wallet, amount]) => ({
    wallet,
    amount,
  }));
};

const resetSubscriptions = async (
  contract: string,
  tokenId: string,
  planId: string
) => {
  await commonApiPost({
    endpoint: `subscriptions/allowlists/${contract}/${tokenId}/${planId}/reset`,
    body: {},
  });
};

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
    const merged = mergeResults([...results.airdrops, ...results.allowlists]);
    downloadCSV(phaseName, merged, "merged");
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
  link.href = URL.createObjectURL(blob);
  link.setAttribute(
    "download",
    `${phaseName.replaceAll(" ", "_").toLowerCase()}_${filename}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
