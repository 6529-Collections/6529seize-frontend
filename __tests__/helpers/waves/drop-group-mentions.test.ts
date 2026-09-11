import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import {
  getMentionedGroupsFromParts,
  getMentionedGroupsFromText,
  markGroupMentionTokens,
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

  it("detects global mentions case-insensitively for admins", () => {
    expect(
      getMentionedGroupsFromText("Hi @Contributors @ADMINS and @DeVs6529", true)
    ).toEqual([
      ApiDropGroupMention.Contributors,
      ApiDropGroupMention.Admins,
      ApiDropGroupMention.Devs6529,
    ]);
    expect(getMentionedGroupsFromText("again @contributors", true)).toEqual([
      ApiDropGroupMention.Contributors,
    ]);
  });

  it("keeps detection stable across repeated multi-paragraph scans", () => {
    const content = [
      "First paragraph for the team.",
      "Second paragraph: @ADMINS can review this.",
      "Third paragraph: @contributors can reply.",
    ].join("\n");
    const expected = [ApiDropGroupMention.Admins];

    expect(getMentionedGroupsFromText(content, false)).toEqual(expected);
    expect(getMentionedGroupsFromText(content, false)).toEqual(expected);
  });

  it("does not match embedded global mention names", () => {
    expect(
      getMentionedGroupsFromText(
        "@contributors_team hello@admins @devs6529extra",
        true
      )
    ).toEqual([]);
    expect(getMentionedGroupsFromText("café@admins", true)).toEqual([]);
  });

  it("marks adjacent mentions of the same group", () => {
    expect(
      markGroupMentionTokens({
        content: "@admins @admins",
        group: ApiDropGroupMention.Admins,
        marker: "**",
      })
    ).toBe("**@admins** **@admins**");
  });

  it("keeps marking stable across repeated calls", () => {
    const params = {
      content: "@admins and @ADMINS",
      group: ApiDropGroupMention.Admins,
      marker: "**",
    };

    expect(markGroupMentionTokens(params)).toBe("**@admins** and **@ADMINS**");
    expect(markGroupMentionTokens(params)).toBe("**@admins** and **@ADMINS**");
  });

  it("filters admin-only broadcast mentions while returning escalation metadata", () => {
    expect(
      getMentionedGroupsFromParts(
        [
          {
            mentioned_groups: [
              ApiDropGroupMention.All,
              ApiDropGroupMention.Contributors,
              ApiDropGroupMention.Admins,
            ],
          },
        ],
        false
      )
    ).toEqual([ApiDropGroupMention.Admins]);
  });
});
