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
import { Card, Button } from "react-bootstrap";

export default function NextMintCard() {
  const next = nextOccurrences(1)[0];
  const mintNum = mintNumberForDate(next, prologue)!;
  const coord = timeCoordinate(next);

  return (
    <Card className="mb-4 text-center">
      <Card.Header>Next Mint</Card.Header>
      <Card.Body>
        <Card.Title>Mint #{mintNum}</Card.Title>
        <DateCountdown title={`Mint #${mintNum}`} date={next.toJSDate()} />
        <p className="mt-2">
          {next.toLocal().toLocaleString(DateTime.DATETIME_MED)} (
          <span title={next.toUTC().toISO() || undefined}>
            {next.toUTC().toFormat("HH:mm")} UTC
          </span>
          )
        </p>
        <p className="mb-3">
          Eon {coord.eon} · Era {coord.era} · Period {coord.period} · Epoch {coord.epoch}
        </p>
        <Button
          href={`/api/mints/${mintNum}.ics`}
          variant="outline-primary"
          className="me-2"
        >
          ICS
        </Button>
        <Button href={googleCalendarLink(next)} variant="outline-success">
          Google
        </Button>
      </Card.Body>
    </Card>
  );
}
