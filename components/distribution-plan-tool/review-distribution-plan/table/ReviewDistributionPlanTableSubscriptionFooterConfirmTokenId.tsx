"use client";

import { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { MEMES_CONTRACT } from "@/constants";
import {
  extractAllNumbers,
  formatAddress,
  isValidPositiveInteger,
} from "@/helpers/Helpers";
import { useState } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";

export function ConfirmTokenIdModal(
  props: Readonly<{
    plan: AllowlistDescription;
    show: boolean;
    onConfirm(contract: string, tokenId: string): void;
  }>
) {
  const contract = MEMES_CONTRACT;
  const numbers = extractAllNumbers(props.plan.name);
  const initialTokenId = numbers.length > 0 ? numbers[0].toString() : "";
  const [tokenId, setTokenId] = useState<string>(
    isValidPositiveInteger(initialTokenId) ? initialTokenId : ""
  );

  const isValid = isValidPositiveInteger(tokenId);

  const handleConfirm = () => {
    if (isValid) {
      props.onConfirm(contract, tokenId);
    }
  };

  return (
    <Modal
      show={props.show}
      onHide={() => {}}
      backdrop="static"
      keyboard={false}>
      <Modal.Header>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          Confirm Token ID
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isValid) {
                    handleConfirm();
                  }
                }}
              />
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={!isValid}
          variant="primary"
          onClick={handleConfirm}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

