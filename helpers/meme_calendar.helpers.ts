import { Time } from "./time";

interface CalendarBlock {
  start: Time;
  end: Time;
  title: string;
  szn?: number;
}

interface YearCalendar {
  year: number;
  title: string;
  blocks: CalendarBlock[];
}

const CALENDAR_2022: YearCalendar = {
  year: 2022,
  title: "Year 0 GENESIS",
  blocks: [
    {
      start: Time.fromString("2022-06-09"),
      end: Time.fromString("2022-12-16"),
      title: "Meme Cards SZN1",
      szn: 1,
    },
    {
      start: Time.fromString("2022-12-17"),
      end: Time.fromString("2022-12-31"),
      title: "The Festivities",
    },
  ],
};

const CALENDAR_2023: YearCalendar = {
  year: 2023,
  title: "Year 1",
  blocks: [
    {
      start: Time.fromString("2023-01-01"),
      end: Time.fromString("2023-03-31"),
      title: "Winter SZN2",
      szn: 2,
    },
    {
      start: Time.fromString("2023-04-01"),
      end: Time.fromString("2023-04-16"),
      title: "Awakening",
    },
    {
      start: Time.fromString("2023-04-17"),
      end: Time.fromString("2023-06-30"),
      title: "Spring SZN3",
      szn: 3,
    },
    {
      start: Time.fromString("2023-07-01"),
      end: Time.fromString("2023-07-16"),
      title: "Freedom",
    },
    {
      start: Time.fromString("2023-07-17"),
      end: Time.fromString("2023-09-29"),
      title: "Summer SZN4",
      szn: 4,
    },
    {
      start: Time.fromString("2023-09-30"),
      end: Time.fromString("2023-10-15"),
      title: "Harvest",
    },
    {
      start: Time.fromString("2023-10-16"),
      end: Time.fromString("2023-12-15"),
      title: "Fall SZN5",
      szn: 5,
    },
    {
      start: Time.fromString("2023-12-16"),
      end: Time.fromString("2023-12-31"),
      title: "The Festivities",
    },
  ],
};

const CALENDAR_2024: YearCalendar = {
  year: 2024,
  title: "Year 2",
  blocks: [
    {
      start: Time.fromString("2024-01-01"),
      end: Time.fromString("2024-03-15"),
      title: "Winter SZN6",
      szn: 6,
    },
    {
      start: Time.fromString("2024-03-16"),
      end: Time.fromString("2024-03-31"),
      title: "Awakening",
    },
    {
      start: Time.fromString("2024-04-01"),
      end: Time.fromString("2024-06-14"),
      title: "Spring SZN7",
      szn: 7,
    },
    {
      start: Time.fromString("2024-06-15"),
      end: Time.fromString("2024-06-30"),
      title: "Freedom",
    },
    {
      start: Time.fromString("2024-07-01"),
      end: Time.fromString("2024-09-13"),
      title: "Summer SZN8",
      szn: 8,
    },
    {
      start: Time.fromString("2024-09-14"),
      end: Time.fromString("2024-10-01"),
      title: "Harvest",
    },
    {
      start: Time.fromString("2024-10-02"),
      end: Time.fromString("2024-12-13"),
      title: "Fall SZN9",
      szn: 9,
    },
    {
      start: Time.fromString("2024-12-14"),
      end: Time.fromString("2024-12-31"),
      title: "The Festivities",
    },
  ],
};

const CALENDAR_2025: YearCalendar = {
  year: 2025,
  title: "Year 3",
  blocks: [
    {
      start: Time.fromString("2025-01-01"),
      end: Time.fromString("2025-03-14"),
      title: "Winter SZN10",
      szn: 10,
    },
    {
      start: Time.fromString("2025-03-15"),
      end: Time.fromString("2025-03-31"),
      title: "Awakening",
    },
    {
      start: Time.fromString("2025-04-02"),
      end: Time.fromString("2025-06-13"),
      title: "Spring SZN11",
      szn: 11,
    },
    {
      start: Time.fromString("2025-06-14"),
      end: Time.fromString("2025-07-01"),
      title: "Freedom",
    },
    {
      start: Time.fromString("2025-07-02"),
      end: Time.fromString("2025-09-12"),
      title: "Summer SZN12",
      szn: 12,
    },
    {
      start: Time.fromString("2025-09-13"),
      end: Time.fromString("2025-09-30"),
      title: "Harvest",
    },
  ],
};

export const MEMES_CALENDARS: YearCalendar[] = [
  CALENDAR_2025,
  CALENDAR_2024,
  CALENDAR_2023,
  CALENDAR_2022,
];

const MEMES_MINTING_DAYS = [
  1, // Monday
  3, // Wednesday
  5, // Friday
];

export function isMintingToday() {
  const now = Time.now();
  return isMintingDay(now);
}

function isMintingDay(t: Time) {
  const dayOfWeek = t.toDate().getUTCDay();

  if (!MEMES_MINTING_DAYS.includes(dayOfWeek)) {
    return false;
  }

  return MEMES_CALENDARS.some((calendar) => {
    return calendar.blocks.some((block) => {
      return block.szn && block.start.lt(t) && block.end.plusDays(1).gt(t);
    });
  });
}

export function getMintingDates(cardCount: number, addDays = 0) {
  let now = Time.now().plusDays(addDays);
  const dates = [];

  for (let i = 0; i < cardCount; i++) {
    if (isMintingDay(now)) {
      dates.push(now);
    } else {
      now = now.plusDays(1);
      while (!isMintingDay(now)) {
        now = now.plusDays(1);
      }
      dates.push(now);
    }
    now = now.plusDays(1);
  }
  return dates;
}

function getRemainingMintsInBlock(block: CalendarBlock, now: Time) {
  let mintsInBlock = 0;
  const start = block.start.gt(now) ? block.start : now.plusDays(1);

  for (let i = start; i.lt(block.end.plusDays(1)); i = i.plusDays(1)) {
    if (MEMES_MINTING_DAYS.includes(i.toDate().getUTCDay())) {
      mintsInBlock++;
    }
  }
  return mintsInBlock;
}

export function numberOfCardsForSeasonEnd() {
  const now = Time.now();
  const upcomingBlock: CalendarBlock | undefined = MEMES_CALENDARS.flatMap(
    (calendar) => calendar.blocks
  ).find((block) => {
    return block.szn && block.end.plusDays(1).gt(now);
  });

  if (!upcomingBlock) {
    return {
      szn: 0,
      count: 0,
    };
  }

  const mintsInBlock = getRemainingMintsInBlock(upcomingBlock, now);

  return {
    szn: upcomingBlock.szn ?? 0,
    count: mintsInBlock,
  };
}

export function numberOfCardsForCalendarEnd() {
  const now = Time.now();
  const currentCalendar = MEMES_CALENDARS.find((calendar) => {
    return (
      calendar.blocks.some((block) => {
        return now.gt(block.start);
      }) &&
      calendar.blocks.some((block) => {
        return now.lt(block.end);
      })
    );
  });
  if (!currentCalendar) {
    return {
      year: "",
      count: 0,
    };
  }

  const blocks = currentCalendar.blocks.filter(
    (block) => block.end.gt(now) && block.szn
  );
  let mintsInBlocks = 0;
  for (const block of blocks) {
    mintsInBlocks += getRemainingMintsInBlock(block, now);
  }
  return {
    year: currentCalendar.title,
    count: mintsInBlocks,
  };
}
