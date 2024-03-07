import Head from "next/head";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { useState } from "react";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

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
];

export default function Levels() {
  const [breadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Levels" },
  ]);
  return (
    <>
      <Head>
        <title>Levels | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Levels | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/levels`}
        />
        <meta property="og:title" content="Levels" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Header />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <div className="tailwind-scope">
        <div className="tw-pt-12 tw-pb-12">
          <div className="tw-px-6 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
            <div className="tw-max-w-3xl tw-pb-4 tw-flex tw-flex-col">
              <h1>Levels</h1>
              <ul className="tw-ml-4 tw-pl-0">
                <li className="tw-text-justify tw-mb-0 tw-mt-2 tw-font-normal tw-text-base tw-text-neutral-100">
                  Levels are our integrated metric of TDH and Rep.
                </li>
                <li className="tw-text-justify tw-mb-0 tw-mt-2 tw-font-normal tw-text-base tw-text-neutral-100">
                  TDH and rep are added together and the level is determined by
                  the table below. It is our most integrated measure of trust in
                  our ecosystem.
                </li>
                <li className="tw-text-justify tw-mb-0 tw-mt-2 tw-font-normal tw-text-base tw-text-neutral-100">
                  Levels start at zero and are currently capped at 100 (for
                  25,000,000 TDH).
                </li>
                <li className="tw-text-justify tw-mb-0 tw-mt-2 tw-font-normal tw-text-base tw-text-neutral-100">
                  Levels are determined by the table below.
                </li>
                <li className="tw-text-justify tw-mb-0 tw-mt-2 tw-font-normal tw-text-base tw-text-neutral-100">
                  As with all metrics, they may be adjusted to better meet their
                  objectives.
                </li>
              </ul>
            </div>
            <div className="xl:tw-max-w-4xl tw-overflow-x-auto tw-ring-1 tw-ring-white/[0.15] tw-rounded-lg">
              <table className="tw-min-w-full tw-divide-y tw-divide-neutral-700/60">
                <thead className="tw-bg-neutral-700">
                  <tr>
                    <td className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-semibold tw-text-white tw-uppercase sm:tw-pl-6">
                      Level
                    </td>
                    <td className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-semibold tw-text-white tw-uppercase sm:tw-pl-6">
                      TDH + Rep
                    </td>
                  </tr>
                </thead>
                <tbody className="tw-bg-[#222222] tw-divide-y tw-divide-neutral-700/60">
                  {LEVELS.map((level) => (
                    <tr
                      key={`level-${level.level}`}
                      className="hover:tw-bg-neutral-700/40 tw-transition tw-duration-300 tw-ease-out">
                      <td className="tw-whitespace-nowrap sm:tw-pl-6 tw-pr-3 tw-pl-4 tw-py-3 tw-text-sm tw-font-medium tw-text-neutral-400">
                        {level.level}
                      </td>
                      <td className="tw-whitespace-nowrap tw-py-3 tw-pl-4 tw-pr-3 sm:tw-pl-6 tw-text-sm tw-font-medium tw-text-neutral-400">
                        {level.minTdh.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
