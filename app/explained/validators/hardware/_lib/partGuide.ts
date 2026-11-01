import type { SourceId } from "./sources";

/**
 * The part-by-part guide: for each part of the machine, a one-line answer,
 * what the validator uses (measured, or read from its code), what to get at
 * each of the five tiers, and what not to buy. Every line carries its
 * source, because most of them hold a number (`facts.tsx` prints them the
 * way it prints a fact). The tiers' lines agree with the card's chips; the
 * page test checks that.
 *
 * Measured on Oct 31, 2026, on a release build of 0.1.0. Two findings of
 * that day are fixed in the release and written here as fixed: blst is
 * built portable, so any 64-bit x86 processor runs it, and a node with the
 * 6529.io comparison off no longer keeps each day's records for a week.
 */
export interface Said {
  readonly text: string;
  readonly source: SourceId;
}

export type PartId =
  | "cpu"
  | "gpu"
  | "memory"
  | "storage"
  | "network"
  | "power"
  | "system";

export type PartTier = "acceptable" | "good" | "great" | "rack" | "cloud";

export const PART_TIERS: readonly PartTier[] = [
  "acceptable",
  "good",
  "great",
  "rack",
  "cloud",
];

interface PartDef {
  readonly id: PartId;
  /** The answer, first and short: "Not needed." */
  readonly answer: Said;
  /** Why, in one sentence. */
  readonly why: Said;
  /** What the validator uses, measured or read from its code. */
  readonly uses: readonly Said[];
  /** What to get at each tier, or one line for all of them. */
  readonly tiers: Readonly<Record<PartTier, Said>> | Said;
  /** What not to buy; a part whose answer is "Not needed." has none. */
  readonly avoid?: Said;
}

const s = (text: string, source: SourceId): Said => ({ text, source });

export const PARTS: readonly PartDef[] = [
  {
    id: "cpu",
    answer: s("Any 64-bit processor, old ones included.", "code"),
    why: s("The day’s TDH takes seconds, on two cores.", "bench"),
    uses: [
      s(
        "Each day the two TDH programs run side by side, one thread each, for about 2–8 seconds on a 48-thread server. Between days the validator uses about 1% of one core.",
        "bench"
      ),
      s(
        "Reading Ethereum uses up to 6 threads, which mostly wait on the network.",
        "code"
      ),
      s(
        "A Raspberry Pi 5 is several times slower per core, so expect tens of seconds (an estimate: no Pi was measured). The vote can be signed any time from about 00:15 to 19:00 UTC.",
        "benchEstimate"
      ),
      s(
        "Release 0.1.0 runs on any 64-bit x86 processor, old ones included, and on 64-bit Arm. The Linux x86 build is checked on an emulated 2010 Intel processor before each release.",
        "code"
      ),
    ],
    tiers: {
      acceptable: s("4 cores. 2 work too.", "card"),
      good: s(
        "4–8 cores: an Intel N150 or a small Ryzen. The spare cores serve Tor and the system.",
        "card"
      ),
      great: s(
        "8 cores, for the Ethereum node. EIP-7870 asks for at least 4 cores and 8 threads.",
        "eip7870"
      ),
      rack: s(
        "8–16 cores, for its own node and for serving other validators.",
        "card"
      ),
      cloud: s(
        "2–4 vCPU. Burstable types are fine: the daily average stays far below their baseline.",
        "card"
      ),
    },
    avoid: s(
      "A faster or bigger processor for the validator alone. It saves seconds a day.",
      "bench"
    ),
  },
  {
    id: "gpu",
    answer: s("Not needed.", "code"),
    why: s("Nothing in the validator uses a GPU.", "code"),
    uses: [
      s(
        "None of the 823 packages in the validator’s lock file is a GPU library, and none of its code calls one.",
        "code"
      ),
      s(
        "GPUs appear in 6529 only for the zero-knowledge proofs of each day’s result, which 6529 plans to make on GPUs it rents. Making proofs is not a validator’s job.",
        "proofs"
      ),
      s(
        "Release 0.1 does not check proofs. Checking them is planned for a later release, on the processor: a check takes milliseconds.",
        "proofs"
      ),
    ],
    tiers: s(
      "None. A machine without a graphics card draws less power.",
      "code"
    ),
  },
  {
    id: "memory",
    answer: s("8 GB is plenty.", "card"),
    why: s("The validator peaks at about 2 GB, once a day.", "bench"),
    uses: [
      s("About 47 MB at start, with Tor connected.", "bench"),
      s(
        "1.5–2 GB at the daily peak, while both TDH programs hold the day’s records: about 10,000 identities, 416,000 logs and 391,000 transfers.",
        "bench"
      ),
      s("The optional third check, in Python, adds up to 590 MB.", "docs"),
    ],
    tiers: {
      acceptable: s(
        "8 GB. A 4 GB machine runs the validator too, with little room for anything else.",
        "card"
      ),
      good: s("16 GB: room for the Python check and other programs.", "card"),
      great: s(
        "32 GB, most of it for the Ethereum node. 16 GB is tight for a node.",
        "ethdockerHw"
      ),
      rack: s("32–64 GB, for its own node.", "card"),
      cloud: s("8–16 GB. 8 GB is enough.", "card"),
    },
    avoid: s(
      "A board with 2 GB or less. ECC memory for a validator without a node: a memory error would most likely make its two programs disagree, and it would skip that day’s vote.",
      "p53"
    ),
  },
  {
    id: "storage",
    answer: s("Any SSD. A hard disk works too.", "benchEstimate"),
    why: s(
      "The validator keeps under 1 GB in its first year, and writes little.",
      "benchEstimate"
    ),
    uses: [
      s(
        "About 0.5 GB after a year: the program (55 MB), Ethereum history (129 MB since October 2021, growing 1–3 MB a month) and the day’s TDH weights (about 0.64 MB a day).",
        "benchEstimate"
      ),
      s(
        "Every validator’s daily vote and reports add about 4 MB a year for each validator on the network.",
        "benchEstimate"
      ),
      s(
        "Days older than six years are dropped, so the total levels at about 2 GB at today’s number of holders, plus the votes.",
        "benchEstimate"
      ),
      s(
        "It keeps each vote, report and certificate it receives as a small file of its own, so the number of files grows with the number of validators. It keeps no copy of Ethereum’s blocks or receipts.",
        "code"
      ),
    ],
    tiers: {
      acceptable: s(
        "256–512 GB SSD, or the drive the machine has. On a Raspberry Pi, an NVMe HAT or a USB 3 SSD rather than the SD card.",
        "card"
      ),
      good: s(
        "1–2 TB NVMe. 512 GB is enough for the validator alone; an Ethereum node needs a 4 TB drive of its own.",
        "card"
      ),
      great: s(
        "4 TB NVMe, TLC with DRAM, for the node. ethereum.org expects 2 TB to be too small by 2027.",
        "ethOrg"
      ),
      rack: s("NVMe in RAID; 4–8 TB with its own Ethereum node.", "card"),
      cloud: s("100–200 GB SSD. The validator needs a few GB of it.", "card"),
    },
    avoid: s(
      "A big drive for the validator alone. For a node: a hard disk, a QLC drive or a DRAM-less one.",
      "ethOrg"
    ),
  },
  {
    id: "network",
    answer: s("Any home broadband. No port to open.", "modes"),
    why: s(
      "About 15–20 GB a month, and the validator only connects out.",
      "measured"
    ),
    uses: [
      s(
        "About 0.5 GB a day, 15–20 GB a month, from the default Ethereum servers, which compress.",
        "measured"
      ),
      s(
        "The 50 GB a month above is the receipts’ size in Ethereum’s own encoding (47–56 GB). Servers send them as JSON, about 175 GB a month; the default servers compress that about 11 times.",
        "measured"
      ),
      s(
        "Its own upload is under 1 GB a month: requests, and a vote of about 200 bytes a day. An estimate, not yet measured.",
        "benchEstimate"
      ),
      s(
        "At home it only connects out, through its built-in Tor. No port forwarding, and it works behind a provider’s shared address (CGNAT).",
        "modes"
      ),
      s(
        "Wi-Fi works. The vote can go out any time in a window of about 19 hours, so a short drop costs nothing.",
        "p53"
      ),
    ],
    tiers: {
      acceptable: s("Any home connection. Wi-Fi is fine.", "card"),
      good: s("Wired Ethernet to the router, for fewer drops.", "card"),
      great: s(
        "Unmetered and wired: 50 Mbps down and 15 Mbps up for the node, which uploads 1.6–2.5 TB a month.",
        "eip7870"
      ),
      rack: s(
        "A datacenter link, with the TCP port you set open to other validators, and the same UDP port if you list a QUIC address.",
        "modes"
      ),
      cloud: s("Any. Data coming in is free at every provider.", "cloudAll"),
    },
    avoid: s(
      "A faster plan for the validator. On a metered, mobile or satellite plan, check that 15–20 GB a month fits.",
      "measured"
    ),
  },
  {
    id: "power",
    answer: s("A machine that idles low and stays on.", "card"),
    why: s(
      "It idles nearly all day, so its idle draw is what you pay for.",
      "benchEstimate"
    ),
    uses: [
      s(
        "The validator’s own work adds about 0.5 kWh a year: seconds of computing and minutes of reading a day.",
        "benchEstimate"
      ),
      s(
        "It needs about three hours on each day, inside 00:15 to 19:00 UTC: minutes to sign, then at home a random wait of up to two hours before its vote goes out. Offline is not a fault: you miss that day’s vote, and your account stays registered for seven days without one.",
        "p53"
      ),
      s(
        "Its files survive a crash or a power cut, which costs at most that day’s vote. An Ethereum node can damage its database if it stops suddenly.",
        "geth"
      ),
    ],
    tiers: {
      acceptable: s(
        "What your machine draws: about 3 W for a Raspberry Pi 5, up to 75 W for an older desktop tower. A UPS is optional.",
        "power"
      ),
      good: s("8–20 W, with a small UPS that also powers the router.", "card"),
      great: s(
        "15–30 W, with a UPS, so a short power cut doesn’t stop the Ethereum node mid-write.",
        "card"
      ),
      rack: s("Redundant power, from the datacenter.", "card"),
      cloud: s("Nothing to plan: the provider runs the power.", "card"),
    },
    avoid: s(
      "A desktop tower to run only a validator. At 40–75 W it costs $64–119 a year in power; a mini PC costs $8–18.",
      "power"
    ),
  },
  {
    id: "system",
    answer: s("Linux, macOS or Windows, 64-bit.", "docs"),
    why: s("One program, with nothing else to install.", "docs"),
    uses: [
      s(
        "Linux on x86 or Arm with glibc 2.35 or newer: Ubuntu 22.04, Debian 12, Fedora 36, 64-bit Raspberry Pi OS (Trixie or Bookworm), or newer.",
        "rpiOs"
      ),
      s(
        "macOS 11 or newer, on Apple silicon or Intel. Windows 10 (1809 or newer) or 11, on x64.",
        "docs"
      ),
      s("Not supported: 32-bit systems, and Windows on Arm.", "code"),
      s(
        "A virtual machine on a home server works like any Linux machine. Keep its clock in sync, and never restore a snapshot of a running validator: the copy can sign a day twice.",
        "p53"
      ),
    ],
    tiers: {
      acceptable: s(
        "A laptop or desktop you own, or a Raspberry Pi 5 with 8 GB.",
        "card"
      ),
      good: s(
        "A mini PC: an Intel N150, a small Ryzen, or a refurbished business mini PC. A Mac mini works too.",
        "card"
      ),
      great: s(
        "A mini PC or small server with 8 cores, 32 GB and a 4 TB NVMe drive.",
        "card"
      ),
      rack: s("A rented or colocated bare-metal server.", "card"),
      cloud: s("A Linux VM, on x86 or Arm.", "card"),
    },
    avoid: s(
      "A 32-bit board or system, and a Windows on Arm laptop for the validator.",
      "code"
    ),
  },
];

/** Drive types, for the validator alone and with your own Ethereum node. */
interface DriveRow {
  readonly id: "hdd" | "sd" | "emmc" | "sata" | "nvme";
  readonly drive: string;
  readonly alone: string;
  readonly node: string;
  readonly source: SourceId;
}

export const DRIVES: readonly DriveRow[] = [
  {
    id: "hdd",
    drive: "Hard disk (HDD)",
    alone: "Works. Its writes are small and in order.",
    node: "No. A node’s database needs fast random reads.",
    source: "ethdockerHw",
  },
  {
    id: "sd",
    drive: "SD card (Raspberry Pi)",
    alone:
      "Works. Boot from an SSD if you can: cards wear out and can fail without warning.",
    node: "No.",
    source: "docs",
  },
  {
    id: "emmc",
    drive: "eMMC, built into some mini PCs",
    alone: "Works.",
    node: "No. Too small and too slow.",
    source: "ethOrg",
  },
  {
    id: "sata",
    drive: "SATA SSD",
    alone: "Good.",
    node: "Possible if it is TLC with DRAM. NVMe is the norm.",
    source: "ethdockerHw",
  },
  {
    id: "nvme",
    drive: "NVMe SSD",
    alone: "Good. A small one is the best value.",
    node: "Needed: 4 TB, TLC with DRAM.",
    source: "ethOrg",
  },
];

/** What machines draw at idle, and a year of that at the EIA's US average. */
interface IdleRow {
  readonly id: "pi5" | "n150" | "macmini" | "business" | "tower";
  readonly machine: string;
  readonly watts: string;
  readonly year: string;
}

export const IDLE: readonly IdleRow[] = [
  { id: "pi5", machine: "Raspberry Pi 5, 8 GB", watts: "3.2 W", year: "$5" },
  { id: "macmini", machine: "Mac mini M4", watts: "4 W", year: "$6" },
  {
    id: "n150",
    machine: "Intel N150 mini PC",
    watts: "5–11 W",
    year: "$8–18",
  },
  {
    id: "business",
    machine: "Refurbished business mini PC",
    watts: "5–13 W",
    year: "$8–21",
  },
  {
    id: "tower",
    machine: "Older desktop tower",
    watts: "40–75 W",
    year: "$64–119",
  },
];

/** Turning off sleep, for a laptop or desktop that runs the validator. */
export const SLEEP: readonly { readonly os: string; readonly cmd: string }[] = [
  { os: "macOS", cmd: "sudo pmset -c sleep 0" },
  { os: "Windows", cmd: "powercfg /change standby-timeout-ac 0" },
  {
    os: "Linux",
    cmd: "sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target",
  },
];

/** Where extra money helps, in order. */
export const SPEND: readonly Said[] = [
  s("An SSD instead of an SD card or a worn disk.", "benchEstimate"),
  s("A small UPS that also powers the router.", "card"),
  s("Wired Ethernet.", "card"),
  s("8–16 GB of memory.", "card"),
  s("Only then a faster processor, which saves seconds a day.", "bench"),
];
