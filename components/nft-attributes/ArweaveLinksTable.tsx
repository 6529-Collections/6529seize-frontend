"use client";

import Download from "@/components/download/Download";
import { faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

type ArweaveLinkRow = {
  readonly label: string;
  readonly url: string;
  readonly openLabel: string;
  readonly extension?: string | undefined;
  readonly downloadName?: string | undefined;
};

export function ArweaveLinksTable(props: {
  readonly rows: readonly ArweaveLinkRow[];
  readonly linkClassName?: string | undefined;
}) {
  if (props.rows.length === 0) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {props.rows.map((row) => (
        <div
          key={`${row.label}-${row.url}`}
          className="tw-grid tw-items-center tw-gap-x-3 tw-gap-y-1"
          style={{ gridTemplateColumns: "4rem minmax(0, 1fr)" }}
        >
          <div className="tw-whitespace-nowrap">{row.label}</div>
          <div className="tw-min-w-0">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <Link
                className={`${props.linkClassName ?? ""} tw-break-all`}
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.url}
              </Link>
              <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
                <Link
                  href={row.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={row.openLabel}
                  className="tw-inline-flex tw-size-9 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-900 tw-text-white tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-800"
                >
                  <FontAwesomeIcon
                    icon={faExternalLink}
                    className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-white"
                  />
                </Link>
                {row.downloadName && (
                  <Download
                    href={row.url}
                    name={row.downloadName}
                    extension={row.extension ?? ""}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
