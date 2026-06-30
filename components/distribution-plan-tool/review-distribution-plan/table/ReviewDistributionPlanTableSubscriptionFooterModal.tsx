"use client";

import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { formatAddress } from "@/helpers/Helpers";
import type { ReactNode } from "react";
import { Modal } from "react-bootstrap";

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

interface ReviewDistributionPlanTableSubscriptionFooterContractOnlyRowProps {
  readonly contract: string;
}

interface ReviewDistributionPlanTableSubscriptionFooterTokenIdRowProps {
  readonly confirmedTokenId?: string | null | undefined;
  readonly displayTokenId: string;
  readonly tokenId: string;
  readonly onTokenIdChange: (tokenId: string) => void;
}

interface ReviewDistributionPlanTableSubscriptionFooterMessageRowProps {
  readonly children: ReactNode;
}

interface ReviewDistributionPlanTableSubscriptionFooterAlertRowProps extends ReviewDistributionPlanTableSubscriptionFooterMessageRowProps {
  readonly variant: "danger" | "secondary" | "warning";
}

const ALERT_ROW_CLASSNAMES: Record<
  ReviewDistributionPlanTableSubscriptionFooterAlertRowProps["variant"],
  string
> = {
  danger:
    "tw-mb-0 tw-rounded-lg tw-border tw-border-red/30 tw-bg-red/10 tw-px-4 tw-py-3 tw-text-red",
  secondary:
    "tw-mb-0 tw-rounded-lg tw-border tw-border-iron-300 tw-bg-iron-100 tw-px-4 tw-py-3 tw-text-iron-800",
  warning:
    "tw-mb-0 tw-rounded-lg tw-border tw-border-yellow-700 tw-bg-yellow-100 tw-px-4 tw-py-3 tw-text-yellow-900",
};

export function ReviewDistributionPlanTableSubscriptionFooterModal({
  title,
  onClose,
  children,
  footer,
  size,
  closeButton = true,
  bodyTestId,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterModalProps>) {
  const modalSizeProps = size ? { size } : {};

  return (
    <Modal
      show
      onHide={onClose}
      className="tailwind-scope"
      {...modalSizeProps}
    >
      <Modal.Header closeButton={closeButton}>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          {title}
        </Modal.Title>
      </Modal.Header>
      <hr className="tw-my-0" />
      <Modal.Body data-testid={bodyTestId}>
        <div className="tw-container tw-mx-auto">{children}</div>
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
    <div className="tw-py-2">
      <div className={muted ? "tw-text-sm tw-text-iron-500" : undefined}>
        Contract: The Memes - {formatAddress(contract)} | Token ID: {tokenId}
      </div>
    </div>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterContractOnlyRow({
  contract,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterContractOnlyRowProps>) {
  return (
    <div className="tw-py-2">
      <div>
        Contract: The Memes - <span>{formatAddress(contract)}</span>
      </div>
    </div>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterTokenIdRow({
  confirmedTokenId,
  displayTokenId,
  tokenId,
  onTokenIdChange,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterTokenIdRowProps>) {
  return (
    <div className="tw-py-2">
      <div>
        Token ID:{" "}
        {confirmedTokenId !== undefined && confirmedTokenId !== null ? (
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
            aria-label="Token ID"
            value={tokenId}
            onChange={(e) => {
              onTokenIdChange(e.target.value);
            }}
          />
        )}
      </div>
    </div>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterLoadingRow({
  children,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterMessageRowProps>) {
  return (
    <div className="tw-py-4">
      <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
        <CircleLoader />
        <span>{children}</span>
      </div>
    </div>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterAlertRow({
  variant,
  children,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterAlertRowProps>) {
  return (
    <div className="tw-py-2">
      <div>
        <div className={ALERT_ROW_CLASSNAMES[variant]}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterRow({
  children,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterMessageRowProps>) {
  return (
    <div className="tw-py-2">
      <div>{children}</div>
    </div>
  );
}
