"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import LinkHandlerFrame from "@/components/waves/LinkHandlerFrame";
import { DropLocation } from "@/components/waves/drops/drop.types";
import type { DropInteractionParams } from "@/components/waves/drops/drop.types";
import WaveDropQuote from "@/components/waves/drops/WaveDropQuote";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import {
  convertApiDropToExtendedDrop,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import {
  DROP_DETAIL_STALE_TIME_MS,
  fetchDropByIdBatched,
  getDropQueryKey,
} from "@/services/api/drop-api";
import { fetchQuorumParticipationDropPreviewBySerialNoV2 } from "@/services/api/quorum-participation-drop-preview-v2-api";
import QuorumParticipationDrop from "./QuorumParticipationDrop";

interface QuorumParticipationDropLinkPreviewProps {
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

export default function QuorumParticipationDropLinkPreview({
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
}: QuorumParticipationDropLinkPreviewProps) {
  const parsedSerialNo = toSerialNumber(serialNo);
  const normalizedDropId =
    dropId === undefined || dropId.length === 0 ? null : dropId;
  const { data: drop } = useQuery<ApiDrop | null>({
    queryKey:
      normalizedDropId !== null
        ? getDropQueryKey(normalizedDropId)
        : [
            QueryKey.DROP,
            "quorum-participation-link-preview",
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

  return (
    <LinkHandlerFrame href={href} hideLink={hideLink}>
      {extendedDrop ? (
        <QuorumParticipationDrop
          drop={extendedDrop}
          showWaveInfo={true}
          activeDrop={null}
          showReplyAndQuote={false}
          location={DropLocation.MY_STREAM}
          onReply={handleReply}
          onQuoteClick={onQuoteClick}
          onDropContentClick={handleDropContentClick}
          showInteractions={false}
          embedPath={embedPath}
          quotePath={quotePath}
          embedDepth={embedDepth}
          maxEmbedDepth={maxEmbedDepth}
        />
      ) : (
        <WaveDropQuote
          drop={drop ?? null}
          partId={1}
          onQuoteClick={onQuoteClick}
          embedPath={embedPath}
          quotePath={quotePath}
          embedDepth={embedDepth}
          maxEmbedDepth={maxEmbedDepth}
        />
      )}
    </LinkHandlerFrame>
  );
}
