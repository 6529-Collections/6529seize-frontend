import yaml from "js-yaml";

export type DesktopPlatform = "windows" | "mac" | "linux";
export type DesktopFileLabel =
  | "x64"
  | "arm64"
  | "appleSilicon"
  | "intel"
  | "appImage"
  | "debian"
  | "redHat";
export interface DesktopDownload {
  readonly fileName: string;
  readonly label: DesktopFileLabel;
  readonly format: "EXE" | "DMG" | ".AppImage" | ".deb" | ".rpm";
  readonly url: string;
  readonly arweaveUrl?: string | undefined;
}
export interface DesktopRelease {
  readonly version: string;
  readonly legacyMac: boolean;
  readonly minimumMacOS?: number | undefined;
  readonly downloads: readonly DesktopDownload[];
}
export interface DesktopAppVersion {
  readonly name: DesktopPlatform;
  readonly displayName: string;
  readonly image: string;
  readonly releases: readonly DesktopRelease[];
  readonly hasUnavailableRelease: boolean;
}
interface DesktopAppConfig {
  readonly name: DesktopPlatform;
  readonly displayName: string;
  readonly image: string;
  readonly directory: "win" | "mac" | "linux";
  readonly manifest: string;
}

const S3_BASE = "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app";
const DOWNLOAD_BASE = "https://d3lqz0a4bldqgf.cloudfront.net/6529-core-app";
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const DESKTOP_APP_CONFIGS: readonly DesktopAppConfig[] = [
  {
    name: "windows",
    displayName: "Windows",
    directory: "win",
    image: "/windows.png",
    manifest: "latest.yml",
  },
  {
    name: "mac",
    displayName: "macOS",
    directory: "mac",
    image: "/macos.png",
    manifest: "latest-mac.yml",
  },
  {
    name: "linux",
    displayName: "Linux",
    directory: "linux",
    image: "/linux.png",
    manifest: "latest-linux.yml",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function fetchText(
  url: string,
  signal?: AbortSignal,
  timeoutMs = 10_000
): Promise<string> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok)
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

function describeFile(
  name: string,
  config: DesktopAppConfig,
  version: string
): Pick<DesktopDownload, "label" | "format"> | null {
  // Only same-version, plain artifact filenames from the trusted platform feed
  // can become download URLs. ZIPs are updater/build artifacts, not UI choices.
  const prefix = `6529-DESKTOP-${config.directory}-`;
  if (!name.startsWith(prefix)) return null;
  const suffix = name.slice(prefix.length);
  if (config.name === "windows") {
    if (suffix === `x64-${version}.exe`) return { label: "x64", format: "EXE" };
    if (suffix === `arm64-${version}.exe`)
      return { label: "arm64", format: "EXE" };
  } else if (config.name === "mac") {
    if (suffix === `arm64-${version}.dmg`)
      return { label: "appleSilicon", format: "DMG" };
    if (suffix === `x64-${version}.dmg`)
      return { label: "intel", format: "DMG" };
  } else return describeLinuxFile(suffix, version);
  return null;
}

function describeLinuxFile(
  suffix: string,
  version: string
): Pick<DesktopDownload, "label" | "format"> | null {
  if (
    suffix === `x86_64-${version}.AppImage` ||
    suffix === `x64-${version}.AppImage`
  )
    return { label: "appImage", format: ".AppImage" };
  if (suffix === `amd64-${version}.deb` || suffix === `x64-${version}.deb`)
    return { label: "debian", format: ".deb" };
  if (suffix === `x86_64-${version}.rpm` || suffix === `x64-${version}.rpm`)
    return { label: "redHat", format: ".rpm" };
  return null;
}

function parseRelease(
  text: string,
  config: DesktopAppConfig,
  legacyMac: boolean
): DesktopRelease {
  const data: unknown = yaml.load(text);
  if (
    !isRecord(data) ||
    typeof data["version"] !== "string" ||
    !VERSION_PATTERN.test(data["version"]) ||
    !Array.isArray(data["files"])
  ) {
    throw new Error("Invalid desktop release manifest");
  }
  const version = data["version"];
  let minimumMacOS: number | undefined;
  if (config.name === "mac") {
    if (
      typeof data["minimumSystemVersion"] !== "string" ||
      !/^\d+\.\d+\.\d+$/.test(data["minimumSystemVersion"])
    )
      throw new Error("Missing Mac OS requirement");
    minimumMacOS = Number(data["minimumSystemVersion"].split(".")[0]) - 9;
    if (legacyMac ? minimumMacOS !== 12 : minimumMacOS < 13)
      throw new Error("Invalid Mac OS requirement");
  }
  const files = new Map<string, DesktopDownload>();
  for (const file of data["files"]) {
    if (!isRecord(file) || typeof file["url"] !== "string") continue;
    const description = describeFile(file["url"], config, version);
    if (!description) continue;
    files.set(file["url"], {
      fileName: file["url"],
      ...description,
      url: `${DOWNLOAD_BASE}/${config.directory}/${file["url"]}`,
    });
  }
  if (files.size === 0)
    throw new Error("No supported desktop installers in manifest");
  const order: readonly DesktopFileLabel[] = [
    "x64",
    "arm64",
    "appleSilicon",
    "intel",
    "appImage",
    "debian",
    "redHat",
  ];
  return {
    version,
    legacyMac,
    minimumMacOS,
    downloads: [...files.values()].sort(
      (a, b) => order.indexOf(a.label) - order.indexOf(b.label)
    ),
  };
}

async function addMirrors(
  release: DesktopRelease,
  config: DesktopAppConfig,
  signal?: AbortSignal
): Promise<DesktopRelease> {
  try {
    const catalog: unknown = JSON.parse(
      await fetchText(
        `${S3_BASE}/${config.directory}/links/${release.version}.json`,
        signal,
        3_000
      )
    );
    if (
      !isRecord(catalog) ||
      catalog["version"] !== release.version ||
      !Array.isArray(catalog["files"])
    )
      return release;
    const mirrors = new Map<string, string>();
    for (const file of catalog["files"]) {
      if (
        isRecord(file) &&
        typeof file["url"] === "string" &&
        typeof file["arweaveUrl"] === "string" &&
        /^https:\/\/arweave\.net\/[A-Za-z0-9_-]{43}$/.test(file["arweaveUrl"])
      )
        mirrors.set(file["url"], file["arweaveUrl"]);
    }
    return {
      ...release,
      downloads: release.downloads.map((file) => ({
        ...file,
        arweaveUrl: mirrors.get(file.fileName),
      })),
    };
  } catch {
    // Optional mirrors must never hide primary downloads. Cancellation of the
    // whole query is propagated after all platform requests settle.
    return release;
  }
}

async function fetchRelease(
  config: DesktopAppConfig,
  legacyMac: boolean,
  signal?: AbortSignal
): Promise<DesktopRelease> {
  const manifest = legacyMac ? "latest-macos-12.yml" : config.manifest;
  const release = parseRelease(
    await fetchText(`${S3_BASE}/${config.directory}/${manifest}`, signal),
    config,
    legacyMac
  );
  return addMirrors(release, config, signal);
}

export async function fetchDesktopAppVersions(
  signal?: AbortSignal
): Promise<DesktopAppVersion[]> {
  const results = await Promise.all(
    DESKTOP_APP_CONFIGS.map(async (config) => {
      const settled = await Promise.allSettled(
        config.name === "mac"
          ? [
              fetchRelease(config, false, signal),
              fetchRelease(config, true, signal),
            ]
          : [fetchRelease(config, false, signal)]
      );
      return {
        name: config.name,
        displayName: config.displayName,
        image: config.image,
        hasUnavailableRelease: settled.some(
          (result) => result.status === "rejected"
        ),
        releases: settled.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : []
        ),
      };
    })
  );
  if (signal?.aborted)
    throw (
      signal.reason ??
      new DOMException("The operation was aborted", "AbortError")
    );
  if (results.every((app) => app.releases.length === 0))
    throw new Error("No desktop app versions are currently available");
  return results;
}
