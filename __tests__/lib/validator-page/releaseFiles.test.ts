/** @jest-environment node */
import { parseReleaseFeed } from "@/lib/validator-page/releaseFeed";
import {
  formatFileSize,
  getDebNames,
  getReleaseDownloadPath,
  groupReleaseFiles,
  listReleaseFiles,
  shortCommit,
} from "@/lib/validator-page/releaseFiles";
import { TEST_RELEASE_ENTRY } from "./fixtures";

describe("groupReleaseFiles", () => {
  const [release] = parseReleaseFeed({ releases: [TEST_RELEASE_ENTRY] });

  it("gives each system its own button, in a fixed order", () => {
    const groups = groupReleaseFiles(release!);
    expect(
      groups.installers.map((item) => [item.kind, item.file.name])
    ).toEqual([
      ["macos", "6529-Validator-0.1.0.dmg"],
      ["windows", "6529-Validator-Setup-0.1.0-x64.exe"],
      ["deb-x64", "6529-validator_0.1.0_amd64.deb"],
      ["deb-arm64", "6529-validator_0.1.0_arm64.deb"],
      ["appimage", "6529-Validator-0.1.0-x86_64.AppImage"],
    ]);
    expect(groups.installers[0]?.publisher).toBe("6529 Collection LLC");
    expect(groups.installers[0]?.publisherNote).toBe("notarized by Apple");
    expect(groups.installers[1]?.publisher).toBe("6529 Collection LLC");
    expect(groups.installers[1]?.publisherNote).toBeNull();
    expect(groups.installers[2]?.publisher).toBeNull();
    expect(groups.installers.map((item) => item.summary)).toEqual([
      "macOS 11 or newer · Apple silicon or Intel",
      "Windows 10 or 11 · 64-bit",
      "Ubuntu 22.04, Debian 12 or newer · Intel or AMD",
      "Raspberry Pi 4 or 5, other ARM64 · 64-bit OS",
      "Other Linux desktops · runs only while open",
    ]);
  });

  it("sorts the other files by system and finds the checksums", () => {
    const groups = groupReleaseFiles(release!);
    expect(groups.archives.map((item) => item.title)).toEqual([
      "Windows .msi, x86-64",
      "Mac archive, Apple silicon",
      "Windows archive, x86-64",
      "Linux archive, x86-64",
    ]);
    expect(groups.checksums?.name).toBe("SHA256SUMS");
    expect(groups.releaseJson?.name).toBe("release.json");
  });

  it("gives the Windows button to the .msi when a release has no Setup.exe", () => {
    const [withoutSetup] = parseReleaseFeed({
      releases: [
        {
          ...TEST_RELEASE_ENTRY,
          files: TEST_RELEASE_ENTRY.files.filter(
            (file) => !file.name.includes("Setup")
          ),
        },
      ],
    });
    const groups = groupReleaseFiles(withoutSetup!);
    expect(
      groups.installers.find((item) => item.kind === "windows")?.file.name
    ).toBe("6529-Validator-0.1.0-x64.msi");
    expect(
      groups.installers.find((item) => item.kind === "windows")?.what
    ).toBe("Installer (.msi)");
    expect(groups.archives.map((item) => item.title)).not.toContain(
      "Windows .msi, x86-64"
    );
  });

  it("lists every file but SHA256SUMS for the table, installers first", () => {
    const entries = listReleaseFiles(release!);
    expect(entries.map((entry) => entry.file.name)).toEqual([
      "6529-Validator-0.1.0.dmg",
      "6529-Validator-Setup-0.1.0-x64.exe",
      "6529-validator_0.1.0_amd64.deb",
      "6529-validator_0.1.0_arm64.deb",
      "6529-Validator-0.1.0-x86_64.AppImage",
      "6529-Validator-0.1.0-x64.msi",
      "validator-0.1.0-aarch64-apple-darwin.tar.gz",
      "validator-0.1.0-x86_64-pc-windows-msvc.zip",
      "validator-0.1.0-x86_64-unknown-linux-gnu.tar.gz",
      "release.json",
    ]);
    expect(
      entries.map((entry) => [entry.system, entry.cpu, entry.publisher])
    ).toContainEqual(["Linux", "ARM64", null]);
  });

  // rc.8 carries lyrebird, which is under the GPL: its source goes beside
  // the downloads.
  it("lists lyrebird's source after the archives, as a file for any system", () => {
    const source = {
      name: "lyrebird-0.9.0-source.tar.gz",
      size: 66_587_930,
      sha256: "d".repeat(64),
    };
    const [withSource] = parseReleaseFeed({
      releases: [
        {
          ...TEST_RELEASE_ENTRY,
          files: [source, ...TEST_RELEASE_ENTRY.files],
        },
      ],
    });
    const groups = groupReleaseFiles(withSource!);
    expect(groups.installers.map((item) => item.file.name)).not.toContain(
      source.name
    );
    expect(groups.archives.at(-1)).toMatchObject({
      title: "lyrebird source code",
      system: "Any",
      cpu: "",
      what: "Source of lyrebird, Tor's bridge program in the validator (GPL 3.0 or later)",
      publisher: null,
    });
    expect(
      listReleaseFiles(withSource!)
        .slice(-2)
        .map((entry) => entry.file.name)
    ).toEqual([source.name, "release.json"]);
  });

  it("names only a well-formed lyrebird source file", () => {
    const [odd] = parseReleaseFeed({
      releases: [
        {
          ...TEST_RELEASE_ENTRY,
          files: [
            { name: "lyrebird-.-source.tar.gz", sha256: "d".repeat(64) },
            { name: "lyrebird-1..2-source.tar.gz", sha256: "e".repeat(64) },
          ],
        },
      ],
    });
    expect(groupReleaseFiles(odd!).archives.map((item) => item.what)).toEqual([
      "Other file",
      "Other file",
    ]);
  });

  it("names both .deb files for the Linux command, or none", () => {
    expect(getDebNames(release)).toEqual({
      x64: "6529-validator_0.1.0_amd64.deb",
      arm64: "6529-validator_0.1.0_arm64.deb",
    });
    expect(getDebNames(undefined)).toBeNull();
  });

  it("builds download paths and labels", () => {
    expect(
      getReleaseDownloadPath(release!, { name: "6529-Validator-0.1.0.dmg" })
    ).toBe("/validator/download/0.1.0-test.2/6529-Validator-0.1.0.dmg");
    expect(formatFileSize(55_073_145)).toBe("55.1 MB");
    expect(formatFileSize(1_119)).toBe("1 kB");
    expect(formatFileSize(null)).toBeNull();
    expect(shortCommit("abcdef0123456789")).toBe("abcdef0");
  });
});
