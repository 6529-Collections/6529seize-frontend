"use client";

import { apiUrl } from "@/services/api/api-endpoints";
import { useSetTitle } from "@/contexts/TitleContext";
import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

export default function CommunityDownloadsRememes() {
  useSetTitle("Rememes | Open Data");
  return (
    <CommunityDownloadsComponent
      title="Rememes"
      url={apiUrl("/api/rememes_uploads")}
    />
  );
}
