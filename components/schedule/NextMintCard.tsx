"use client";

import DateCountdown from "@/components/date-countdown/DateCountdown";
import prologue from "@/data/prologue-mints.json";
import {
  mintNumberForDate,
  nextOccurrences,
  timeCoordinate,
  googleCalendarLink,
} from "@/lib/mint";
import { DateTime } from "luxon";

export default function NextMintCard() {
  const next = nextOccurrences(1)[0];
  const mintNum = mintNumberForDate(next, prologue)!;
  const coord = timeCoordinate(next);

  return (
    <div>
      <h2>Next Mint</h2>
      <DateCountdown title={`Mint #${mintNum}`} date={next.toJSDate()} />
      <p>
        {next.toLocal().toLocaleString(DateTime.DATETIME_MED)}
        {" "}(
        <span title={next.toUTC().toISO() || undefined}>UTC {next.toUTC().toFormat("HH:mm")}</span>)
      </p>
      <p>
        Eon {coord.eon} · Era {coord.era} · Period {coord.period} · Epoch {coord.epoch}
      </p>
      <p>
        <a href="/api/mints">Subscribe (ICS)</a>{" | "}
        <a href={googleCalendarLink(next)}>Add to Google</a>
      </p>
    </div>
  );
}
