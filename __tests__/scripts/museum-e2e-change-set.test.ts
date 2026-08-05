const classifier = require("../../scripts/museum-e2e-change-set.cjs");

describe("Museum E2E change-set classifier", () => {
  it.each([
    "app/museum/network/page.tsx",
    "components/museum/MuseumShell.tsx",
    "lib/museum/publication/index.ts",
    "config/museumPublicationEnv.server.ts",
    "i18n/messages/museum.en-US.json",
    "tests/museum/institutional-practice-readonly.spec.ts",
  ])("selects the Museum pack for %s", (file) => {
    expect(classifier.isMuseumOwnedPath(file)).toBe(true);
  });

  it.each([
    "app/tools/page.tsx",
    "components/museums/MuseumShell.tsx",
    "lib/museum-adjacent.ts",
    "tests/museum-adjacent.spec.ts",
  ])("omits the Museum pack for %s", (file) => {
    expect(classifier.isMuseumOwnedPath(file)).toBe(false);
  });

  it("fails closed when the range is invalid or Git cannot classify it", () => {
    expect(classifier.classifyGitRange("", "").required).toBe(true);
    const result = classifier.classifyGitRange(
      "a".repeat(40),
      "b".repeat(40),
      () => ({ status: 128, stdout: Buffer.alloc(0) })
    );
    expect(result.required).toBe(true);
    expect(
      classifier.classifyGitRange("a".repeat(40), "b".repeat(40), () => ({
        status: 0,
      })).required
    ).toBe(true);
  });

  it("classifies the complete NUL-delimited tree diff", () => {
    const spawn = jest.fn(() => ({
      status: 0,
      stdout: Buffer.from("app/tools/page.tsx\0lib/museum/records.ts\0"),
    }));
    const result = classifier.classifyGitRange(
      "a".repeat(40),
      "b".repeat(40),
      spawn
    );
    expect(result.required).toBe(true);
    expect(result.files).toEqual([
      "app/tools/page.tsx",
      "lib/museum/records.ts",
    ]);
  });

  it("omits Museum E2E when the proved range contains only unrelated files", () => {
    const result = classifier.classifyGitRange(
      "a".repeat(40),
      "b".repeat(40),
      () => ({
        status: 0,
        stdout: Buffer.from(".github/workflows/production-e2e.yml\0"),
      })
    );
    expect(result.required).toBe(false);
  });
});
