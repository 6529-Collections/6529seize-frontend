import { MemeCalendarOverviewNextMint } from "@/components/meme-calendar/MemeCalendarOverview";
import NotFound from "@/components/not-found/NotFound";

export default function UpcomingMemePage({ id }: { readonly id: string }) {
  const numId = Number(id);
  if (Number.isInteger(numId)) {
    return (
      <div className="tw-mt-6">
        <MemeCalendarOverviewNextMint displayTz="local" id={numId} />
      </div>
    );
  }
  return <NotFound label="MEME" />;
}
