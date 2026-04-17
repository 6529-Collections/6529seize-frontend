import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import { getMentionedGroupsFromParts } from "@/helpers/waves/drop-group-mentions";

describe("drop group mentions", () => {
  it("does not infer group mentions from raw part content", () => {
    const parts: Array<{
      readonly content: string;
      readonly mentioned_groups?: ApiDropGroupMention[];
    }> = [{ content: "@all" }];

    expect(getMentionedGroupsFromParts(parts, true)).toEqual([]);
  });

  it("returns ALL when a part carries explicit group mention metadata", () => {
    expect(
      getMentionedGroupsFromParts(
        [{ mentioned_groups: [ApiDropGroupMention.All] }],
        true
      )
    ).toEqual([ApiDropGroupMention.All]);
  });
});
