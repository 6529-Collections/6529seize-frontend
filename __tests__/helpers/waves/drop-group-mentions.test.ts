import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import {
  getMentionedGroupsFromParts,
  getMentionedGroupsFromText,
} from "@/helpers/waves/drop-group-mentions";

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

  it("detects permission-derived mentions case-insensitively", () => {
    expect(
      getMentionedGroupsFromText(
        "Hi @Contributors @ADMINS and @DeVs6529",
        false
      )
    ).toEqual([
      ApiDropGroupMention.Contributors,
      ApiDropGroupMention.Admins,
      ApiDropGroupMention.Devs6529,
    ]);
  });

  it("does not match embedded global mention names", () => {
    expect(
      getMentionedGroupsFromText(
        "@contributors_team hello@admins @devs6529extra",
        true
      )
    ).toEqual([]);
  });

  it("keeps @all restricted while returning other metadata", () => {
    expect(
      getMentionedGroupsFromParts(
        [
          {
            mentioned_groups: [
              ApiDropGroupMention.All,
              ApiDropGroupMention.Contributors,
            ],
          },
        ],
        false
      )
    ).toEqual([ApiDropGroupMention.Contributors]);
  });
});
