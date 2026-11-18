/** @jest-environment node */
import { parseAiReleaseFeed } from "@/lib/ai-page/releaseFeed";
import {
  describeCodeSignature,
  groupAiReleaseFiles,
} from "@/lib/ai-page/releaseFiles";

import { AI_TEST_FEED, aiFeedEntry, MAC_SIGNER } from "./fixtures";

const FORMAT = "6529-ai-releases/1";

describe("parseAiReleaseFeed", () => {
  it("reads the format's fields, newest version first", () => {
    const releases = parseAiReleaseFeed(AI_TEST_FEED);
    expect(releases?.map((release) => release.version)).toEqual([
      "0.1.0",
      "0.1.0-rc.1",
    ]);
    const [newest] = releases!;
    expect(newest).toMatchObject({
      version: "0.1.0",
      date: "2026-11-17",
      commit: "c".repeat(40),
      channel: "test",
      notes: "Made-up notes for 0.1.0.",
    });
    expect(newest!.files).toHaveLength(11);
    expect(newest!.files[0]).toEqual({
      name: "6529-ai-0.1.0-macos-arm64.dmg",
      system: "macos-arm64",
      sha256: "1".repeat(64),
      size: 95_453_096,
      signed: MAC_SIGNER,
    });
    expect(
      newest!.files.find((file) => file.name === "SHA256SUMS")
    ).toMatchObject({ system: null, signed: null });
  });

  it("orders versions as Semantic Versioning does, not by date or place", () => {
    const releases = parseAiReleaseFeed({
      format: FORMAT,
      releases: [
        aiFeedEntry("0.1.0-rc.9", "2026-11-20"),
        aiFeedEntry("0.1.0-rc.10", "2026-11-01"),
        aiFeedEntry("0.1.0", "2026-11-01"),
        aiFeedEntry("0.1.1-rc.1", "2026-10-01"),
      ],
    });
    expect(releases?.map((release) => release.version)).toEqual([
      "0.1.1-rc.1",
      "0.1.0",
      "0.1.0-rc.10",
      "0.1.0-rc.9",
    ]);
  });

  it("reads a feed in another format, or no feed, as unreadable", () => {
    expect(parseAiReleaseFeed({ ...AI_TEST_FEED, format: 1 })).toBeNull();
    expect(
      parseAiReleaseFeed({ ...AI_TEST_FEED, format: "6529-ai-releases/2" })
    ).toBeNull();
    expect(parseAiReleaseFeed([aiFeedEntry("0.1.0")])).toBeNull();
    expect(parseAiReleaseFeed(null)).toBeNull();
    expect(parseAiReleaseFeed({ format: FORMAT })).toEqual([]);
  });

  it("leaves out releases it cannot use, and duplicates", () => {
    const good = aiFeedEntry("0.1.0");
    const releases = parseAiReleaseFeed({
      format: FORMAT,
      releases: [
        { ...good, version: "0.1" },
        { ...good, version: "v0.1.0" },
        { ...good, version: "0.1.0+build" },
        { ...good, version: "0.2.0", date: "17 November" },
        { ...good, version: "0.3.0", date: undefined },
        { ...good, version: "0.4.0", channel: "" },
        "0.5.0",
        good,
        { ...good, notes: "A duplicate." },
      ],
    });
    expect(releases?.map((release) => release.version)).toEqual(["0.1.0"]);
    expect(releases?.[0]?.notes).toBe("Made-up notes for 0.1.0.");
  });

  it("leaves out files whose name could leave the release's folder", () => {
    const entry = aiFeedEntry("0.1.0");
    const file = entry.files[0]!;
    const releases = parseAiReleaseFeed({
      format: FORMAT,
      releases: [
        {
          ...entry,
          files: [
            { ...file, name: "../feed/releases.json" },
            { ...file, name: "a/b.dmg" },
            { ...file, name: "a\\b.dmg" },
            { ...file, name: "a..dmg" },
            { ...file, name: ".hidden" },
            { ...file, name: "line\nbreak.dmg" },
            { ...file, name: "short-hash.dmg", sha256: "abc" },
            { ...file, name: "ok.dmg", sha256: "A".repeat(64) },
            { ...file, name: "ok.dmg", sha256: "d".repeat(64) },
            // Debian writes a pre-release version with a tilde.
            { ...file, name: "6529-ai_0.1.0~rc.1_amd64.deb" },
          ],
        },
      ],
    });
    expect(releases?.[0]?.files).toEqual([
      { ...file, name: "ok.dmg", sha256: "a".repeat(64) },
      { ...file, name: "6529-ai_0.1.0~rc.1_amd64.deb" },
    ]);
  });

  it("keeps a file with a system it doesn't know as a file with no system", () => {
    const entry = aiFeedEntry("0.1.0");
    const file = { ...entry.files[0]!, system: "macos-x64", signed: 7 };
    const releases = parseAiReleaseFeed({
      format: FORMAT,
      releases: [{ ...entry, files: [file] }],
    });
    expect(releases?.[0]?.files[0]).toMatchObject({
      system: null,
      signed: null,
    });
  });

  it("drops notes and publishers that hold control characters", () => {
    const entry = aiFeedEntry("0.1.0");
    const releases = parseAiReleaseFeed({
      format: FORMAT,
      releases: [
        {
          ...entry,
          notes: "Two lines.\r\nSecond.",
          files: [{ ...entry.files[0]!, signed: "6529\u0007 Collection LLC" }],
        },
        { ...aiFeedEntry("0.0.9"), notes: "Bell\u0007." },
      ],
    });
    expect(releases?.[0]?.notes).toBe("Two lines.\nSecond.");
    expect(releases?.[0]?.files[0]?.signed).toBeNull();
    expect(releases?.[1]?.notes).toBeNull();
  });
});

describe("groupAiReleaseFiles", () => {
  it("makes one button per package and groups every file by system", () => {
    const [release] = parseAiReleaseFeed(AI_TEST_FEED)!;
    const { installers, groups } = groupAiReleaseFiles(release!);
    expect(
      installers.map((installer) => [installer.kind, installer.file.name])
    ).toEqual([
      ["macos", "6529-ai-0.1.0-macos-arm64.dmg"],
      ["windows", "6529-ai-0.1.0-windows-x64-setup.exe"],
      ["linux-x64", "6529-ai_0.1.0_amd64.deb"],
      ["linux-x64-cuda", "6529-ai-cuda_0.1.0_amd64.deb"],
      ["linux-arm64", "6529-ai_0.1.0_arm64.deb"],
    ]);
    expect(
      groups.map((group) => [
        group.family,
        group.entries.map((entry) => entry.file.name),
      ])
    ).toEqual([
      ["mac", ["6529-ai-0.1.0-macos-arm64.dmg"]],
      ["windows", ["6529-ai-0.1.0-windows-x64-setup.exe"]],
      [
        "linux",
        [
          "6529-ai_0.1.0_amd64.deb",
          "6529-ai-cuda_0.1.0_amd64.deb",
          "6529-ai_0.1.0_arm64.deb",
          // The archives in the buttons' order: x86-64, CUDA, ARM64.
          "6529-ai-0.1.0-linux-x86_64-cpu.tar.gz",
          "6529-ai-0.1.0-linux-x86_64-cuda.tar.gz",
          "6529-ai-0.1.0-linux-arm64-cpu.tar.gz",
        ],
      ],
      ["checks", ["SHA256SUMS", "SHA256SUMS.sig", "manifest.json"]],
    ]);
  });
});

describe("describeCodeSignature", () => {
  it("reads who signed a file and whether Apple notarized it", () => {
    expect(
      describeCodeSignature(
        "Developer ID Application: 6529 Collection LLC, notarized by Apple"
      )
    ).toEqual({ signer: "6529 Collection LLC", notarized: true });
    expect(
      describeCodeSignature("Developer ID Application: 6529 Collection LLC")
    ).toEqual({ signer: "6529 Collection LLC", notarized: false });
    expect(describeCodeSignature("6529 Collection LLC")).toEqual({
      signer: "6529 Collection LLC",
      notarized: false,
    });
    expect(describeCodeSignature(null)).toEqual({
      signer: null,
      notarized: false,
    });
  });
});
