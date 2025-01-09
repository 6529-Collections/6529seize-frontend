import { Container, Row, Col, Button } from "react-bootstrap";
import DotLoader from "../dotLoader/DotLoader";
import AppWalletCard from "./AppWalletCard";
import { CreateAppWalletModal } from "./AppWalletModal";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import useAppWallets from "../../hooks/useAppWallets";
import useCapacitor from "../../hooks/useCapacitor";
import Link from "next/link";

export default function AppWallets() {
  const { fetchingAppWallets, appWallets, fetchAppWallets } = useAppWallets();
  const router = useRouter();
  const capacitor = useCapacitor();

  const [showCreateModal, setShowCreateModal] = useState(false);

  function printWallets() {
    if (fetchingAppWallets) {
      return (
        <Col>
          Fetching wallets <DotLoader />
        </Col>
      );
    }

    if (appWallets.length === 0) {
      return <Col>No wallets found</Col>;
    }

    return appWallets.map((w) => (
      <Col xs={12} sm={6} md={4} key={w.address} className="pb-3">
        <AppWalletCard wallet={w} />
      </Col>
    ));
  }

  function printContent() {
    if (!capacitor.isCapacitor) {
      return (
        <>
          <Row className="mt-4">
            <Col>App Wallets are not supported on this platform</Col>
          </Row>
          <Row className="mt-4">
            <Col>
              <Link href="/">TAKE ME HOME</Link>
            </Col>
          </Row>
        </>
      );
    }

    return (
      <>
        <Row className="mt-4">{printWallets()}</Row>
        <Row className="mt-4">
          <Col className="d-flex align-items-center gap-3">
            <CreateAppWalletModal
              show={showCreateModal}
              onHide={(refresh: boolean) => {
                setShowCreateModal(false);
                if (refresh) {
                  fetchAppWallets();
                }
              }}
            />
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faPlusCircle} height={16} /> Create Wallet
            </Button>
            <Button
              variant="success"
              onClick={() => router.push("/tools/app-wallets/import-wallet")}
              className="d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faPlusCircle} height={16} /> Import Wallet
            </Button>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <Container className="pt-4 pb-4">
      <Row>
        <h1>
          <span className="font-lightest">App</span> Wallets
        </h1>
      </Row>
      {printContent()}
    </Container>
  );
}
