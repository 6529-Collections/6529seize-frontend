"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import LinkHandlerFrame from "@/components/waves/LinkHandlerFrame";
import type { DropInteractionParams } from "@/components/waves/drops/drop.types";
import { DropLocation } from "@/components/waves/drops/drop.types";
import Drop from "@/components/waves/drops/Drop";
import WaveDropQuote from "@/components/waves/drops/WaveDropQuote";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import {
  convertApiDropToExtendedDrop,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { useWaveById } from "@/hooks/useWaveById";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import {
  DROP_DETAIL_STALE_TIME_MS,
  fetchDropByIdBatched,
  getDropQueryKey,
} from "@/services/api/drop-api";
import { fetchQuorumParticipationDropPreviewBySerialNoV2 } from "@/services/api/quorum-participation-drop-preview-v2-api";

interface WaveDropLinkPreviewProps {
  readonly href: string;
  readonly waveId: string;
  readonly dropId?: string | undefined;
  readonly serialNo?: string | number | undefined;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
  readonly hideLink?: boolean | undefined;
}

const toSerialNumber = (
  serialNo: string | number | undefined
): number | null => {
  if (typeof serialNo === "number") {
    return Number.isFinite(serialNo) ? serialNo : null;
  }

  if (!serialNo) {
    return null;
  }

  const parsed = Number.parseInt(serialNo, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (error === null || error === undefined || typeof error !== "object") {
    return undefined;
  }

  const maybeError = error as {
    readonly status?: unknown;
    readonly response?: { readonly status?: unknown };
  };
  const status = maybeError.response?.status ?? maybeError.status;

  return typeof status === "number" ? status : undefined;
};

const isDropNotFoundError = (
  error: unknown,
  normalizedDropId: string | null
): boolean => {
  if (error === null || error === undefined) {
    return false;
  }

  if (getErrorStatus(error) === 404) {
    return true;
  }

  if (!normalizedDropId) {
    return false;
  }

  const expectedMessage = `Drop ${normalizedDropId} not found`;

  if (error instanceof Error) {
    return error.message === expectedMessage;
  }

  return error === expectedMessage;
};

export default function WaveDropLinkPreview({
  href,
  waveId,
  dropId,
  serialNo,
  onQuoteClick,
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
  hideLink,
}: WaveDropLinkPreviewProps) {
  const parsedSerialNo = toSerialNumber(serialNo);
  const normalizedDropId = dropId?.trim() ? dropId.trim() : null;
  const { data: drop, error } = useQuery<ApiDrop | null>({
    queryKey:
      normalizedDropId !== null
        ? getDropQueryKey(normalizedDropId)
        : [
            QueryKey.DROP,
            "wave-drop-link-preview",
            {
              dropId: normalizedDropId,
              waveId,
              serialNo: parsedSerialNo,
            },
          ],
    queryFn: async () => {
      if (normalizedDropId !== null) {
        return await fetchDropByIdBatched(normalizedDropId);
      }

      if (parsedSerialNo !== null) {
        return await fetchQuorumParticipationDropPreviewBySerialNoV2({
          waveId,
          serialNo: parsedSerialNo,
        });
      }

      return null;
    },
    enabled: normalizedDropId !== null || parsedSerialNo !== null,
    placeholderData: keepPreviousData,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
  });
  const { wave } = useWaveById(waveId, {
    enabled: drop?.drop_type === ApiDropType.Participatory,
  });
  const {
    winningThreshold,
    winningThresholdMinDurationMs,
    isVotingClosed,
    isVotingControlsLocked,
  } = useApprovalWaveStatus({ wave });

  const extendedDrop = useMemo<ExtendedDrop | null>(() => {
    if (drop?.drop_type !== ApiDropType.Participatory) {
      return null;
    }

    return convertApiDropToExtendedDrop(drop);
  }, [drop]);

  const handleReply = useCallback((_params: DropInteractionParams) => {
    return undefined;
  }, []);

  const handleDropContentClick = useCallback(
    (selectedDrop: ExtendedDrop) => onQuoteClick(selectedDrop),
    [onQuoteClick]
  );

  const isNotFound =
    drop === null || isDropNotFoundError(error, normalizedDropId);

  return (
    <LinkHandlerFrame href={href} hideLink={hideLink}>
      {extendedDrop ? (
        <Drop
          drop={extendedDrop}
          previousDrop={null}
          nextDrop={null}
          showWaveInfo={true}
          activeDrop={null}
          showReplyAndQuote={false}
          location={DropLocation.MY_STREAM}
          dropViewDropId={null}
          onReply={handleReply}
          onReplyClick={() => undefined}
          onQuoteClick={onQuoteClick}
          onDropContentClick={handleDropContentClick}
          showInteractions={false}
          winningThreshold={winningThreshold}
          winningThresholdMinDurationMs={winningThresholdMinDurationMs}
          isVotingClosed={isVotingClosed}
          isVotingControlsLocked={isVotingControlsLocked}
          embedPath={embedPath}
          quotePath={quotePath}
          embedDepth={embedDepth}
          maxEmbedDepth={maxEmbedDepth}
        />
      ) : (
        <WaveDropQuote
          drop={isNotFound ? null : (drop ?? null)}
          partId={1}
          onQuoteClick={onQuoteClick}
          isNotFound={isNotFound}
          embedPath={embedPath}
          quotePath={quotePath}
          embedDepth={embedDepth}
          maxEmbedDepth={maxEmbedDepth}
          hideLinkPreviews={drop?.hide_link_preview === true}
        />
      )}
    </LinkHandlerFrame>
  );
}
