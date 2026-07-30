import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  assertPrivateRuntimeFile,
  decodeDestinationsBase64,
  prepareRuntimeFile,
  readDestinationsFile,
  validateDestinationsJson,
} = require("../../scripts/public-review-discussion-destinations.cjs");

const VALID_DESTINATIONS = JSON.stringify({
  staging: {
    "stream-review": "123e4567-e89b-42d3-a456-426614174000",
  },
});

const fixtureRoots: string[] = [];

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "public-review-runtime-"));
  fixtureRoots.push(root);
  return {
    root,
    source: path.join(root, "source.json"),
    destination: path.join(root, "runtime", "destinations.json"),
  };
}

afterEach(() => {
  for (const root of fixtureRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("public-review discussion destination runtime configuration", () => {
  it("decodes, validates, and writes a private runtime file", () => {
    const fixture = createFixture();

    prepareRuntimeFile({
      encodedValue: Buffer.from(VALID_DESTINATIONS).toString("base64"),
      destinationFile: fixture.destination,
    });

    expect(readDestinationsFile(fixture.destination)).toBe(VALID_DESTINATIONS);
    expect(fs.statSync(path.dirname(fixture.destination)).mode & 0o777).toBe(
      0o700
    );
    expect(fs.statSync(fixture.destination).mode & 0o777).toBe(0o600);
    expect(fs.statSync(fixture.destination).uid).toBe(process.getuid?.());
    expect(fs.statSync(fixture.destination).gid).toBe(process.getgid?.());
  });

  it("copies and validates a source file through the same runtime contract", () => {
    const fixture = createFixture();
    fs.writeFileSync(fixture.source, VALID_DESTINATIONS);

    prepareRuntimeFile({
      sourceFile: fixture.source,
      destinationFile: fixture.destination,
    });

    expect(readDestinationsFile(fixture.destination)).toBe(VALID_DESTINATIONS);
  });

  it.each([
    ["empty input", ""],
    ["invalid JSON", "{"],
    [
      "invalid UUID",
      JSON.stringify({ staging: { "stream-review": "not-a-uuid" } }),
    ],
    [
      "production destination",
      JSON.stringify({
        staging: {
          "stream-review": "123e4567-e89b-42d3-a456-426614174000",
        },
        production: {},
      }),
    ],
  ])("rejects %s", (_label, value) => {
    expect(() => validateDestinationsJson(value)).toThrow();
  });

  it("rejects malformed Base64 and unavailable source files", () => {
    const fixture = createFixture();

    expect(() => decodeDestinationsBase64("abc")).toThrow(
      "not valid Base64"
    );
    expect(() => readDestinationsFile(fixture.source)).toThrow("unavailable");
  });

  it("rejects unsafe permissions and ownership", () => {
    const fixture = createFixture();
    prepareRuntimeFile({
      encodedValue: Buffer.from(VALID_DESTINATIONS).toString("base64"),
      destinationFile: fixture.destination,
    });

    fs.chmodSync(fixture.destination, 0o644);
    expect(() => assertPrivateRuntimeFile(fixture.destination)).toThrow(
      "permissions must be 0600"
    );

    fs.chmodSync(fixture.destination, 0o600);
    const uid = process.getuid?.();
    const gid = process.getgid?.();
    if (uid !== undefined && gid !== undefined) {
      expect(() =>
        assertPrivateRuntimeFile(fixture.destination, {
          uid: uid + 1,
          gid,
        })
      ).toThrow("ownership is invalid");
    }
  });
});
