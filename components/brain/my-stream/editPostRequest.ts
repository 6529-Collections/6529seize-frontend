import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import type { MessageKey } from "@/i18n/messages";

/**
 * Why a profile curation's "Edit post" link can't open the editor in this
 * wave, as the toast that says so, or null when it can: only the author
 * edits their own post here, and a post with a poll can't be edited while
 * its wave moves to the 6529 Network.
 */
export function editPostRefusal({
  post,
  waveId,
  isProxy,
  connectedProfile,
  pollEditsPaused,
}: {
  readonly post: ApiDrop;
  readonly waveId: string | null;
  readonly isProxy: boolean;
  readonly connectedProfile: Parameters<
    typeof areSameProfileIdentity
  >[0]["right"];
  readonly pollEditsPaused: boolean;
}): MessageKey | null {
  const canEdit =
    post.wave.id === waveId &&
    post.drop_type !== ApiDropType.Participatory &&
    !isProxy &&
    areSameProfileIdentity({ left: post.author, right: connectedProfile });
  if (!canEdit) {
    return "profileCuration.actions.authorOnly";
  }
  return pollEditsPaused && post.poll ? "wavesMove.pollPostLocked" : null;
}
