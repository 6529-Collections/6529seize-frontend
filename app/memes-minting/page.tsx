import { getAppMetadata } from "@/components/providers/metadata";
import MemesMintingCalendar from "@/components/schedule/MemesMintingCalendar"; // + add
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Memes Minting Calendar" });
}

export default function MemesMintingCalendarPage() {
  return (
    <div className="tw-container tw-mx-auto tw-my-6">
      <MemesMintingCalendar />
    </div>
  );
}
