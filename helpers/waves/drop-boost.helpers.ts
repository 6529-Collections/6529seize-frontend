import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areHandlesEqual } from "@/helpers/waves/chat-link-restriction.helpers";
import type { ApiWaveMinWithChatLinkSettings } from "@/helpers/waves/wave.helpers";

type DropBoostIdentity = Pick<ApiIdentity, "id" | "handle">;
type DropBoostDrop = Pick<ApiDrop, "author" | "wave">;

const isDropAuthoredByConnectedProfile = ({
  drop,
  connectedProfile,
}: {
  readonly drop: DropBoostDrop;
  readonly connectedProfile: DropBoostIdentity | null | undefined;
}): boolean =>
  Boolean(
    connectedProfile &&
    ((!!connectedProfile.id && connectedProfile.id === drop.author.id) ||
      areHandlesEqual(connectedProfile.handle, drop.author.handle))
  );

const isConnectedProfileWaveCreator = ({
  drop,
  connectedProfile,
}: {
  readonly drop: DropBoostDrop;
  readonly connectedProfile: DropBoostIdentity;
}): boolean => {
  const wave = drop.wave as ApiWaveMinWithChatLinkSettings;
  return areHandlesEqual(connectedProfile.handle, wave.wave_author_handle);
};

export const canShowDropBoostAction = ({
  drop,
  connectedProfile,
}: {
  readonly drop: DropBoostDrop;
  readonly connectedProfile: DropBoostIdentity | null | undefined;
}): boolean => {
  if (!connectedProfile) {
    return false;
  }

  if (!isDropAuthoredByConnectedProfile({ drop, connectedProfile })) {
    return true;
  }

  if (drop.wave.authenticated_user_admin === true) {
    return true;
  }

  return isConnectedProfileWaveCreator({ drop, connectedProfile });
};
