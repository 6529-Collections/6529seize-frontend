import { ConsolidatedTDHMetrics } from "../../../entities/ITDH";

const LEVELS: { minTdh: number; level: number }[] = [
  { minTdh: 0, level: 0 },
  {
    minTdh: 25,
    level: 1,
  },
  {
    minTdh: 50,
    level: 2,
  },
  {
    minTdh: 100,
    level: 3,
  },
  {
    minTdh: 250,
    level: 4,
  },
  {
    minTdh: 500,
    level: 5,
  },
  {
    minTdh: 1000,
    level: 6,
  },
  {
    minTdh: 1500,
    level: 7,
  },
  {
    minTdh: 3000,
    level: 8,
  },
  {
    minTdh: 5000,
    level: 9,
  },
  {
    minTdh: 7500,
    level: 10,
  },
  {
    minTdh: 10000,
    level: 11,
  },
  {
    minTdh: 15000,
    level: 12,
  },
  {
    minTdh: 20000,
    level: 13,
  },
  {
    minTdh: 25000,
    level: 14,
  },
  {
    minTdh: 30000,
    level: 15,
  },
  {
    minTdh: 35000,
    level: 16,
  },
  {
    minTdh: 40000,
    level: 17,
  },
  {
    minTdh: 45000,
    level: 18,
  },
  {
    minTdh: 50000,
    level: 19,
  },
  {
    minTdh: 60000,
    level: 20,
  },
  {
    minTdh: 70000,
    level: 21,
  },
  {
    minTdh: 80000,
    level: 22,
  },
  {
    minTdh: 90000,
    level: 23,
  },
  {
    minTdh: 100000,
    level: 24,
  },
  {
    minTdh: 110000,
    level: 25,
  },
  {
    minTdh: 120000,
    level: 26,
  },
  {
    minTdh: 130000,
    level: 27,
  },
  {
    minTdh: 140000,
    level: 28,
  },
  {
    minTdh: 150000,
    level: 29,
  },
  {
    minTdh: 160000,
    level: 30,
  },
  {
    minTdh: 170000,
    level: 31,
  },
  {
    minTdh: 180000,
    level: 32,
  },
  {
    minTdh: 190000,
    level: 33,
  },
  {
    minTdh: 200000,
    level: 34,
  },
  {
    minTdh: 220000,
    level: 35,
  },
  {
    minTdh: 240000,
    level: 36,
  },
  {
    minTdh: 260000,
    level: 37,
  },
  {
    minTdh: 280000,
    level: 38,
  },
  {
    minTdh: 300000,
    level: 39,
  },
  {
    minTdh: 320000,
    level: 40,
  },
  {
    minTdh: 340000,
    level: 41,
  },
  {
    minTdh: 360000,
    level: 42,
  },
  {
    minTdh: 380000,
    level: 43,
  },
  {
    minTdh: 400000,
    level: 44,
  },
  {
    minTdh: 420000,
    level: 45,
  },
  {
    minTdh: 440000,
    level: 46,
  },
  {
    minTdh: 460000,
    level: 47,
  },
  {
    minTdh: 480000,
    level: 48,
  },
  {
    minTdh: 500000,
    level: 49,
  },
  {
    minTdh: 550000,
    level: 50,
  },
  {
    minTdh: 600000,
    level: 51,
  },
  {
    minTdh: 650000,
    level: 52,
  },
  {
    minTdh: 700000,
    level: 53,
  },
  {
    minTdh: 750000,
    level: 54,
  },
  {
    minTdh: 800000,
    level: 55,
  },
  {
    minTdh: 850000,
    level: 56,
  },
  {
    minTdh: 900000,
    level: 57,
  },
  {
    minTdh: 950000,
    level: 58,
  },
  {
    minTdh: 1000000,
    level: 59,
  },
  {
    minTdh: 1250000,
    level: 60,
  },
  {
    minTdh: 1500000,
    level: 61,
  },
  {
    minTdh: 1750000,
    level: 62,
  },
  {
    minTdh: 2000000,
    level: 63,
  },
  {
    minTdh: 2250000,
    level: 64,
  },
  {
    minTdh: 2500000,
    level: 65,
  },
  {
    minTdh: 2750000,
    level: 66,
  },
  {
    minTdh: 3000000,
    level: 67,
  },
  {
    minTdh: 3250000,
    level: 68,
  },
  {
    minTdh: 3500000,
    level: 69,
  },
  {
    minTdh: 3750000,
    level: 70,
  },
  {
    minTdh: 4000000,
    level: 71,
  },
  {
    minTdh: 4250000,
    level: 72,
  },
  {
    minTdh: 4500000,
    level: 73,
  },
  {
    minTdh: 4750000,
    level: 74,
  },
  {
    minTdh: 5000000,
    level: 75,
  },
  {
    minTdh: 5500000,
    level: 76,
  },
  {
    minTdh: 6000000,
    level: 77,
  },
  {
    minTdh: 6500000,
    level: 78,
  },
  {
    minTdh: 7000000,
    level: 79,
  },
  {
    minTdh: 7500000,
    level: 80,
  },
  {
    minTdh: 8000000,
    level: 81,
  },
  {
    minTdh: 8500000,
    level: 82,
  },
  {
    minTdh: 9000000,
    level: 83,
  },
  {
    minTdh: 9500000,
    level: 84,
  },
  {
    minTdh: 10000000,
    level: 85,
  },
  {
    minTdh: 11000000,
    level: 86,
  },
  {
    minTdh: 12000000,
    level: 87,
  },
  {
    minTdh: 13000000,
    level: 88,
  },
  {
    minTdh: 14000000,
    level: 89,
  },
  {
    minTdh: 15000000,
    level: 90,
  },
  {
    minTdh: 16000000,
    level: 91,
  },
  {
    minTdh: 17000000,
    level: 92,
  },
  {
    minTdh: 18000000,
    level: 93,
  },
  {
    minTdh: 19000000,
    level: 94,
  },
  {
    minTdh: 20000000,
    level: 95,
  },
  {
    minTdh: 21000000,
    level: 96,
  },
  {
    minTdh: 22000000,
    level: 97,
  },
  {
    minTdh: 23000000,
    level: 98,
  },
  {
    minTdh: 24000000,
    level: 99,
  },
  {
    minTdh: 25000000,
    level: 100,
  },
].reverse();

const LEVEL_CLASSES: { minLevel: number; classes: string }[] = [
  { minLevel: 0, classes: "tw-text-[#DA8C60] tw-ring-[#DA8C60]" },
  { minLevel: 20, classes: "tw-text-[#DAAC60] tw-ring-[#DAAC60]" },
  { minLevel: 40, classes: "tw-text-[#DAC660] tw-ring-[#DAC660]" },
  { minLevel: 60, classes: "tw-text-[#AABE68] tw-ring-[#AABE68]" },
  { minLevel: 80, classes: "tw-text-[#55B075] tw-ring-[#55B075]" },
].reverse();

export default function UserPageHeaderLevel({
  consolidatedTDH,
}: {
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}) {
  const getLevel = (): number => {
    if (!consolidatedTDH) {
      return 0;
    }

    const tdh = consolidatedTDH.boosted_memes_tdh;
    const targetLevel = LEVELS.find((level) => level.minTdh <= tdh);
    return targetLevel?.level ?? 0;
  };

  const getClasses = (): string => {
    const targetLevel = getLevel();
    const targetClasses = LEVEL_CLASSES.find(
      (level) => level.minLevel <= targetLevel
    )?.classes;
    return targetClasses ?? LEVEL_CLASSES[0].classes;
  };

  const level = getLevel();
  const classes = getClasses();

  return (
    <div className="tw-mt-4">
      <span
        className={`tw-inline-flex tw-items-center tw-rounded-xl tw-bg-transparent tw-px-2 tw-py-1 tw-text-base tw-font-semibold tw-ring-2 tw-ring-inset ${classes}`}
      >
        Level {level}
      </span>
    </div>
  );
}
