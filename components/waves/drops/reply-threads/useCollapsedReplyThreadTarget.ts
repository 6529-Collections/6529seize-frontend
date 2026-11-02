"use client";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  fetchDropReplyThreadTarget,
  type DropReplyThreadTarget,
} from "@/services/api/drop-reply-thread-target-api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Links and notifications point at a drop's serial number. In collapsed-reply
 * waves a reply is not in the main stream, so resolve it to its parent.
 *
 * The requested serial is kept after the page removes it from the URL.
 */
export function useCollapsedReplyThreadTarget({
  enabled,
  waveId,
  serialNo,
}: {
  readonly enabled: boolean;
  readonly waveId: string;
  readonly serialNo: number | null;
}): DropReplyThreadTarget | null {
  const [requested, setRequested] = useState<{
    readonly waveId: string;
    readonly serialNo: number;
  } | null>(serialNo === null ? null : { waveId, serialNo });

  if (
    serialNo !== null &&
    (requested?.waveId !== waveId || requested.serialNo !== serialNo)
  ) {
    setRequested({ waveId, serialNo });
  }

  const requestedSerialNo =
    requested?.waveId === waveId ? requested.serialNo : null;
  const { data } = useQuery({
    queryKey: [
      QueryKey.DROP_REPLY_THREAD_TARGET,
      { wave_id: waveId, serial_no: requestedSerialNo },
    ],
    queryFn: ({ signal }) =>
      fetchDropReplyThreadTarget({
        serialNo: requestedSerialNo ?? 0,
        signal,
      }),
    enabled: enabled && requestedSerialNo !== null,
    staleTime: Infinity,
  });

  return enabled && requestedSerialNo !== null ? (data ?? null) : null;
}
