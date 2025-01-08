import { Container, Row, Col, Button } from "react-bootstrap";
import useCapacitor from "../../hooks/useCapacitor";
import DotLoader from "../dotLoader/DotLoader";
import AppWalletCard from "./AppWalletCard";
import { CreateAppWalletModal } from "./AppWalletModal";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";

export default function AppWallets() {
  const { fetchingWallets, wallets, fetchWallets } = useCapacitor();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <Container className="pt-4 pb-4">
      <Row>
        <h1>
          <span className="font-lightest">App</span> Wallets
        </h1>
      </Row>
      <Row className="mt-4">
        {fetchingWallets ? (
          <Col>
            Fetching wallets <DotLoader />
          </Col>
        ) : wallets.length === 0 ? (
          <Col>No wallets found</Col>
        ) : (
          wallets.map((w) => (
            <Col xs={12} sm={6} md={4} key={w.address} className="pb-3">
              <AppWalletCard wallet={w} />
            </Col>
          ))
        )}
      </Row>
      <Row className="mt-4">
        <Col className="d-flex align-items-center gap-3">
          <CreateAppWalletModal
            show={showCreateModal}
            onHide={(refresh: boolean) => {
              setShowCreateModal(false);
              if (refresh) {
                fetchWallets();
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
    </Container>
  );
}
