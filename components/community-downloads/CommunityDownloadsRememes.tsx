"use client";

import { env } from "@/config/env";
import { useSetTitle } from "@/contexts/TitleContext";
import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

export default function CommunityDownloadsRememes() {
  useSetTitle("Rememes | Open Data");
  return (
    <CommunityDownloadsComponent
      title="Rememes"
      url={`${env.API_ENDPOINT}/api/rememes_uploads`}
    />
  );
}
