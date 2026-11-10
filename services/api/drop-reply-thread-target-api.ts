import type { ApiDropV2PageWithoutCount } from "@/generated/models/ApiDropV2PageWithoutCount";
import { commonApiFetch } from "@/services/api/common-api";

export interface DropReplyThreadTarget {
  readonly parentDropId: string;
  readonly parentSerialNo: number;
  readonly replySerialNo: number;
}

/** A collapsed reply has a thread root and a separate message to reveal. */
export async function fetchDropReplyThreadTarget({
  waveId,
  serialNo,
  collapseAll = true,
  signal,
}: {
  readonly waveId: string;
  readonly serialNo: number;
  readonly collapseAll?: boolean;
  readonly signal?: AbortSignal | undefined;
}): Promise<DropReplyThreadTarget | null> {
  const seen = new Set<number>();
  let lookupSerialNo = serialNo;
  while (!seen.has(lookupSerialNo)) {
    seen.add(lookupSerialNo);
    const response = await commonApiFetch<ApiDropV2PageWithoutCount>({
      endpoint: "v2/drops",
      params: {
        serial_nos: lookupSerialNo.toString(),
        page_size: "1",
      },
      signal,
    });
    const drop = response.data[0];
    if (!drop || drop.wave?.id !== waveId) return null;

    const root = drop.collapsed_reply_thread;
    if (root) {
      return {
        parentDropId: root.id,
        parentSerialNo: root.serial_no,
        replySerialNo: serialNo,
      };
    }

    // Older APIs only provide the immediate parent in wave-wide collapse.
    if (!collapseAll) return null;
    if (!drop.reply_to_drop) {
      return lookupSerialNo === serialNo
        ? null
        : {
            parentDropId: drop.id,
            parentSerialNo: lookupSerialNo,
            replySerialNo: serialNo,
          };
    }
    if (drop.reply_to_drop.serial_no === undefined) return null;
    lookupSerialNo = drop.reply_to_drop.serial_no;
  }
  return null;
}
