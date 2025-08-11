import type { NextApiRequest, NextApiResponse } from 'next';
import { dateForMintNumber, MINT_TIME_UTC } from '@/lib/mint';
import prologue from '@/data/prologue-mints.json';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const num = parseInt(req.query.number as string, 10);
  if (!Number.isFinite(num)) {
    res.status(400).send('Invalid mint number');
    return;
  }
  const dt = dateForMintNumber(num, prologue);
  const start = dt.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
  const end = dt.plus({ minutes: 30 }).toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//YourSite//Mints//EN\nBEGIN:VEVENT\nUID:mint-${num}@yoursite\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:Mint #${num}\nDESCRIPTION:Protocol mint at ${MINT_TIME_UTC} UTC\nTRANSP:OPAQUE\nEND:VEVENT\nEND:VCALENDAR`;
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.send(ics);
}
