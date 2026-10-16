import { shouldLoadMemeCollaboration } from "@/components/waves/memes/collaborations/shouldLoadMemeCollaboration";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { ApiDropType } from "@/generated/models/ApiDropType";
it("loads invitation eligibility for old unmanaged artwork", () => {
  const drop_type = ApiDropType.Participatory;
  expect(
    shouldLoadMemeCollaboration({
      drop_type,
      metadata: [{ data_key: "memeName", data_value: "GM" }],
    })
  ).toBe(true);
});
it("does not load controls for restricted artwork or ordinary chat", () => {
  const metadata = [{ data_key: "memeName", data_value: "GM" }];
  expect(
    shouldLoadMemeCollaboration({
      drop_type: ApiDropType.Participatory,
      metadata,
      moderation: {
        can_view: false,
        status: ApiDropModerationStatus.ModeratorRemoved,
      },
    })
  ).toBe(false);
  expect(
    shouldLoadMemeCollaboration({ drop_type: ApiDropType.Chat, metadata })
  ).toBe(false);
});

it("loads pending invitations for lightweight submissions before metadata or credits are present", () => {
  expect(
    shouldLoadMemeCollaboration({ drop_type: ApiDropType.Participatory })
  ).toBe(true);
});
