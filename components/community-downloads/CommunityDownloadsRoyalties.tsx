"use client";

import { publicEnv } from "@/config/env";
import { useSetTitle } from "@/contexts/TitleContext";
import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

export default function CommunityDownloadsRoyalties() {
  useSetTitle("Royalties | Open Data");

  return (
    <CommunityDownloadsComponent
      title="Royalties"
      url={`${publicEnv.API_ENDPOINT}/api/royalties/uploads`}
    />
  );
}
