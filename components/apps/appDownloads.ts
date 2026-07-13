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

async function fetchLatestRelease(url: string): Promise<LatestRelease> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return yaml.load(await response.text()) as LatestRelease;
}

export async function fetchDesktopAppVersions(): Promise<DesktopAppVersion[]> {
  const results = await Promise.allSettled(
    DESKTOP_APP_CONFIGS.map(async (config) => {
      const release = await fetchLatestRelease(config.releaseUrl);

      return {
        name: config.name,
        displayName: config.displayName,
        downloadPath: config.downloadPath,
        image: config.image,
        version: release.version,
      };
    })
  );
  const versions = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : []
  );

  if (versions.length === 0) {
    throw new Error("No desktop app versions are currently available");
  }

  return versions;
}

export function getDesktopAppDownloadUrl(app: DesktopAppVersion): string {
  return `https://d3lqz0a4bldqgf.cloudfront.net/${app.downloadPath}/${app.version}.html`;
}
