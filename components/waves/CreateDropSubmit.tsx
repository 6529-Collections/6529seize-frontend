import React from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import Button from "../utils/button/Button";
import { ComposerSendButton } from "./ComposerSendButton";

interface CreateDropSubmitProps {
  readonly submitting: boolean;
  readonly canSubmit: boolean;
  readonly disabledTooltip?: string | null | undefined;
  readonly isDropMode: boolean;
  readonly label?: string | undefined;
  readonly showLabelOnMobile?: boolean | undefined;
  readonly onDrop: () => void;
}

export const CreateDropSubmit: React.FC<CreateDropSubmitProps> = ({
  submitting,
  canSubmit,
  disabledTooltip = null,
  isDropMode,
  label,
  showLabelOnMobile = false,
  onDrop,
}) => {
  const submitLabel = label ?? (isDropMode ? "Drop" : "Post");
  const iconOnly = !isDropMode && !label && !showLabelOnMobile;
  const title = !canSubmit && disabledTooltip ? disabledTooltip : undefined;

  const button = iconOnly ? (
    <ComposerSendButton
      onClick={onDrop}
      loading={submitting}
      disabled={!canSubmit}
      title={title}
      aria-label={submitting ? `${submitLabel} in progress` : submitLabel}
    />
  ) : (
    <Button
      onClick={onDrop}
      loading={submitting}
      disabled={!canSubmit}
      title={title}
      variant="primary"
      size={null}
      className={`tw-h-10 tw-py-2 tw-text-sm ${
        showLabelOnMobile
          ? "tw-min-w-20 tw-px-3 lg:tw-px-3.5"
          : "tw-w-10 tw-px-0"
      } ${!showLabelOnMobile ? "lg:tw-w-[3.875rem] lg:tw-px-3.5" : ""}`}
      aria-label={submitting ? `${submitLabel} in progress` : submitLabel}
      hideChildrenWhenLoading
    >
      <span
        className={`${
          showLabelOnMobile ? "tw-inline" : "tw-hidden lg:tw-inline"
        } ${label ? "tw-text-[10px]" : ""}`}
      >
        {submitLabel}
      </span>
      {!showLabelOnMobile && (
        <PaperAirplaneIcon
          aria-hidden="true"
          className="tw-size-5 tw-flex-shrink-0 lg:tw-hidden"
        />
      )}
    </Button>
  );

  return title ? (
    <span className="tw-inline-flex" title={title}>
      {button}
    </span>
  ) : (
    button
  );
};
