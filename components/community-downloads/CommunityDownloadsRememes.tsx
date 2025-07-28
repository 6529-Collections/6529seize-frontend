"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

export default function CommunityDownloadsRememes() {
  useSetTitle("Rememes | Open Data");
  return (
    <CommunityDownloadsComponent
      title="Rememes"
      url={`${process.env.API_ENDPOINT}/api/rememes_uploads`}
    />
  );
}
