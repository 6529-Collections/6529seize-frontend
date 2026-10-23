import { dateFromMintNumber, mintEndInstantUtcForMintDay } from './calendar';
import { MINT_TIME_ZONE, wallTimeToUtcInstantInZone } from './zone';

const MEMES_CALENDAR_VERSION = '2026-10-23.4';
type MintPhaseId = '0' | '1' | '2' | 'public';
interface MintPhaseWindow {
  id: MintPhaseId;
  name: string;
  isPublic: boolean;
  start: Date;
  end: Date;
}

export function mintPhaseWindowsForDay(day: Date): MintPhaseWindow[] {
  if (!Number.isFinite(day.getTime())) throw new RangeError('Invalid mint day');
  const at = (hour: number, minute: number) =>
    wallTimeToUtcInstantInZone(day, hour, minute);
  return [
    {
      id: '0',
      name: 'Phase 0',
      isPublic: false,
      start: at(17, 40),
      end: at(18, 20)
    },
    {
      id: '1',
      name: 'Phase 1',
      isPublic: false,
      start: at(18, 30),
      end: at(18, 50)
    },
    {
      id: '2',
      name: 'Phase 2',
      isPublic: false,
      start: at(19, 0),
      end: at(19, 20)
    },
    {
      id: 'public',
      name: 'Public',
      isPublic: true,
      start: at(19, 20),
      end: mintEndInstantUtcForMintDay(day)
    }
  ];
}

export function getMintSchedule(mintNumber: number) {
  const mintStart = dateFromMintNumber(mintNumber);
  const mintEnd = mintEndInstantUtcForMintDay(mintStart);
  return {
    version: MEMES_CALENDAR_VERSION,
    timeZone: MINT_TIME_ZONE,
    mintNumber,
    mintStart,
    mintEnd,
    phases: mintPhaseWindowsForDay(mintStart),
    previewAt: new Date(mintEnd.getTime() + 15 * 60 * 1000),
    postMintAt: new Date(mintEnd.getTime() + 60 * 60 * 1000)
  };
}
