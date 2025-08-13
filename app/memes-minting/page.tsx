import { getAppMetadata } from "@/components/providers/metadata";
import MemeCalendar from "@/components/schedule/MemeCalendar";
import MemeCalendarOverview from "@/components/schedule/MemeCalendarOverview";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Memes Minting Schedule" });
}

export default function MemesMintingPage() {
  return (
    <div className="tw-container tw-mx-auto tw-my-6">
      <div className="tw-flex tw-flex-wrap tw-gap-8">
        <div className="tw-w-full">
          <MemeCalendarOverview />
        </div>
        <div className="tw-w-full">
          <MemeCalendar />
        </div>
      </div>
    </div>
  );
}
