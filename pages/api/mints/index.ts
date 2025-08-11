import type { NextApiRequest, NextApiResponse } from 'next';
import { MINT_TIME_UTC } from '@/lib/mint';

export default function handler(_: NextApiRequest, res: NextApiResponse) {
  const dtstart = `20260102T${MINT_TIME_UTC.replace(':', '').slice(0, 4)}00Z`;

  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//YourSite//Mints//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:Protocol Mints (UTC)\nBEGIN:VEVENT\nUID:protocol-mwf-forever@yoursite\nDTSTART:${dtstart}\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR\nSUMMARY:Protocol Mint (UTC)\nDESCRIPTION:Mon/Wed/Fri forever, UTC canonical.\nTRANSP:OPAQUE\nEND:VEVENT\nEND:VCALENDAR`;

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.send(ics);
}

