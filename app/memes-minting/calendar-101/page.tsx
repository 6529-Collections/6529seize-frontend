import { getAppMetadata } from "@/components/providers/metadata";
import MemeCalendarDetails from "@/components/schedule/MemeCalendarDetails";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Memes Minting Calendar 101" });
}

export default function MemesMintingPage() {
  return (
    <div className="tw-container tw-mx-auto tw-my-6">
      <MemeCalendarDetails />
    </div>
  );
}
