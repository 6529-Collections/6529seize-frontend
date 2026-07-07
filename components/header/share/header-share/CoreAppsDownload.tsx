"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

import { squareStyle } from "./constants";
import { fetchCoreAppsVersions } from "./shareUtils";

export function CoreAppsDownload() {
  const { data: versions = [] } = useQuery({
    queryKey: ["core-apps-versions"],
    queryFn: fetchCoreAppsVersions,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div style={squareStyle}>
      <div className="tw-inline-flex tw-flex-col tw-gap-10">
        {versions.map((version) => (
          <CoreAppDownload
            key={version.name}
            platform={version.displayName}
            icon={version.image}
            title={version.displayName}
            downloadPath={version.downloadPath}
            version={version.version ?? ""}
          />
        ))}
      </div>
    </div>
  );
}

function CoreAppDownload({
  platform,
  icon,
  title,
  downloadPath,
  version,
}: {
  readonly platform: string;
  readonly icon: string;
  readonly title: string;
  readonly downloadPath: string;
  readonly version: string;
}) {
  if (!version) {
    return null;
  }

  const url = `https://d3lqz0a4bldqgf.cloudfront.net/${downloadPath}/${version}.html`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-flex tw-w-full tw-items-center tw-gap-4 tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-black tw-px-5 tw-py-3 tw-no-underline tw-transition-all tw-duration-300 tw-ease-out hover:tw-scale-[1.03]"
    >
      <div className="tw-rounded-full tw-bg-white tw-p-4">
        <Image
          unoptimized
          priority
          loading="eager"
          src={icon}
          alt={title}
          width={40}
          height={40}
          className="unselectable"
        />
      </div>
      <div className="tw-flex tw-w-full tw-items-center tw-gap-2">
        <div className="tw-min-w-fit tw-whitespace-nowrap tw-text-lg tw-font-medium">
          {platform} v{version}
        </div>
      </div>
    </a>
  );
}
