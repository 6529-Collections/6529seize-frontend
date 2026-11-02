/** @jest-environment node */
import { parseReleaseFeed } from "@/lib/validator-page/releaseFeed";
import {
  formatFileSize,
  getReleaseDownloadPath,
  groupReleaseFiles,
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
    expect(groups.installers[0]?.signing).toContain("notarized");
    expect(groups.installers[1]?.signing).toContain("6529 Collection LLC");
  });

  it("puts the archives under other downloads and finds the checksums", () => {
    const groups = groupReleaseFiles(release!);
    expect(groups.archives.map((item) => item.title)).toEqual([
      "Windows, .msi installer",
      "macOS, Apple silicon",
      "Windows, x64",
      "Linux, x64",
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
    expect(groups.archives.map((item) => item.title)).not.toContain(
      "Windows, .msi installer"
    );
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
