import yaml from "js-yaml";

export interface DesktopAppVersion {
  readonly name: "windows" | "mac" | "linux";
  readonly displayName: string;
  readonly downloadPath: string;
  readonly image: string;
  readonly version: string;
}

type DesktopAppConfig = Omit<DesktopAppVersion, "version"> & {
  readonly releaseUrl: string;
};

interface LatestRelease {
  readonly version: string;
}

const RELEASE_FETCH_TIMEOUT_MS = 10_000;
const RELEASE_VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z.+-]*$/;

const DESKTOP_APP_CONFIGS: readonly DesktopAppConfig[] = [
  {
    name: "windows",
    releaseUrl:
      "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/win/latest.yml",
    displayName: "Windows",
    downloadPath: "6529-core-app/win/links",
    image: "/windows.png",
  },
  {
    name: "mac",
    releaseUrl:
      "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/mac/latest-mac.yml",
    displayName: "macOS",
    downloadPath: "6529-core-app/mac/links",
    image: "/macos.png",
  },
  {
    name: "linux",
    releaseUrl:
      "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/linux/latest-linux.yml",
    displayName: "Linux",
    downloadPath: "6529-core-app/linux/links",
    image: "/linux.png",
  },
] as const;

function isValidReleaseVersion(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    RELEASE_VERSION_PATTERN.test(value)
  );
}

async function fetchLatestRelease(
  url: string,
  signal?: AbortSignal
): Promise<LatestRelease> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  const timeout = setTimeout(
    () => controller.abort(),
    RELEASE_FETCH_TIMEOUT_MS
  );

  if (signal?.aborted) {
    abort();
  } else {
    signal?.addEventListener("abort", abort, { once: true });
  }

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }

    const release = yaml.load(await response.text()) as unknown;
    const version =
      typeof release === "object" && release !== null && "version" in release
        ? release.version
        : undefined;

    if (!isValidReleaseVersion(version)) {
      throw new Error(`Invalid release version in ${url}`);
    }

    return { version };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export async function fetchDesktopAppVersions(
  signal?: AbortSignal
): Promise<DesktopAppVersion[]> {
  const results = await Promise.allSettled(
    DESKTOP_APP_CONFIGS.map(async (config) => {
      const release = await fetchLatestRelease(config.releaseUrl, signal);

      return {
        name: config.name,
        displayName: config.displayName,
        downloadPath: config.downloadPath,
        image: config.image,
        version: release.version,
      };
    })
  );
  const versions = results.flatMap((result, index) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    console.error(
      `Failed to fetch or process ${DESKTOP_APP_CONFIGS[index]!.displayName} release`,
      result.reason
    );
    return [];
  });

  if (versions.length === 0) {
    throw new Error("No desktop app versions are currently available");
  }

  return versions;
}

export function getDesktopAppDownloadUrl(app: DesktopAppVersion): string {
  if (!isValidReleaseVersion(app.version)) {
    throw new Error("Invalid desktop app version");
  }

  return `https://d3lqz0a4bldqgf.cloudfront.net/${app.downloadPath}/${app.version}.html`;
}
