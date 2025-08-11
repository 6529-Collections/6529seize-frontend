"use client";

import prologue from "@/data/prologue-mints.json";
import {
  mintNumberForDate,
  nextOccurrences,
  googleCalendarLink,
} from "@/lib/mint";
import { DateTime } from "luxon";
import { Card, Table, Button } from "react-bootstrap";

export default function UpcomingMints() {
  const dates = nextOccurrences(6);
  return (
    <Card className="mb-4">
      <Card.Header>Upcoming Mints</Card.Header>
      <Card.Body>
        <Table hover responsive>
          <thead>
            <tr>
              <th>Mint</th>
              <th>Date</th>
              <th>Calendar</th>
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
                  <td>
                    <a
                      className="me-2"
                      href={`/api/mints/${n}.ics`}
                    >
                      ICS
                    </a>
                    <a href={googleCalendarLink(dt)}>Google</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <div className="text-end">
          <Button href="/api/mints" variant="outline-primary">
            Subscribe to all (ICS)
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
