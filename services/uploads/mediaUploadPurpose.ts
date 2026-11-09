import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import type { ApiReplyToDrop } from "@/generated/models/ApiReplyToDrop";

/**
 * Media for a decision entry keeps the artist's original file. A decision
 * entry is a participatory drop that is not a reply; every other drop is chat,
 * whose media has identifying metadata removed. The API rejects
 * decision-entry media on any other drop.
 */
export function getDropMediaUploadPurpose(drop: {
  readonly drop_type?: ApiDropType | undefined;
  readonly reply_to?: ApiReplyToDrop | undefined;
}): ApiMediaUploadPurpose {
  return drop.drop_type === ApiDropType.Participatory && !drop.reply_to
    ? ApiMediaUploadPurpose.DecisionEntry
    : ApiMediaUploadPurpose.Chat;
}
