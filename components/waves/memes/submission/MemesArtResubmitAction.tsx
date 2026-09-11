"use client";

import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import Button from "@/components/utils/button/Button";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { useWave } from "@/hooks/useWave";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useCallback, useMemo, useState, type MouseEvent } from "react";
import { Tooltip } from "react-tooltip";

type ResubmitActionVariant = "icon" | "menu" | "button";

interface MemesArtResubmitActionProps {
  readonly drop: ExtendedDrop;
  readonly wave?: ApiWave | null | undefined;
  readonly variant?: ResubmitActionVariant | undefined;
  readonly onOpenModal?: (() => void) | undefined;
  readonly onModalClose?: (() => void) | undefined;
  readonly onSourceDropDeleted?: (() => void) | undefined;
}

interface MemesArtResubmitActionWithWaveProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly variant: ResubmitActionVariant;
  readonly onOpenModal?: (() => void) | undefined;
  readonly onModalClose?: (() => void) | undefined;
  readonly onSourceDropDeleted?: (() => void) | undefined;
}

const getDisabledReason = ({
  canSubmitNow,
  hasReachedLimit,
  isEligible,
  isWithinPeriod,
}: {
  readonly canSubmitNow: boolean;
  readonly hasReachedLimit: boolean;
  readonly isEligible: boolean;
  readonly isWithinPeriod: boolean;
}): string | null => {
  if (canSubmitNow) {
    return null;
  }

  if (hasReachedLimit) {
    return "Resubmit creates a new submission before deleting the original, so it is unavailable after reaching the submission limit.";
  }

  if (!isWithinPeriod) {
    return "Submissions are not currently open.";
  }

  if (!isEligible) {
    return "Your profile is not eligible to submit to this wave.";
  }

  return "Resubmit is not available right now.";
};

export function MemesArtResubmitAction({
  drop,
  wave,
  variant = "icon",
  onOpenModal,
  onModalClose,
  onSourceDropDeleted,
}: MemesArtResubmitActionProps) {
  if (!wave) {
    return null;
  }

  return (
    <MemesArtResubmitActionWithWave
      drop={drop}
      wave={wave}
      variant={variant}
      onOpenModal={onOpenModal}
      onModalClose={onModalClose}
      onSourceDropDeleted={onSourceDropDeleted}
    />
  );
}

function MemesArtResubmitActionWithWave({
  drop,
  wave,
  variant,
  onOpenModal,
  onModalClose,
  onSourceDropDeleted,
}: MemesArtResubmitActionWithWaveProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { canDelete, isAuthor, isWinner } = useDropInteractionRules(drop);
  const { participation } = useWave(wave);

  const isPotentialResubmission = isAuthor && canDelete && !isWinner;
  const disabledReason = useMemo(
    () =>
      getDisabledReason({
        canSubmitNow: participation.canSubmitNow,
        hasReachedLimit: participation.hasReachedLimit,
        isEligible: participation.isEligible,
        isWithinPeriod: participation.isWithinPeriod,
      }),
    [
      participation.canSubmitNow,
      participation.hasReachedLimit,
      participation.isEligible,
      participation.isWithinPeriod,
    ]
  );
  const disabled =
    drop.drop_type !== ApiDropType.Participatory || disabledReason !== null;

  const openModal = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (disabled) {
        return;
      }
      if (onOpenModal) {
        onOpenModal();
        return;
      }
      setIsModalOpen(true);
    },
    [disabled, onOpenModal]
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    onModalClose?.();
  }, [onModalClose]);

  if (!isPotentialResubmission) {
    return null;
  }

  const title = disabledReason ?? "Resubmit";
  const tooltipId = `resubmit-${drop.id}-${variant}`;

  const modal = isModalOpen ? (
    <MemesArtSubmissionModal
      isOpen={isModalOpen}
      wave={wave}
      sourceDrop={drop}
      onClose={closeModal}
      onSourceDropDeleted={onSourceDropDeleted}
    />
  ) : null;

  if (variant === "menu") {
    return (
      <>
        <div>
          <button
            type="button"
            onClick={openModal}
            aria-disabled={disabled}
            title={title}
            className={`tw-flex tw-w-full tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-px-4 tw-py-3 tw-transition-colors tw-duration-200 ${
              disabled
                ? "tw-cursor-not-allowed tw-text-iron-600"
                : "tw-text-iron-200 active:tw-bg-iron-800"
            }`}
          >
            <ArrowPathIcon className="tw-size-5 tw-flex-shrink-0" />
            <span className="tw-text-base tw-font-semibold">Resubmit</span>
          </button>
          {disabledReason && (
            <p className="tw-mb-0 tw-mt-2 tw-px-4 tw-text-xs tw-leading-5 tw-text-iron-500">
              {disabledReason}
            </p>
          )}
        </div>
        {modal}
      </>
    );
  }

  if (variant === "button") {
    return (
      <>
        <div className="tw-flex tw-flex-col tw-gap-y-2">
          <Button
            type="button"
            onClick={openModal}
            disabled={disabled}
            title={title}
            variant="action"
            size="md"
          >
            <ArrowPathIcon className="tw-size-4 tw-flex-shrink-0" />
            <span>Resubmit Drop</span>
          </Button>
          {disabledReason && (
            <p className="tw-mb-0 tw-max-w-xs tw-text-xs tw-leading-5 tw-text-iron-500">
              {disabledReason}
            </p>
          )}
        </div>
        {modal}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-disabled={disabled}
        title={title}
        className={`tw-cursor-pointer tw-border-0 tw-bg-transparent tw-px-2 tw-transition-colors ${
          disabled
            ? "tw-cursor-not-allowed tw-text-iron-600"
            : "tw-text-iron-400 desktop-hover:hover:tw-text-primary-300"
        }`}
        aria-label="Resubmit drop"
        data-tooltip-id={tooltipId}
      >
        <ArrowPathIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
      </button>
      <Tooltip
        id={tooltipId}
        place="top-end"
        offset={8}
        opacity={1}
        positionStrategy="fixed"
        style={{
          borderRadius: "6px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
          zIndex: 10000,
          pointerEvents: "none",
          maxWidth: "280px",
        }}
      >
        <span className="tw-text-xs">{title}</span>
      </Tooltip>
      {modal}
    </>
  );
}
