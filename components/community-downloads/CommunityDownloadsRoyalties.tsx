"use client";

import { apiUrl } from "@/services/api/api-endpoints";
import { useSetTitle } from "@/contexts/TitleContext";
import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

export default function CommunityDownloadsRoyalties() {
  useSetTitle("Royalties | Open Data");

  return (
    <CommunityDownloadsComponent
      title="Royalties"
      url={apiUrl("/api/royalties/uploads")}
    />
  );
}
