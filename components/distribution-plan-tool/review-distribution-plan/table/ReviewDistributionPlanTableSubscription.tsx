import Cookies from "js-cookie";
import { useContext, useState } from "react";
import { Modal, Button, Col, Container, Row } from "react-bootstrap";
import {
  API_AUTH_COOKIE,
  WALLET_AUTH_COOKIE,
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
import { Spinner } from "../../../dotLoader/DotLoader";

export function SubscriptionLinks(
  props: Readonly<{
    plan: AllowlistDescription;
    phase: ReviewDistributionPlanTableItem;
  }>
) {
  const { connectedProfile, setToast } = useContext(AuthContext);

  const [showConfirm, setShowConfirm] = useState(false);

  const apiAuth = Cookies.get(API_AUTH_COOKIE);
  let headers: any = {};
  if (apiAuth) {
    headers["x-6529-auth"] = apiAuth;
  }

  const allowlistAuth = Cookies.get(WALLET_AUTH_COOKIE);
  if (allowlistAuth) {
    headers["Authorization"] = `Bearer ${allowlistAuth}`;
  }

  const [downloading, setDownloading] = useState(false);

  const fileName = props.phase.name.replaceAll(" ", "_").toLowerCase();

  const isSubscriptionsAdmin = () => {
    const connectedWallets =
      connectedProfile?.consolidation.wallets.map(
        (wallet) => wallet.wallet.address
      ) ?? [];
    return connectedWallets.some((w) =>
      SUBSCRIPTIONS_ADMIN_WALLETS.some((a) => areEqualAddresses(a, w))
    );
  };

  const download = async (contract: string, tokenId: string) => {
    setShowConfirm(false);
    setDownloading(true);
    try {
      const url = `${process.env.API_ENDPOINT}/api/subscriptions/allowlists/${contract}/${tokenId}/${props.plan.id}/${props.phase.id}`;
      const response = await fetch(url, {
        headers,
      });
      if (!response.ok) {
        const json = await response.json();
        setToast({
          type: "error",
          message: json.message ?? json.error,
        });
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${fileName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
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
        <span
          className="d-flex align-items-center"
          style={{
            border: "1px solid #767676",
            borderRadius: "20px",
            padding: "5px 10px",
          }}>
          <button
            className="btn-link decoration-none"
            onClick={() => setShowConfirm(true)}>
            {downloading ? (
              <span className="d-flex gap-2 align-items-center">
                <Spinner dimension={18} />
                <span>Downloading</span>
              </span>
            ) : (
              <>Subscription Lists</>
            )}
          </button>
        </span>
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
