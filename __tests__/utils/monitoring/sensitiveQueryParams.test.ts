import { redactSensitiveQueryParams } from "@/utils/monitoring/sensitiveQueryParams";

const SYNTHETIC_SECRET = "synthetic-secret-value";

describe("redactSensitiveQueryParams", () => {
  it("redacts connection-link credentials but keeps the URL shape", () => {
    expect(
      redactSensitiveQueryParams(
        `https://6529.io/accept-connection-sharing?token=${SYNTHETIC_SECRET}&address=0x1&role=user#top`
      )
    ).toBe(
      "https://6529.io/accept-connection-sharing?token=[Filtered]&address=0x1&role=user#top"
    );
    expect(
      redactSensitiveQueryParams(
        `/accept-connection-sharing?address=0x1&connection_share_code=${SYNTHETIC_SECRET}`
      )
    ).toBe(
      "/accept-connection-sharing?address=0x1&connection_share_code=[Filtered]"
    );
  });

  it("redacts credential-like names inside free text and stack lines", () => {
    const text = [
      `Error: failed at https://6529.io/x?refresh_token=${SYNTHETIC_SECRET} (see log)`,
      `    at https://6529.io/y?api_key=${SYNTHETIC_SECRET}&page=2:1:10`,
      `"https://6529.io/z?client_secret=${SYNTHETIC_SECRET}"`,
    ].join("\n");

    const redacted = redactSensitiveQueryParams(text);

    expect(redacted).not.toContain(SYNTHETIC_SECRET);
    expect(redacted).toContain("?refresh_token=[Filtered] (see log)");
    expect(redacted).toContain("?api_key=[Filtered]&page=2:1:10");
    expect(redacted).toContain('?client_secret=[Filtered]"');
  });

  it("leaves ordinary query parameters and text unchanged", () => {
    const value =
      "https://6529.io/the-memes/1?focus=live&address=0x1 and token= alone";
    expect(redactSensitiveQueryParams(value)).toBe(value);
  });

  it("over-redacts trailing punctuation rather than leaking part of a value", () => {
    expect(
      redactSensitiveQueryParams(`(see /a?token=${SYNTHETIC_SECRET}) next`)
    ).toBe("(see /a?token=[Filtered] next");
  });
  it("is idempotent", () => {
    const once = redactSensitiveQueryParams(`/a?token=${SYNTHETIC_SECRET}`);
    expect(redactSensitiveQueryParams(once)).toBe(once);
  });
});
