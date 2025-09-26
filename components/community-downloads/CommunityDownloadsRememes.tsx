"use client";

import { publicEnv } from "@/config/env";
import { useSetTitle } from "@/contexts/TitleContext";
import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

export default function CommunityDownloadsRememes() {
  useSetTitle("Rememes | Open Data");
  return (
    <CommunityDownloadsComponent
      title="Rememes"
      url={`${publicEnv.API_ENDPOINT}/api/rememes_uploads`}
    />
  );
}
