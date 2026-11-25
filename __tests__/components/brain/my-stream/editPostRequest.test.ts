import { editPostRefusal } from "@/components/brain/my-stream/editPostRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";

const me = { id: "p1", handle: "me" };
const post = (extra: Record<string, unknown> = {}) =>
  ({
    id: "d1",
    drop_type: ApiDropType.Chat,
    author: { id: "p1", handle: "me" },
    wave: { id: "w1" },
    ...extra,
  }) as unknown as ApiDrop;

const refusal = (
  drop: ApiDrop,
  options: { pollEditsPaused?: boolean; isProxy?: boolean } = {}
) =>
  editPostRefusal({
    post: drop,
    waveId: "w1",
    isProxy: options.isProxy ?? false,
    connectedProfile: me,
    pollEditsPaused: options.pollEditsPaused ?? false,
  });

describe("editPostRefusal", () => {
  it("opens the editor for the author's own post", () => {
    expect(refusal(post())).toBeNull();
  });

  it("says why a post with a poll can't be edited while its wave moves", () => {
    expect(refusal(post({ poll: {} }), { pollEditsPaused: true })).toBe(
      "wavesMove.pollPostLocked"
    );
  });

  it("still edits a post with a poll where nothing is paused, as in a wave that stays", () => {
    expect(refusal(post({ poll: {} }))).toBeNull();
  });

  it("keeps a post without a poll editable while waves move", () => {
    expect(refusal(post(), { pollEditsPaused: true })).toBeNull();
  });

  it("leaves someone else's post, an entry, a proxy and another wave to the author line", () => {
    expect(refusal(post({ author: { id: "p2", handle: "you" } }))).toBe(
      "profileCuration.actions.authorOnly"
    );
    expect(refusal(post({ drop_type: ApiDropType.Participatory }))).toBe(
      "profileCuration.actions.authorOnly"
    );
    expect(refusal(post(), { isProxy: true })).toBe(
      "profileCuration.actions.authorOnly"
    );
    expect(refusal(post({ wave: { id: "w2" } }))).toBe(
      "profileCuration.actions.authorOnly"
    );
  });
});
