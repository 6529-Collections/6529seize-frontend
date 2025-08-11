"use client";

import prologue from "@/data/prologue-mints.json";
import { mintNumberForDate, nextOccurrences } from "@/lib/mint";
import { DateTime } from "luxon";

export default function UpcomingMints() {
  const dates = nextOccurrences(6);
  return (
    <div>
      <h3>Upcoming Mints</h3>
      <table>
        <thead>
          <tr>
            <th>Mint</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((dt) => {
            const n = mintNumberForDate(dt, prologue)!;
            return (
              <tr key={n}>
                <td>#{n}</td>
                <td title={dt.toUTC().toISO() || undefined}>
                  {dt.toLocal().toLocaleString(DateTime.DATETIME_MED)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
