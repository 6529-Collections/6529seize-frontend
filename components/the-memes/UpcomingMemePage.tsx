import { MemeCalendarOverviewNextMint } from "@/components/meme-calendar/MemeCalendarOverview";
import NotFound from "@/components/not-found/NotFound";

export default function UpcomingMemePage({ id }: { readonly id: string }) {
  const numId = Number(id);
  if (Number.isInteger(numId)) {
    return <MemeCalendarOverviewNextMint displayTz="local" id={numId} />;
  }
  return <NotFound label="MEME" />;
}
