// The hardware page at /validator/hardware. Every fact here holds for
// 0.1.0-rc.5 (commit 29a8caf): systems from its install guide and package
// checks, memory and disk measured on rc.5 on 2026-11-03, the first start
// from 6529's mainnet join test that day. Prices were read on 2026-10-31.

/** The day the rc.5 measurements on this page were made. */
export const MEASURED_ON = "3 November 2026";
/** The day the prices on this page were read. */
export const PRICES_READ_ON = "31 October 2026";

/** The four things a computer needs, under the page's title. */
export const MINIMUM: readonly {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}[] = [
  {
    label: "Memory",
    value: "8 GB",
    detail: "The validator uses under 2 GB at its daily peak.",
  },
  {
    label: "Disk",
    value: "1 GB free",
    detail: "Any drive. It starts at about 140 MB.",
  },
  {
    label: "Internet",
    value: "Home internet",
    detail: "About 50 GB a month. No port to open.",
  },
  {
    label: "Time on",
    value: "3 hours a day",
    detail: "From 00:15 UTC, with sleep turned off.",
  },
];

type HardwareSystem = "mac" | "windows" | "linux";

/** Which systems run rc.5, in plain words, with how to check each. */
export const SYSTEMS: readonly {
  readonly key: HardwareSystem;
  readonly title: string;
  readonly download: string;
  readonly image: string;
  readonly works: string;
  readonly check: string;
  readonly note: string;
}[] = [
  {
    key: "mac",
    title: "Mac",
    download: "Download for Mac",
    image: "/macos.png",
    works: "macOS 11 Big Sur or newer, on Apple silicon or an Intel processor.",
    check: "To check, open the Apple menu and choose About This Mac.",
    note: "It signs while you are logged in and the Mac is awake.",
  },
  {
    key: "windows",
    title: "Windows PC",
    download: "Download for Windows",
    image: "/windows.png",
    works:
      "Windows 10 (version 1809 or later) or Windows 11, 64-bit, on an Intel or AMD processor.",
    check:
      "To check, open Settings › System › About. System type should say 64-bit and x64.",
    note: "On an ARM processor, Windows 11 runs it through emulation, which 6529 hasn't tested. Windows 10 on ARM can't run it.",
  },
  {
    key: "linux",
    title: "Linux",
    download: "Download for Linux",
    image: "/linux.png",
    works:
      "Ubuntu 22.04, Debian 12 or Linux Mint 21 or newer, on Intel, AMD or ARM. Fedora 36 or newer on Intel or AMD.",
    check: "A Raspberry Pi 4 or 5 works with the 64-bit Raspberry Pi OS.",
    note: "Older Linux releases can't run it.",
  },
];

/** What each part of the computer needs, with the reason. */
export const PARTS: readonly {
  readonly key: string;
  readonly part: string;
  readonly answer: string;
  readonly why: string;
}[] = [
  {
    key: "cpu",
    part: "Processor (CPU)",
    answer: "Any 64-bit processor, old ones included.",
    why: "The day's calculation takes a few seconds. The rest of the day the validator mostly waits.",
  },
  {
    key: "gpu",
    part: "Graphics card (GPU)",
    answer: "None needed.",
    why: "Nothing in the validator uses a graphics card. A computer without one uses less power.",
  },
  {
    key: "memory",
    part: "Memory (RAM)",
    answer: "8 GB is plenty.",
    why: "The validator uses under 2 GB for the few seconds it calculates the day, and under 400 MB the rest of the time.",
  },
  {
    key: "storage",
    part: "Storage",
    answer: "Any drive: an SSD, a hard disk or an SD card.",
    why: "It needs about 140 MB to start and adds about 25 MB a month. It writes little, so a hard disk is fine.",
  },
  {
    key: "internet",
    part: "Internet",
    answer: "Any home connection. Wi-Fi is fine.",
    why: "It downloads about 50 GB a month, by 6529's estimate, and opens no port on your router. On a capped plan, check that this fits.",
  },
  {
    key: "power",
    part: "Power",
    answer: "On and awake for about three hours a day.",
    why: "A mini PC left on all day uses about $1.60 of power a month at the US average price.",
  },
  {
    key: "first-start",
    part: "First start",
    answer: "Leave it on for about an hour.",
    why: "A new validator downloads the network's history and checks it before it can sign. In 6529's tests on 3 November this took 50 to 63 minutes.",
  },
];

/** The day, in UTC, for the timeline figure. Hours from midnight. */
export const DAY = {
  signs: 0.25,
  keepOnUntil: 3.25,
  windowCloses: 19,
} as const;

/** The Raspberry Pi, in brief. */
export const RASPBERRY_PI: readonly string[] = [
  "A Raspberry Pi 4 or 5 runs the validator with the 64-bit Raspberry Pi OS.",
  "8 GB of memory is best. 4 GB works with little to spare, and 2 GB is too small.",
  "Start it from an SSD if you can. SD cards wear out.",
  "A Pi 5 draws about 3 W, about $5 of power a year.",
];

export const RASPBERRY_PI_PRICE = {
  board: "$175",
  kit: "About $300",
  kitIncludes: "with a power supply, a 256 GB SSD, a cooler and a case",
  store: "PiShop.us",
};

type HardwareTier = "acceptable" | "good" | "great";

/**
 * The owner's approved tiers (2026-10-31), in their words, with that day's
 * store prices. Monthly costs spread the price over 48 months and add power
 * at the EIA's US average for August 2026, 18.16 cents a kWh.
 */
export const TIERS: readonly {
  readonly key: HardwareTier;
  readonly name: string;
  readonly what: string;
  readonly chips: readonly string[];
  readonly buy: string;
  readonly month: string;
  readonly recommended?: boolean;
}[] = [
  {
    key: "acceptable",
    name: "Acceptable",
    what: "A PC you already own, or a Raspberry Pi 5.",
    chips: ["4 cores", "8 GB RAM", "256–512 GB SSD"],
    buy: "$0–300",
    month: "About $7 a month for a new Pi.",
  },
  {
    key: "good",
    name: "Good",
    what: "A mini PC (Intel N150 or a small Ryzen) on wired Ethernet, with a small UPS.",
    chips: ["4–8 cores", "16 GB RAM", "1–2 TB NVMe", "8–20 W"],
    buy: "$400–550",
    month: "About $10–13 a month.",
    recommended: true,
  },
  {
    key: "great",
    name: "Great",
    what: "A home server that also runs its own Ethereum node.",
    chips: ["8 cores", "32 GB RAM", "4 TB NVMe", "UPS", "15–30 W"],
    buy: "$2,000–2,200",
    month: "About $44–50 a month.",
  },
];

/** Plain meanings of the words on the tier cards. */
export const TIER_TERMS: readonly {
  readonly term: string;
  readonly meaning: string;
}[] = [
  { term: "NVMe", meaning: "a fast SSD that plugs straight into the board." },
  {
    term: "UPS",
    meaning:
      "a battery that keeps the computer and router on through short power cuts.",
  },
  {
    term: "Ethereum node",
    meaning:
      "a program that keeps its own copy of Ethereum. The validator doesn't need one.",
  },
];

/** The two data-center options, for those who can't run one at home. */
export const DATA_CENTER: readonly {
  readonly key: string;
  readonly name: string;
  readonly what: string;
  readonly chips: readonly string[];
  readonly price: string;
  readonly unit: string;
  readonly note: string;
}[] = [
  {
    key: "cloud",
    name: "Cloud VM",
    what: "A virtual machine at a provider such as AWS, Google Cloud, Azure, Hetzner or DigitalOcean.",
    chips: ["2–4 processors", "8–16 GB RAM", "100–200 GB SSD"],
    price: "$10–80",
    unit: "a month with 8 GB",
    note: "Install it with the default settings, the same as at home.",
  },
  {
    key: "rack",
    name: "Rack server",
    what: "A server you rent or own in a data center, with its own Ethereum node if you want one.",
    chips: ["8–16 cores", "32–64 GB RAM", "4–8 TB NVMe"],
    price: "$192",
    unit: "a month, rented",
    note: "Install it with the default settings too. With Tor off, it needs a peer's address from 6529 to join.",
  },
];

/** The owner's approved words for large holders (2026-10-31), verbatim. */
export const LARGE_HOLDERS = {
  title: "One account, several machines",
  note: "For those who can afford to run multiple validators, it improves network decentralization. This is not necessary in this test phase.",
  items: [
    {
      title: "Keep one account",
      body: "Keep your wallets consolidated. Splitting does not create any decentralization or economic benefit.",
    },
    {
      title: "Run several validators in distinct locations",
      body: "One account can authorize up to 16 keys, each with its own share of your TDH weight.",
    },
    {
      title: "Spread them out",
      body: "Home and datacenter, different providers, countries and Ethereum data sources.",
    },
    {
      title: "One key, one machine",
      body: "Never use the same key for different machines, as it could accidentally lead to a double vote, excluding your whole account.",
    },
  ],
} as const;

export const QUESTIONS: readonly {
  readonly question: string;
  readonly answer: string;
}[] = [
  {
    question: "Can I use a laptop?",
    answer:
      "Yes. Keep it plugged in, with the lid open and sleep turned off for at least three hours from 00:15 UTC.",
  },
  {
    question: "Can I turn it off at night?",
    answer:
      "Yes, if it was on for about three hours from 00:15 UTC. A missed day costs only that day's signature, and your account keeps counting while it signs at least once every seven days.",
  },
  {
    question: "Do I need ETH, or my own Ethereum node?",
    answer:
      "No. Nothing is staked. The validator reads public Ethereum servers and checks every answer itself.",
  },
  {
    question: "Will other people see my home address?",
    answer:
      "Not with the default settings. At home the validator connects out through Tor, which is built in, and opens no port.",
  },
];

/** Where the page's numbers come from. */
export const SOURCES: readonly string[] = [
  `Memory, disk and the first start: measured on the test release (0.1.0-rc.5, commit 29a8caf) on ${MEASURED_ON}, on 6529's validators and on a fresh install with the default settings.`,
  "Internet: 6529's estimate of a month of Ethereum data, in the validator's specification.",
  `Prices: store and provider pages, read on ${PRICES_READ_ON}. Power at 18.16 cents a kWh, the US average for August 2026 (EIA).`,
];
