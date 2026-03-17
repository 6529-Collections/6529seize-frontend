"use client";

import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { formatAddress } from "@/helpers/Helpers";
import type { ReactNode } from "react";
import { Col, Container, Modal, Row } from "react-bootstrap";

interface ReviewDistributionPlanTableSubscriptionFooterModalProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly footer: ReactNode;
  readonly size?: "sm" | "lg" | "xl";
  readonly closeButton?: boolean;
  readonly bodyTestId?: string;
}

interface ReviewDistributionPlanTableSubscriptionFooterContractRowProps {
  readonly contract: string;
  readonly tokenId: string;
  readonly muted?: boolean;
}

interface ReviewDistributionPlanTableSubscriptionFooterMessageRowProps {
  readonly children: ReactNode;
}

interface ReviewDistributionPlanTableSubscriptionFooterAlertRowProps extends ReviewDistributionPlanTableSubscriptionFooterMessageRowProps {
  readonly variant: "danger" | "secondary";
}

export function ReviewDistributionPlanTableSubscriptionFooterModal({
  title,
  onClose,
  children,
  footer,
  size,
  closeButton = true,
  bodyTestId,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterModalProps>) {
  return (
    <Modal show onHide={onClose} size={size}>
      <Modal.Header closeButton={closeButton}>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          {title}
        </Modal.Title>
      </Modal.Header>
      <hr className="mb-0 mt-0" />
      <Modal.Body data-testid={bodyTestId}>
        <Container>{children}</Container>
      </Modal.Body>
      <Modal.Footer>{footer}</Modal.Footer>
    </Modal>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterContractRow({
  contract,
  tokenId,
  muted = false,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterContractRowProps>) {
  return (
    <Row className="pt-2 pb-2">
      <Col className={muted ? "tw-text-sm tw-text-iron-500" : undefined}>
        Contract: The Memes - {formatAddress(contract)} | Token ID: {tokenId}
      </Col>
    </Row>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterLoadingRow({
  children,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterMessageRowProps>) {
  return (
    <Row className="pt-4 pb-4">
      <Col className="d-flex align-items-center justify-content-center gap-2">
        <CircleLoader />
        <span>{children}</span>
      </Col>
    </Row>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterAlertRow({
  variant,
  children,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterAlertRowProps>) {
  return (
    <Row className="pt-2 pb-2">
      <Col>
        <div className={`alert alert-${variant} mb-0`}>{children}</div>
      </Col>
    </Row>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterRow({
  children,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterMessageRowProps>) {
  return (
    <Row className="pt-2 pb-2">
      <Col>{children}</Col>
    </Row>
  );
}
