"use client";

import { publicEnv } from "@/config/env";
import { useSetTitle } from "@/contexts/TitleContext";
import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

export enum VIEW {
  CONSOLIDATION,
  WALLET,
}

interface Props {
  view: VIEW;
}

export default function CommunityDownloadsTDH(props: Readonly<Props>) {
  let title = "Network Metrics";
  if (props.view === VIEW.CONSOLIDATION) {
    title = `Consolidated ${title}`;
  }
  useSetTitle(`${title} | Open Data`);

  const url = `${publicEnv.API_ENDPOINT}/api/${
    props.view === VIEW.WALLET ? "uploads" : "consolidated_uploads"
  }`;
  return <CommunityDownloadsComponent title={title} url={url} />;
}
