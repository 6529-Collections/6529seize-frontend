import { ArrowDownTrayIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

import { ABOUT_CARD_CLASS_NAME } from "@/components/about/AboutLayout";
import {
  DATA_CENTER,
  DAY,
  LARGE_HOLDERS,
  MEASURED_ON,
  MINIMUM,
  PARTS,
  PRICES_READ_ON,
  QUESTIONS,
  RASPBERRY_PI,
  RASPBERRY_PI_PRICE,
  SOURCES,
  SYSTEMS,
  TIER_TERMS,
  TIERS,
} from "@/lib/validator-page/content/hardwareText";
import LocalSigningTimes from "./hardware/LocalSigningTimes";
import ValidatorPageFrame, { ValidatorPageHeader } from "./ValidatorPageFrame";
import { SECONDARY_BUTTON } from "./validatorStyles";

/** One file a system card offers, with the same button as every download. */
export type HardwareDownload = {
  readonly label: string;
  readonly href: string;
  /** The file's name, for screen readers; null for a link to the page. */
  readonly fileName: string | null;
};

export type HardwareDownloads = Readonly<
  Partial<Record<(typeof SYSTEMS)[number]["key"], readonly HardwareDownload[]>>
>;

const SECTION = "tw-mt-14 sm:tw-mt-16";
const SECTION_HEADING =
  "tw-m-0 tw-text-2xl tw-font-semibold tw-leading-8 tw-tracking-tight tw-text-iron-50";
const INTRO =
  "tw-mb-0 tw-mt-3 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300";
const CARD_TITLE =
  "tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50";
const SMALL = "tw-text-sm tw-leading-6 tw-text-iron-400";
/**
 * A row of cards. From the width where the cards sit side by side, each
 * card takes its rows from the list (subgrid), so titles, text, chips and
 * prices line up across the row. There the list's row gap is zero, since
 * it would also open between a card's own rows.
 */
const CARD_ROW = "tw-m-0 tw-mt-5 tw-grid tw-list-none tw-gap-3 tw-p-0";
const FOCUS =
  "focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950";

function Chips({ chips }: { readonly chips: readonly string[] }) {
  return (
    <ul className="tw-m-0 tw-mt-4 tw-flex tw-list-none tw-flex-wrap tw-gap-1.5 tw-p-0">
      {chips.map((chip) => (
        <li
          key={chip}
          className="tw-whitespace-nowrap tw-rounded-md tw-bg-iron-800/70 tw-px-2 tw-py-0.5 tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-100"
        >
          {chip}
        </li>
      ))}
    </ul>
  );
}

function Minimum() {
  return (
    <dl className="tw-m-0 tw-mt-8 tw-grid tw-grid-cols-2 tw-gap-3 lg:tw-grid-cols-4">
      {MINIMUM.map((item) => (
        <div
          key={item.label}
          className={`${ABOUT_CARD_CLASS_NAME} tw-flex tw-flex-col tw-p-4`}
        >
          <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
            {item.label}
          </dt>
          <dd className="tw-m-0 tw-mt-2 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-50">
            {item.value}
          </dd>
          <dd className={`tw-m-0 tw-mt-1.5 ${SMALL}`}>{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function SystemDownloads({
  downloads,
}: {
  readonly downloads: readonly HardwareDownload[];
}) {
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2 tw-pt-4">
      {downloads.map((download) => (
        <a
          key={download.href}
          href={download.href}
          className={SECONDARY_BUTTON}
          aria-label={
            download.fileName
              ? `${download.label}, ${download.fileName}`
              : undefined
          }
        >
          <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
          {download.label}
        </a>
      ))}
    </div>
  );
}

/** The card's files, or a button to the download page while none is out. */
function filesFor(
  downloads: HardwareDownloads,
  key: keyof HardwareDownloads,
  label: string
): readonly HardwareDownload[] {
  const files = downloads[key] ?? [];
  return files.length > 0
    ? files
    : [{ label, href: "/validator", fileName: null }];
}

function Systems({ downloads }: { readonly downloads: HardwareDownloads }) {
  return (
    <section aria-labelledby="systems" className={SECTION}>
      <h2 id="systems" className={SECTION_HEADING}>
        Check your computer
      </h2>
      <ul className={`${CARD_ROW} lg:tw-grid-cols-3 lg:tw-gap-y-0`}>
        {SYSTEMS.map((system) => (
          <li
            key={system.key}
            className={`${ABOUT_CARD_CLASS_NAME} tw-flex tw-flex-col tw-p-5 lg:tw-row-span-5 lg:tw-grid lg:tw-grid-rows-subgrid`}
          >
            <div className="tw-flex tw-items-center tw-gap-3">
              <span className="tw-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-bg-white">
                <Image
                  unoptimized
                  src={system.image}
                  alt=""
                  width={24}
                  height={24}
                  className="tw-size-6 tw-object-contain"
                />
              </span>
              <h3 className={CARD_TITLE}>{system.title}</h3>
            </div>
            <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-200">
              {system.works}
            </p>
            <p className={`tw-mb-0 tw-mt-3 ${SMALL}`}>{system.check}</p>
            <p className={`tw-mb-0 tw-mt-3 ${SMALL}`}>{system.note}</p>
            <SystemDownloads
              downloads={filesFor(downloads, system.key, system.download)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Parts() {
  return (
    <section aria-labelledby="parts" className={SECTION}>
      <h2 id="parts" className={SECTION_HEADING}>
        What each part needs
      </h2>
      <p className={INTRO}>Measured on the test release on {MEASURED_ON}.</p>
      <dl className="tw-m-0 tw-mt-6 tw-border-0 tw-border-b tw-border-solid tw-border-iron-800/70">
        {PARTS.map((part) => (
          <div
            key={part.key}
            id={`part-${part.key}`}
            className="tw-grid tw-gap-1 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800/70 tw-py-4 md:tw-grid-cols-[200px_minmax(0,1fr)] md:tw-gap-6"
          >
            <dt className="tw-text-sm tw-font-semibold tw-leading-7 tw-text-iron-400">
              {part.part}
            </dt>
            <dd className="tw-m-0">
              <span className="tw-block tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-50">
                {part.answer}
              </span>
              <span className="tw-mt-0.5 tw-block tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
                {part.why}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Hours of the day as a share of the bar's width. */
function at(hours: number): string {
  return `${(hours / 24) * 100}%`;
}

const DAY_TICKS = [0, 6, 12, 18, 24] as const;

/** The first tick starts at the edge, the last ends there, the rest centre. */
function tickAlign(hour: number): string {
  if (hour === 0) {
    return "";
  }
  return hour === 24 ? "-tw-translate-x-full" : "-tw-translate-x-1/2";
}

function DayFigure() {
  const keepOn = DAY.keepOnUntil - DAY.signs;
  const stillCounts = DAY.windowCloses - DAY.keepOnUntil;
  return (
    <section aria-labelledby="day" className={SECTION}>
      <h2 id="day" className={SECTION_HEADING}>
        When it needs to be on
      </h2>
      <p className={INTRO}>
        At about 00:15 UTC each day, the validator calculates and signs within
        minutes. At home it then waits a random time, up to two hours, before it
        sends its vote. Signing stays open until 19:00 UTC.
      </p>
      <LocalSigningTimes />
      <figure
        className={`${ABOUT_CARD_CLASS_NAME} tw-m-0 tw-mt-6 tw-p-5 sm:tw-p-6`}
      >
        <div
          role="img"
          aria-label="A day in UTC: keep the computer on from 00:15 to about 03:15. Signing stays open until 19:00."
        >
          <div className="tw-relative tw-h-9 tw-overflow-hidden tw-rounded-md tw-bg-iron-800/60">
            <div
              className="tw-absolute tw-inset-y-0 tw-bg-primary-500"
              style={{ left: at(DAY.signs), width: at(keepOn) }}
            />
            <div
              className="tw-absolute tw-inset-y-0 tw-bg-primary-500/25"
              style={{ left: at(DAY.keepOnUntil), width: at(stillCounts) }}
            />
          </div>
          <div className="tw-relative tw-mt-2 tw-h-5" aria-hidden="true">
            {DAY_TICKS.map((hour) => (
              <span
                key={hour}
                className={`tw-absolute tw-top-0 tw-text-xs tw-tabular-nums tw-text-iron-500 ${tickAlign(hour)}`}
                style={{ left: at(hour) }}
              >
                {String(hour).padStart(2, "0")}:00
              </span>
            ))}
          </div>
        </div>
        <figcaption className="tw-mt-4 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-gap-6">
          <span className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200">
            <span
              aria-hidden="true"
              className="tw-size-3 tw-flex-none tw-rounded-sm tw-bg-primary-500"
            />
            Keep it on: 00:15 to about 03:15 UTC
          </span>
          <span className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200">
            <span
              aria-hidden="true"
              className="tw-size-3 tw-flex-none tw-rounded-sm tw-bg-primary-500/25"
            />
            Signing stays open until 19:00 UTC
          </span>
        </figcaption>
      </figure>
    </section>
  );
}

function RaspberryPi() {
  return (
    <section aria-labelledby="raspberry-pi" className={SECTION}>
      <h2 id="raspberry-pi" className={SECTION_HEADING}>
        Raspberry Pi
      </h2>
      <div className="tw-mt-5 tw-grid tw-items-start tw-gap-5 md:tw-grid-cols-[minmax(0,1fr)_260px] md:tw-gap-8">
        <ul className="tw-m-0 tw-flex tw-list-disc tw-flex-col tw-gap-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-iron-500">
          {RASPBERRY_PI.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className={`${ABOUT_CARD_CLASS_NAME} tw-p-5`}>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
            Raspberry Pi 5, 8 GB
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-leading-8 tw-text-iron-50">
            {RASPBERRY_PI_PRICE.board}
          </p>
          <p className={`tw-m-0 ${SMALL}`}>for the board</p>
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            {RASPBERRY_PI_PRICE.kit} {RASPBERRY_PI_PRICE.kitIncludes}.
          </p>
          <p
            className={`tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-500`}
          >
            {RASPBERRY_PI_PRICE.store}, {PRICES_READ_ON}
          </p>
        </div>
      </div>
    </section>
  );
}

function PriceLine({
  price,
  unit,
}: {
  readonly price: string;
  readonly unit: string;
}) {
  return (
    <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2">
      <span className="tw-text-2xl tw-font-semibold tw-leading-8 tw-tracking-tight tw-text-iron-50">
        {price}
      </span>
      <span className="tw-text-sm tw-text-iron-400">{unit}</span>
    </p>
  );
}

function Tiers() {
  return (
    <section aria-labelledby="tiers" className={SECTION}>
      <h2 id="tiers" className={SECTION_HEADING}>
        If you buy a computer for it
      </h2>
      <p className={INTRO}>
        In the test phase, use what you have. For a computer that runs all day
        at home or in an office, 6529 suggests three tiers.
      </p>
      <ul className={`${CARD_ROW} lg:tw-grid-cols-3 lg:tw-gap-y-0`}>
        {TIERS.map((tier) => (
          <li
            key={tier.key}
            id={`tier-${tier.key}`}
            className={`tw-flex tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-p-5 lg:tw-row-span-4 lg:tw-grid lg:tw-grid-rows-subgrid ${
              tier.recommended
                ? "tw-border-primary-400/60 tw-bg-primary-500/[0.07]"
                : "tw-border-iron-800/50 tw-bg-iron-900/55"
            }`}
          >
            <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
              <h3 className={CARD_TITLE}>{tier.name}</h3>
              {tier.recommended && (
                <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
                  Recommended
                </span>
              )}
            </div>
            <p className="tw-mb-0 tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-300">
              {tier.what}
            </p>
            <Chips chips={tier.chips} />
            <div className="tw-pt-5">
              <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4">
                <PriceLine price={tier.buy} unit="to buy" />
                <p className={`tw-mb-0 tw-mt-1 ${SMALL}`}>{tier.month}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <dl className="tw-m-0 tw-mt-5 tw-grid tw-gap-x-6 tw-gap-y-2 md:tw-grid-cols-3">
        {TIER_TERMS.map((item) => (
          <div key={item.term} className={SMALL}>
            <dt className="tw-inline tw-font-semibold tw-text-iron-300">
              {item.term}:
            </dt>{" "}
            <dd className="tw-m-0 tw-inline">{item.meaning}</dd>
          </div>
        ))}
      </dl>
      <p className="tw-mb-0 tw-mt-4 tw-max-w-2xl tw-text-xs tw-leading-5 tw-text-iron-500">
        Prices read on {PRICES_READ_ON}. Monthly costs spread the price over
        four years and add power at the US average price.
      </p>
    </section>
  );
}

function DataCenter() {
  return (
    <section aria-labelledby="data-center" className={SECTION}>
      <h2 id="data-center" className={SECTION_HEADING}>
        If you can&apos;t run it at home
      </h2>
      <p className={INTRO}>
        Computers in homes and offices spread the network across more people and
        places, so 6529 suggests them first. A data center works too.
      </p>
      <ul className={`${CARD_ROW} md:tw-grid-cols-2 md:tw-gap-y-0`}>
        {DATA_CENTER.map((option) => (
          <li
            key={option.key}
            id={`data-center-${option.key}`}
            className={`${ABOUT_CARD_CLASS_NAME} tw-flex tw-flex-col tw-p-5 md:tw-row-span-4 md:tw-grid md:tw-grid-rows-subgrid`}
          >
            <h3 className={CARD_TITLE}>{option.name}</h3>
            <p className="tw-mb-0 tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-300">
              {option.what}
            </p>
            <Chips chips={option.chips} />
            <div className="tw-pt-5">
              <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4">
                <PriceLine price={option.price} unit={option.unit} />
                <p className={`tw-mb-0 tw-mt-1 ${SMALL}`}>{option.note}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SeveralMachines() {
  return (
    <section aria-labelledby="several-machines" className={SECTION}>
      <h2 id="several-machines" className={SECTION_HEADING}>
        {LARGE_HOLDERS.title}
      </h2>
      <p className={INTRO}>{LARGE_HOLDERS.note}</p>
      <ol className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-gap-3 tw-p-0 md:tw-grid-cols-2">
        {LARGE_HOLDERS.items.map((item, index) => (
          <li
            key={item.title}
            className={`${ABOUT_CARD_CLASS_NAME} tw-flex tw-gap-4 tw-p-5`}
          >
            <span
              aria-hidden="true"
              className="tw-flex tw-size-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-text-sm tw-font-semibold tw-text-iron-200"
            >
              {index + 1}
            </span>
            <div className="tw-min-w-0">
              <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-50">
                {item.title}
              </h3>
              <p className="tw-mb-0 tw-mt-1 tw-text-base tw-leading-7 tw-text-iron-300">
                {item.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Questions() {
  return (
    <section aria-labelledby="questions" className={SECTION}>
      <h2 id="questions" className={SECTION_HEADING}>
        Questions
      </h2>
      <dl className="tw-m-0 tw-mt-5 tw-grid tw-gap-x-8 tw-gap-y-6 md:tw-grid-cols-2">
        {QUESTIONS.map((item) => (
          <div key={item.question}>
            <dt className="tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-50">
              {item.question}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-base tw-leading-7 tw-text-iron-300">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Sources() {
  return (
    <section
      aria-labelledby="sources"
      className="tw-mt-14 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800/70 tw-pt-6 sm:tw-mt-16"
    >
      <h2
        id="sources"
        className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400"
      >
        Where the numbers come from
      </h2>
      <ul className="tw-m-0 tw-mt-3 tw-flex tw-list-none tw-flex-col tw-gap-1.5 tw-p-0">
        {SOURCES.map((line) => (
          <li key={line} className={`tw-max-w-3xl ${SMALL}`}>
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ValidatorHardwarePage({
  downloads,
}: {
  /** This release's files for each system card, from the release feed. */
  readonly downloads: HardwareDownloads;
}) {
  return (
    <ValidatorPageFrame current="hardware">
      <ValidatorPageHeader eyebrow="Hardware" title="Your Mac or PC is enough">
        <p className="tw-mb-0 tw-mt-4 tw-max-w-2xl tw-text-lg tw-leading-8 tw-text-iron-300">
          The validator runs on the computer you already have: a Mac with macOS
          11 or newer, or a 64-bit PC with Windows 10 or 11. Linux and a
          Raspberry Pi work too.
        </p>
        <Minimum />
        <div className="tw-mt-6">
          <Link
            href="/validator#download"
            className={`tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-primary-500 tw-px-5 tw-text-base tw-font-semibold tw-text-white tw-no-underline tw-transition hover:tw-bg-primary-600 ${FOCUS}`}
          >
            Download the validator
            <ArrowRightIcon aria-hidden="true" className="tw-size-5" />
          </Link>
        </div>
      </ValidatorPageHeader>
      <Systems downloads={downloads} />
      <Parts />
      <DayFigure />
      <RaspberryPi />
      <Tiers />
      <DataCenter />
      <SeveralMachines />
      <Questions />
      <Sources />
    </ValidatorPageFrame>
  );
}
