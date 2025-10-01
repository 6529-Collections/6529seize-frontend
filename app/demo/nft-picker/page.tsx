import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

import DemoNftPicker from "./picker-client";

export const metadata: Metadata = getAppMetadata({
  title: "NFT Picker Demo",
});

export default function NftPickerDemoPage() {
  return <DemoNftPicker />;
}
