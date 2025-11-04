import { buildTooltipId } from "@/helpers/tooltip.helpers";

describe("buildTooltipId", () => {
  it("returns fallback id when no parts are provided", () => {
    expect(buildTooltipId()).toBe("tooltip");
  });

  it("keeps ids unchanged when all characters are valid", () => {
    expect(buildTooltipId("metadata", "valid-id")).toBe("metadata-valid-id");
  });

  it("produces deterministic unique ids when sanitized values would collide", () => {
    const first = buildTooltipId(
      "metadata",
      "label",
      "https://example.com/foo-bar",
    );
    const second = buildTooltipId(
      "metadata",
      "label",
      "https://example.com/foo?bar",
    );

    expect(first).toMatch(
      /^metadata-label-https-example-com-foo-bar-[0-9a-z]+$/,
    );
    expect(second).toMatch(
      /^metadata-label-https-example-com-foo-bar-[0-9a-z]+$/,
    );
    expect(first).not.toBe(second);
    expect(first).toBe(
      buildTooltipId("metadata", "label", "https://example.com/foo-bar"),
    );
  });
});
