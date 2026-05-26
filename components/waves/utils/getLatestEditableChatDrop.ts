import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";

export function getLatestEditableChatDrop({
  drops,
  waveId,
  connectedProfile,
  isProxyMode,
}: {
  readonly drops: readonly Drop[] | null | undefined;
  readonly waveId: string;
  readonly connectedProfile:
    | Pick<ApiIdentity, "id" | "handle">
    | null
    | undefined;
  readonly isProxyMode: boolean;
}): ExtendedDrop | null {
  if (isProxyMode || !drops?.length || !connectedProfile) {
    return null;
  }

  const connectedProfileId = connectedProfile.id;
  const connectedProfileHandle = connectedProfile.handle;

  if (!connectedProfileId && !connectedProfileHandle) {
    return null;
  }

  let latestDrop: ExtendedDrop | null = null;

  for (const drop of drops) {
    if (
      drop.type !== DropSize.FULL ||
      drop.id.startsWith("temp-") ||
      drop.drop_type !== ApiDropType.Chat ||
      drop.wave.id !== waveId
    ) {
      continue;
    }

    const isAuthor =
      (!!connectedProfileId && drop.author.id === connectedProfileId) ||
      (!!connectedProfileHandle &&
        drop.author.handle === connectedProfileHandle);

    if (!isAuthor) {
      continue;
    }

    if (!latestDrop || drop.serial_no > latestDrop.serial_no) {
      latestDrop = drop;
    }
  }

  return latestDrop;
}
