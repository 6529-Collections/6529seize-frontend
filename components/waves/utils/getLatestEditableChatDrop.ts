import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { isDropEditableAt } from "@/helpers/waves/drop-editability.helpers";
import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";

const normalizeHandle = (handle: string | null | undefined): string | null => {
  const normalizedHandle = handle?.trim().replace(/^@/, "").toLowerCase();
  return normalizedHandle ? normalizedHandle : null;
};

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
  const connectedProfileHandle = normalizeHandle(connectedProfile.handle);

  if (!connectedProfileId && !connectedProfileHandle) {
    return null;
  }

  let latestDrop: ExtendedDrop | null = null;

  const now = Date.now();
  for (const drop of drops) {
    if (
      drop.type !== DropSize.FULL ||
      drop.id.startsWith("temp-") ||
      drop.drop_type !== ApiDropType.Chat ||
      drop.wave.id !== waveId ||
      // The API rejects edits after the drop's edit window; skip drops the
      // arrow-up shortcut could no longer actually edit.
      !isDropEditableAt({ editableUntil: drop.editable_until, atMillis: now })
    ) {
      continue;
    }

    const isAuthor =
      (!!connectedProfileId && drop.author.id === connectedProfileId) ||
      (!!connectedProfileHandle &&
        normalizeHandle(drop.author.handle) === connectedProfileHandle);

    if (!isAuthor) {
      continue;
    }

    if (!latestDrop || drop.serial_no > latestDrop.serial_no) {
      latestDrop = drop;
    }
  }

  return latestDrop;
}
