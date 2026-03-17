"use client";

import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { MEMES_CONTRACT } from "@/constants/constants";
import { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import { formatAddress } from "@/helpers/Helpers";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { DistributionAirdropsPhase } from "./ReviewDistributionPlanTableSubscriptionFooterPhaseAirdrops";

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

  return (
    <Modal show onHide={props.handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          {phaseLabel} Airdrops
        </Modal.Title>
      </Modal.Header>
      <hr className="mb-0 mt-0" />
      <Modal.Body data-testid={`${props.phase}-airdrops-viewer-modal`}>
        <Container>
          <Row className="pt-2 pb-2">
            <Col className="tw-text-sm tw-text-iron-500">
              Contract: The Memes - {formatAddress(MEMES_CONTRACT)} | Token ID:{" "}
              {props.confirmedTokenId}
            </Col>
          </Row>
          {props.isLoading ? (
            <Row className="pt-4 pb-4">
              <Col className="d-flex align-items-center justify-content-center gap-2">
                <CircleLoader />
                <span>Loading {props.phase} airdrops...</span>
              </Col>
            </Row>
          ) : props.error ? (
            <Row className="pt-2 pb-2">
              <Col>
                <div className="alert alert-danger mb-0">{props.error}</div>
              </Col>
            </Row>
          ) : props.rows.length === 0 ? (
            <Row className="pt-2 pb-2">
              <Col>
                <div className="alert alert-secondary mb-0 border border-dark">
                  No {props.phase} airdrops found for this token.
                </div>
              </Col>
            </Row>
          ) : (
            <>
              <Row className="pt-2 pb-2">
                <Col>
                  <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                    <span className="tw-inline-flex tw-rounded-full tw-bg-sky-200 tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-text-sky-950">
                      Addresses: {props.rows.length} | Count: {totalAirdrops}
                    </span>
                  </div>
                </Col>
              </Row>
              <Row className="pt-2 pb-2">
                <Col>
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
                </Col>
              </Row>
            </>
          )}
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
