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
    <Card className="mb-4 bg-dark text-white border-secondary">
      <Card.Header className="bg-secondary text-white">
        Upcoming Mints
      </Card.Header>
      <Card.Body>
        <Table hover responsive variant="dark" className="mb-0">
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
                  <td className="text-white">#{n}</td>
                  <td title={dt.toUTC().toISO() || undefined}>
                    {dt.toLocal().toLocaleString(DateTime.DATETIME_MED)}
                  </td>
                  <td>
                    <Button
                      href={`/api/mints/${n}.ics`}
                      variant="outline-light"
                      size="sm"
                      className="me-2"
                    >
                      ICS
                    </Button>
                    <Button
                      href={googleCalendarLink(dt)}
                      variant="outline-light"
                      size="sm"
                    >
                      Google
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <div className="text-end mt-3">
          <Button href="/api/mints" variant="outline-light">
            Subscribe to all (ICS)
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
