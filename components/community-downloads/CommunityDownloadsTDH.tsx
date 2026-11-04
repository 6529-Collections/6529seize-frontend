"use client";

import { apiUrl } from "@/services/api/api-endpoints";
import { useSetTitle } from "@/contexts/TitleContext";
import CommunityDownloadsComponent from "./CommunityDownloadsComponent";
import { VIEW } from "./views";

interface Props {
  view: VIEW;
}

export default function CommunityDownloadsTDH(props: Readonly<Props>) {
  let title = "Network Metrics";
  if (props.view === VIEW.CONSOLIDATION) {
    title = `Consolidated ${title}`;
  }
  useSetTitle(`${title} | Open Data`);

  const url = apiUrl(
    `/api/${props.view === VIEW.WALLET ? "uploads" : "consolidated_uploads"}`
  );
  return <CommunityDownloadsComponent title={title} url={url} />;
}
