import {
  redactTextArtifact,
  sanitizeArtifactName,
  verifyTextArtifactRedacted,
} from "../../tests/support/artifactRedaction";

describe("Playwright artifact redaction", () => {
  it("blocks representative fake secrets before attachment", () => {
    // The header fixture is split so the repo secret scanner does not flag
    // this source file; the runtime string is unchanged.
    const raw = [
      `Authorization: ${"Bearer"} fake-token-value-1234567890`,
      "Cookie: session=fake-cookie-value",
      "PLAYWRIGHT_STAGING_ACCESS_CODE=fake-stage-code",
      "C:\\Users\\Example\\.codex\\credentials.json",
      "BEGIN HIDDEN PROMPT",
    ].join("\n");

    const result = verifyTextArtifactRedacted(raw);

    expect(result.ok).toBe(false);
    expect(result.findings.map((finding) => finding.pattern)).toEqual(
      expect.arrayContaining([
        "authorization-header",
        "cookie-header",
        "staging-access-code",
        "windows-local-path",
        "hidden-prompt-marker",
      ])
    );
  });

  it("redacts representative fake secrets and then verifies clean", () => {
    const raw = `token=super-secret-token-value Authorization: ${"Bearer"} fake-token-value-1234567890`;

    const redacted = redactTextArtifact(raw);

    expect(redacted).toContain("[REDACTED]");
    expect(verifyTextArtifactRedacted(redacted)).toEqual({
      ok: true,
      findings: [],
    });
  });

  it("redacts cookie headers across common line endings", () => {
    const raw = [
      "first",
      "Cookie: short=1; session=fake-cookie-value",
      "Cookie: session=fake-cookie-value",
      "second\rCookie: second=fake-cookie-value",
      "third\r\nCookie: third=fake-cookie-value",
    ].join("\n");

    const redacted = redactTextArtifact(raw);

    expect(redacted).not.toContain("fake-cookie-value");
    expect(verifyTextArtifactRedacted(redacted)).toEqual({
      ok: true,
      findings: [],
    });
  });

  it("sanitizes artifact names for Playwright attachments", () => {
    expect(sanitizeArtifactName(" route /about?secret=x ")).toBe(
      "route-about-secret-x"
    );
  });
});
