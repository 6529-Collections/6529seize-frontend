"use client"

import { useSetTitle } from "@/contexts/TitleContext";
import {
  formatDate,
  DownloadsLayout,
  DownloadsTable,
} from "./CommunityDownloadsHelpers";

interface TeamDownload {
  created_at: string;
  url: string;
}

export default function CommunityDownloadsTeam() {
  useSetTitle("Team | Open Data");

  const downloads: TeamDownload[] = [
    {
      created_at: "2023-05-10 11:44:03",
      url: "https://arweave.net/lRR1YuRwnThzKVXNIuDCbA-LfyfyZYU6sezNtF9-Dn0",
    },
    {
      created_at: "2023-03-02 10:42:49",
      url: "https://arweave.net/iDa7cvYLdS95XNnISou4h3Zzvt0qu6w7BUXJiGrCyVE",
    },
    {
      created_at: "2024-04-11 16:02:56",
      url: "https://arweave.net/Q1asRH7r36XAbAghCL_PbI0eZufThkMMnhYiD55KYc4",
    },
  ];

  return (
    <DownloadsLayout title="Team">
      <DownloadsTable
        data={downloads}
        columns={["Date", "Link"]}
        renderRow={(download: TeamDownload) => (
          <tr key={download.created_at}>
            <td>{formatDate(download.created_at)}</td>
            <td>
              <a href={download.url} target="_blank" rel="noreferrer">
                {download.url}
              </a>
            </td>
          </tr>
        )}
      />
    </DownloadsLayout>
  );
}
