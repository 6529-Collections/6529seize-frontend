import React from "react";
import Button from "@/components/utils/button/Button";

interface WaveWinnersApprovalErrorProps {
  readonly onRetry: () => void;
}

export const WaveWinnersApprovalError: React.FC<
  WaveWinnersApprovalErrorProps
> = ({ onRetry }) => (
  <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-4 tw-py-10 tw-text-center">
    <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-300">
      Unable to load approved drops.
    </p>
    <Button onClick={onRetry} variant="tertiary" size="sm">
      Try again
    </Button>
  </div>
);
