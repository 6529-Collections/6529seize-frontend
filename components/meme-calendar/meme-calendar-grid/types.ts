import type { SupportedLocale } from "@/i18n/locales";

import type { DisplayTz } from "../meme-calendar.helpers";
import { getHistoricalMintsOnUtcDay } from "../meme-calendar.szn1";

export interface MonthProps {
  readonly date: Date;
  readonly onSelectDay?: ((date: Date) => void) | undefined;
  readonly autoOpenYmd?: string | undefined;
  readonly displayTz: DisplayTz;
  readonly locale: SupportedLocale;
}

export interface SeasonViewProps {
  readonly seasonIndex: number;
  readonly onSelectDay?: ((date: Date) => void) | undefined;
  readonly autoOpenYmd?: string | undefined;
  readonly displayTz: DisplayTz;
  readonly locale: SupportedLocale;
}

export interface YearViewProps {
  readonly seasonIndex: number;
  readonly onSelectSeason: (seasonIndex: number) => void;
  readonly onZoomToSeason: () => void;
  readonly locale: SupportedLocale;
}

export interface EpochViewProps {
  readonly seasonIndex: number;
  readonly onSelectSeason: (seasonIndex: number) => void;
  readonly onSelectYear: (yearNumber: number) => void;
  readonly onZoomToYear: () => void;
  readonly locale: SupportedLocale;
}

export interface PeriodViewProps {
  readonly seasonIndex: number;
  readonly onSelectEpoch: (epochNumber: number) => void;
  readonly onZoomToEpoch: () => void;
  readonly locale: SupportedLocale;
}

export interface EraViewProps {
  readonly seasonIndex: number;
  readonly onSelectPeriod: (periodNumber: number) => void;
  readonly onZoomToPeriod: () => void;
  readonly locale: SupportedLocale;
}

export interface EonViewProps {
  readonly seasonIndex: number;
  readonly onSelectEra: (eraNumber: number) => void;
  readonly onZoomToEra: () => void;
  readonly locale: SupportedLocale;
}

export type TooltipPlace = "top" | "bottom" | "right";
export type HistoricalMint = ReturnType<
  typeof getHistoricalMintsOnUtcDay
>[number];

export interface MintCellDetails {
  readonly historical: HistoricalMint[];
  readonly isMintDay: boolean;
  readonly mintInstantUtc: Date | undefined;
  readonly mintLabel: string | undefined;
  readonly mintNumber: number | undefined;
}

export interface MintTooltip {
  readonly className: string;
  readonly html: string;
}

export interface MonthDayCellProps {
  readonly cellOffset: number;
  readonly day: number;
  readonly displayTz: DisplayTz;
  readonly locale: SupportedLocale;
  readonly month: number;
  readonly onSelectDay?: ((date: Date) => void) | undefined;
  readonly year: number;
}

export interface MemeCalendarProps {
  readonly displayTz: DisplayTz;
  readonly locale?: SupportedLocale | undefined;
}

export type { ZoomLevel } from "../meme-calendar.helpers";
