import { useContext, useState } from "react";
import { Modal, Button, Col, Container, Row } from "react-bootstrap";
import {
  SUBSCRIPTIONS_ADMIN_WALLETS,
  MEMES_CONTRACT,
} from "../../../../constants";
import { areEqualAddresses, formatAddress } from "../../../../helpers/Helpers";
import { AllowlistDescription } from "../../../allowlist-tool/allowlist-tool.types";
import { AuthContext } from "../../../auth/Auth";
import {
  ReviewDistributionPlanTableItem,
  ReviewDistributionPlanTableItemType,
} from "./ReviewDistributionPlanTable";
import { commonApiFetch } from "../../../../services/api/common-api";
import CircleLoader from "../../common/CircleLoader";

interface WalletResult {
  wallet: string;
  amount: number;
}

interface SubscriptionResult {
  airdrops: WalletResult[];
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

  const isSubscriptionsAdmin = () => {
    const connectedWallets =
      connectedProfile?.consolidation.wallets.map(
        (wallet) => wallet.wallet.address
      ) ?? [];
    return connectedWallets.some((w) =>
      SUBSCRIPTIONS_ADMIN_WALLETS.some((a) => areEqualAddresses(a, w))
    );
  };

  function convertToCSV(arr: WalletResult[]): string {
    const headers = "address,value";

    if (arr.length === 0) {
      return headers;
    }
    const rows = arr.map(({ wallet, amount }) => `${wallet},${amount}`);
    return [headers, ...rows].join("\n");
  }

  function downloadCSV(results: WalletResult[], filename: string) {
    const csv = convertToCSV(results);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `${props.phase.name.replaceAll(" ", "_").toLowerCase()}_${filename}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const processResults = (results: SubscriptionResult) => {
    const merged = mergeResults([...results.airdrops, ...results.allowlists]);
    downloadCSV(merged, "merged");
    downloadCSV(results.airdrops, "airdrops");
    downloadCSV(results.allowlists, "allowlists");
  };

  const download = async (contract: string, tokenId: string) => {
    setShowConfirm(false);
    setDownloading(true);
    try {
      const response = await commonApiFetch<SubscriptionResult>({
        endpoint: `subscriptions/allowlists/${contract}/${tokenId}/${props.plan.id}/${props.phase.id}`,
      });

      processResults(response);
    } catch (error: any) {
      console.error("Download failed", error);
      setToast({
        type: "error",
        message: "Something went wrong.",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (
    isSubscriptionsAdmin() &&
    props.phase.type === ReviewDistributionPlanTableItemType.PHASE
  ) {
    return (
      <>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={downloading}
          type="button"
          className="tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20 hover:tw-bg-neutral-400/20 tw-ease-out tw-transition tw-duration-300">
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
          plan={props.plan}
          show={showConfirm}
          handleClose={() => setShowConfirm(false)}
          download={download}
        />
      </>
    );
  }
}

function SubscriptionConfirm(
  props: Readonly<{
    plan: AllowlistDescription;
    show: boolean;
    handleClose(): void;
    download(contract: string, tokenId: string): void;
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
        <Modal.Title>Confirm Download Info</Modal.Title>
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
          onClick={() => props.download(contract, tokenId)}>
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
