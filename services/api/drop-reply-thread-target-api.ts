import type { ApiDropV2PageWithoutCount } from "@/generated/models/ApiDropV2PageWithoutCount";
import { commonApiFetch } from "@/services/api/common-api";

export interface DropReplyThreadTarget {
  readonly parentDropId: string;
  readonly parentSerialNo: number;
}

/**
 * Resolves a linked drop to the drop it replies to. Collapsed-reply waves
 * keep replies out of the main stream, so links to a reply open its parent's
 * thread instead. Returns null for drops that are not replies.
 */
export async function fetchDropReplyThreadTarget({
  serialNo,
  collapseAll = true,
  signal,
}: {
  readonly serialNo: number;
  readonly collapseAll?: boolean;
  readonly signal?: AbortSignal | undefined;
}): Promise<DropReplyThreadTarget | null> {
  const response = await commonApiFetch<ApiDropV2PageWithoutCount>({
    endpoint: "v2/drops",
    params: {
      serial_nos: serialNo.toString(),
      page_size: "1",
    },
    signal,
  });
  const reply = response.data[0];
  const root = reply?.collapsed_reply_thread;
  if (root) return { parentDropId: root.id, parentSerialNo: root.serial_no };
  const replyTo = collapseAll ? reply?.reply_to_drop : undefined;
  if (replyTo?.serial_no === undefined) {
    return null;
  }
  return { parentDropId: replyTo.id, parentSerialNo: replyTo.serial_no };
}
