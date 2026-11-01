import type { SourceId } from "./sources";

/**
 * Cloud VMs and servers for a node: each provider, the types priced there
 * on October 31, 2026, and what each costs a month all in. Each provider names
 * the source its prices were read from (`sources.ts`).
 */
const V2_8GIB = "2 vCPU, 8 GiB";
const V2_8GB = "2 vCPU, 8 GB";
const V4_8GB = "4 vCPU, 8 GB";
const AMPERE_ALTRA = "Ampere Altra";
const SHARED = "No, shared cores";

/** Cloud VMs: each provider and the types priced there. */
export type Arch = "arm" | "x86";

export const ARCH_LABEL: Readonly<Record<Arch, string>> = {
  arm: "Arm",
  x86: "x86",
};

export interface CloudRow {
  readonly id: string;
  /** The type as the provider names it. */
  readonly type: string;
  /** The provider's family name, when the type is an API id. */
  readonly family?: string;
  readonly cpu: string;
  readonly arch: Arch;
  readonly size: string;
  readonly disk: string;
  readonly burst: string;
  readonly machine: string;
  /** All in: machine, disk, a public IPv4 address and 50 GB out. */
  readonly total: string;
  /** For sorting and the cheapest pick. */
  readonly totalUsd: number;
  /** A second total, such as Google's Premium Tier networking. */
  readonly totalNote?: string;
  /** False when the provider does not sell it today. */
  readonly orderable: boolean;
  /**
   * False for a type the summary never picks, though it costs least:
   * Oracle's Always Free A1, which Oracle may reclaim when it looks idle.
   */
  readonly summary?: false;
}

export interface CloudProvider {
  readonly id: string;
  readonly name: string;
  /** A shorter name for the provider buttons, when the name is long. */
  readonly tab?: string;
  readonly region: string;
  readonly source: SourceId;
  /**
   * The types are API ids ("t4g.large"), set in the code face; otherwise
   * product names ("Basic, Regular"), set in the text face.
   */
  readonly typeIsId: boolean;
  /** How the total is made up, and what to know: from the source. */
  readonly notes: readonly string[];
  readonly rows: readonly CloudRow[];
}

const AWS_EXTRAS = "100 GB gp3, $8.00";
const AZURE_EXTRAS = "128 GiB SSD, $9.60";
const GCP_EXTRAS = "100 GB, $10.00";

export const CLOUD: readonly CloudProvider[] = [
  {
    id: "aws",
    name: "AWS",
    region: "US East (N. Virginia)",
    source: "aws",
    typeIsId: true,
    notes: [
      "Totals add 100 GB of gp3 disk ($8.00) and a public IPv4 address ($3.65). The first 100 GB out each month are free.",
      "If a t-type’s 24-hour average ever passes its baseline, AWS bills the extra at $0.04 (t4g) or $0.05 (t3a) per vCPU-hour.",
    ],
    rows: [
      {
        id: "t4g.large",
        type: "t4g.large",
        cpu: "Graviton2",
        arch: "arm",
        size: V2_8GIB,
        disk: AWS_EXTRAS,
        burst: "Yes, 30% baseline",
        machine: "$49.06",
        total: "$60.71",
        totalUsd: 60.71,
        orderable: true,
      },
      {
        id: "t3a.large",
        type: "t3a.large",
        cpu: "AMD EPYC",
        arch: "x86",
        size: V2_8GIB,
        disk: AWS_EXTRAS,
        burst: "Yes, 30% baseline",
        machine: "$54.90",
        total: "$66.55",
        totalUsd: 66.55,
        orderable: true,
      },
      {
        id: "m7g.large",
        type: "m7g.large",
        cpu: "Graviton3",
        arch: "arm",
        size: V2_8GIB,
        disk: AWS_EXTRAS,
        burst: "No",
        machine: "$59.57",
        total: "$71.22",
        totalUsd: 71.22,
        orderable: true,
      },
      {
        id: "m6a.large",
        type: "m6a.large",
        cpu: "AMD EPYC",
        arch: "x86",
        size: V2_8GIB,
        disk: AWS_EXTRAS,
        burst: "No",
        machine: "$63.07",
        total: "$74.72",
        totalUsd: 74.72,
        orderable: true,
      },
      {
        id: "t4g.xlarge",
        type: "t4g.xlarge",
        cpu: "Graviton2",
        arch: "arm",
        size: "4 vCPU, 16 GiB",
        disk: AWS_EXTRAS,
        burst: "Yes, 40% baseline",
        machine: "$98.11",
        total: "$109.76",
        totalUsd: 109.76,
        orderable: true,
      },
    ],
  },
  {
    id: "gcp",
    name: "Google Cloud",
    region: "us-central1 (Iowa)",
    source: "gcp",
    typeIsId: true,
    notes: [
      "Totals add a 100 GB balanced disk ($10.00; C4A takes Hyperdisk, $8.00) and a public IPv4 address ($3.65).",
      "Totals use Standard Tier networking, whose first 200 GiB out a month are free. Premium Tier, the default, adds $5.47 for 50 GB (46.6 GiB, the first 1 GiB free).",
      "N2D gets a sustained-use discount when it runs the whole month: $49.36 instead of $61.69.",
    ],
    rows: [
      {
        id: "e2-standard-2",
        type: "e2-standard-2",
        cpu: "Intel or AMD",
        arch: "x86",
        size: V2_8GB,
        disk: GCP_EXTRAS,
        burst: "No",
        machine: "$48.92",
        total: "$62.57",
        totalUsd: 62.57,
        totalNote: "$68.04 on Premium Tier",
        orderable: true,
      },
      {
        id: "n2d-standard-2",
        type: "n2d-standard-2",
        cpu: "AMD EPYC",
        arch: "x86",
        size: V2_8GB,
        disk: GCP_EXTRAS,
        burst: "No",
        machine: "$49.36",
        total: "$63.01",
        totalUsd: 63.01,
        totalNote: "$68.48 on Premium Tier",
        orderable: true,
      },
      {
        id: "t2a-standard-2",
        type: "t2a-standard-2",
        cpu: AMPERE_ALTRA,
        arch: "arm",
        size: V2_8GB,
        disk: GCP_EXTRAS,
        burst: "No",
        machine: "$56.21",
        total: "$69.86",
        totalUsd: 69.86,
        totalNote: "$75.33 on Premium Tier",
        orderable: true,
      },
      {
        id: "c4a-standard-2",
        type: "c4a-standard-2",
        cpu: "Google Axion",
        arch: "arm",
        size: V2_8GB,
        disk: "100 GB Hyperdisk, $8.00",
        burst: "No",
        machine: "$65.55",
        total: "$77.20",
        totalUsd: 77.2,
        totalNote: "$82.67 on Premium Tier",
        orderable: true,
      },
    ],
  },
  {
    id: "azure",
    name: "Azure",
    region: "East US",
    source: "azure",
    typeIsId: false,
    notes: [
      "Totals add a 128 GiB Standard SSD ($9.60) and a public IPv4 address ($3.65). The first 100 GB out each month are free.",
      "B-series types slow to their base speed when their credits run out, instead of billing more.",
    ],
    rows: [
      {
        id: "B2ps-v2",
        type: "B2ps v2",
        cpu: AMPERE_ALTRA,
        arch: "arm",
        size: V2_8GIB,
        disk: AZURE_EXTRAS,
        burst: "Yes, 40% baseline",
        machine: "$49.06",
        total: "$62.31",
        totalUsd: 62.31,
        orderable: true,
      },
      {
        id: "D2ps-v6",
        type: "D2ps v6",
        cpu: "Azure Cobalt 100",
        arch: "arm",
        size: V2_8GIB,
        disk: AZURE_EXTRAS,
        burst: "No",
        machine: "$51.25",
        total: "$64.50",
        totalUsd: 64.5,
        orderable: true,
      },
      {
        id: "B2as-v2",
        type: "B2as v2",
        cpu: "AMD EPYC",
        arch: "x86",
        size: V2_8GIB,
        disk: AZURE_EXTRAS,
        burst: "Yes, 40% baseline",
        machine: "$54.90",
        total: "$68.15",
        totalUsd: 68.15,
        orderable: true,
      },
      {
        id: "D2as-v6",
        type: "D2as v6",
        cpu: "AMD EPYC",
        arch: "x86",
        size: V2_8GIB,
        disk: AZURE_EXTRAS,
        burst: "No",
        machine: "$66.28",
        total: "$79.53",
        totalUsd: 79.53,
        orderable: true,
      },
    ],
  },
  {
    id: "hetzner",
    name: "Hetzner",
    region: "Germany and Finland; CPX31 in the US",
    source: "hetzner",
    typeIsId: false,
    notes: [
      "Prices include the disk, a public IPv4 address and 20 TB of traffic in the EU (1–3 TB in the US). Converted at 1 EUR = 1.1172 USD.",
      "Hetzner raised cloud prices in 2026, most sharply on June 15. Its own pages showed CX and CAX as not available on October 31, 2026.",
      "That CPX and CCX could be ordered rests on third-party checks of October 13 and 20, 2026. Check in Hetzner’s console before you plan on one.",
    ],
    rows: [
      {
        id: "CX33",
        type: "CX33",
        cpu: "Intel or AMD, shared",
        arch: "x86",
        size: V4_8GB,
        disk: "80 GB, included",
        burst: SHARED,
        machine: "€8.99",
        total: "$10.04",
        totalUsd: 10.04,
        orderable: false,
      },
      {
        id: "CAX21",
        type: "CAX21",
        cpu: "Ampere, shared",
        arch: "arm",
        size: V4_8GB,
        disk: "80 GB, included",
        burst: SHARED,
        machine: "€10.99",
        total: "$12.28",
        totalUsd: 12.28,
        orderable: false,
      },
      {
        id: "CPX32",
        type: "CPX32",
        cpu: "AMD, shared",
        arch: "x86",
        size: V4_8GB,
        disk: "160 GB, included",
        burst: SHARED,
        machine: "€35.99",
        total: "$40.21",
        totalUsd: 40.21,
        orderable: true,
      },
      {
        id: "CCX13",
        type: "CCX13",
        cpu: "AMD, dedicated",
        arch: "x86",
        size: V2_8GB,
        disk: "80 GB, included",
        burst: "No",
        machine: "€43.49",
        total: "$48.59",
        totalUsd: 48.59,
        orderable: true,
      },
      {
        id: "CPX31-us",
        type: "CPX31 (US)",
        cpu: "AMD, shared",
        arch: "x86",
        size: V4_8GB,
        disk: "160 GB, included",
        burst: SHARED,
        machine: "€62.99",
        total: "$70.37",
        totalUsd: 70.37,
        orderable: true,
      },
    ],
  },
  {
    id: "digitalocean",
    name: "DigitalOcean",
    region: "Same price in every region",
    source: "digitalocean",
    typeIsId: false,
    notes: [
      "IPv4 and transfer are included. No Arm droplets.",
      "A Basic droplet with 2 vCPU and 4 GiB costs $24: below the 8 GB of the tier, and enough for a test.",
    ],
    rows: [
      {
        id: "basic-regular",
        type: "Basic, Regular",
        cpu: "Shared",
        arch: "x86",
        size: "4 vCPU, 8 GiB",
        disk: "160 GiB, 5,000 GiB transfer",
        burst: SHARED,
        machine: "$48.00",
        total: "$48.00",
        totalUsd: 48,
        orderable: true,
      },
      {
        id: "general-purpose",
        type: "General Purpose",
        cpu: "Dedicated",
        arch: "x86",
        size: V2_8GIB,
        disk: "25 GiB plus a 100 GiB volume, $10.00",
        burst: "No",
        machine: "$63.00",
        total: "$73.00",
        totalUsd: 73,
        orderable: true,
      },
    ],
  },
  {
    id: "vultr",
    name: "Vultr",
    region: "Same price everywhere except São Paulo, 50% more",
    source: "vultr",
    typeIsId: true,
    notes: ["IPv4 is included. No Arm plans."],
    rows: [
      {
        id: "vc2-4c-8gb",
        type: "vc2-4c-8gb",
        family: "Cloud Compute Regular",
        cpu: "Intel, shared",
        arch: "x86",
        size: V4_8GB,
        disk: "160 GB SSD, 4 TB transfer",
        burst: SHARED,
        machine: "$40.00",
        total: "$40.00",
        totalUsd: 40,
        orderable: true,
      },
      {
        id: "vhp-4c-8gb-amd",
        type: "vhp-4c-8gb-amd",
        family: "High Performance",
        cpu: "AMD, shared",
        arch: "x86",
        size: V4_8GB,
        disk: "180 GB NVMe, 6 TB transfer",
        burst: SHARED,
        machine: "$48.00",
        total: "$48.00",
        totalUsd: 48,
        orderable: true,
      },
      {
        id: "voc-g-2c-8gb",
        type: "voc-g-2c-8gb-50s-amd",
        family: "Optimized General Purpose",
        cpu: "AMD, dedicated",
        arch: "x86",
        size: V2_8GB,
        disk: "50 GB NVMe plus 100 GB block, $10.00",
        burst: "No",
        machine: "$60.00",
        total: "$70.00",
        totalUsd: 70,
        orderable: true,
      },
    ],
  },
  {
    id: "akamai",
    name: "Akamai (Linode)",
    tab: "Akamai",
    region: "Core regions; Jakarta 20% more, São Paulo 40% more",
    source: "akamai",
    typeIsId: true,
    notes: ["IPv4 is included. No Arm plans."],
    rows: [
      {
        id: "g6-standard-4",
        type: "g6-standard-4",
        family: "Linode 8GB",
        cpu: "Shared",
        arch: "x86",
        size: V4_8GB,
        disk: "160 GB, 5 TB transfer",
        burst: SHARED,
        machine: "$48.00",
        total: "$48.00",
        totalUsd: 48,
        orderable: true,
      },
      {
        id: "g6-dedicated-4",
        type: "g6-dedicated-4",
        family: "Dedicated 8GB",
        cpu: "Dedicated",
        arch: "x86",
        size: V4_8GB,
        disk: "160 GB, 5 TB transfer",
        burst: "No",
        machine: "$72.00",
        total: "$72.00",
        totalUsd: 72,
        orderable: true,
      },
      {
        id: "g8-dedicated-8-2",
        type: "g8-dedicated-8-2",
        family: "G8 Dedicated 8x2",
        cpu: "Dedicated, hourly only",
        arch: "x86",
        size: V2_8GB,
        disk: "82 GB, no transfer bundled",
        burst: "No",
        machine: "$80.30",
        total: "$80.55",
        totalUsd: 80.55,
        orderable: true,
      },
    ],
  },
  {
    id: "ovh",
    name: "OVHcloud",
    region: "US catalog",
    source: "ovh",
    typeIsId: false,
    notes: [
      "IPv4 is included. VPS traffic is unlimited, except in Mumbai, Singapore and Sydney. No Arm.",
      "Paid 12 months ahead, VPS-2 costs $8.50 a month and VPS-3 $12.32.",
      "VPS-2 and VPS-3 are OVHcloud’s current VPS range, which its catalog calls the 2027 range. OVHcloud calls their cores vCores.",
    ],
    rows: [
      {
        id: "vps-2",
        type: "VPS-2",
        cpu: "Shared",
        arch: "x86",
        size: "4 vCPU, 8 GB",
        disk: "75 GB NVMe, unlimited traffic",
        burst: SHARED,
        machine: "$10.00",
        total: "$10.00",
        totalUsd: 10,
        orderable: true,
      },
      {
        id: "vps-3",
        type: "VPS-3",
        cpu: "Shared",
        arch: "x86",
        size: "6 vCPU, 12 GB",
        disk: "100 GB NVMe, unlimited traffic",
        burst: SHARED,
        machine: "$14.50",
        total: "$14.50",
        totalUsd: 14.5,
        orderable: true,
      },
      {
        id: "b3-8",
        type: "Public Cloud b3-8",
        cpu: "General purpose",
        arch: "x86",
        size: V2_8GB,
        disk: "50 GB NVMe, traffic free",
        burst: "No",
        machine: "$44.17",
        total: "$44.17",
        totalUsd: 44.17,
        orderable: true,
      },
    ],
  },
  {
    id: "oracle",
    name: "Oracle Cloud",
    tab: "Oracle",
    region: "Same price in every commercial region",
    source: "oracle",
    typeIsId: false,
    notes: [
      "The first 200 GB of disk and 10 TB out each month are free. On Arm, 1 OCPU is 1 core; on x86, 1 OCPU is 2 vCPUs.",
      "The Always Free Arm tier was halved on June 15, 2026, to 2 cores and 12 GB. Oracle may reclaim an idle Always Free instance, and a validator looks idle by its measures: fine for the test phase.",
      "On a pay-as-you-go account, Oracle’s two sources disagree. Its price list (updated October 8, 2026) prices the first 3,000 OCPU-hours and 18,000 GB-hours of A1 each month at $0, so 4 cores and 16 GB cost $0.00. Its Always Free page gives every account 1,500 OCPU-hours and 9,000 GB-hours, which leaves $18.22. The list price is $46.72.",
    ],
    rows: [
      {
        id: "a1-free",
        type: "A1.Flex, Always Free",
        family: "VM.Standard.A1.Flex",
        cpu: AMPERE_ALTRA,
        arch: "arm",
        size: "2 cores, 12 GB",
        disk: "Up to 200 GB, free",
        burst: "No",
        machine: "$0.00",
        total: "$0.00",
        totalUsd: 0,
        totalNote: "free tier; may be reclaimed when idle",
        orderable: true,
        summary: false,
      },
      {
        id: "a1-4-16",
        type: "A1.Flex, 4 OCPU",
        family: "VM.Standard.A1.Flex, pay-as-you-go",
        cpu: AMPERE_ALTRA,
        arch: "arm",
        size: "4 cores, 16 GB",
        disk: "Up to 200 GB, free",
        burst: "No",
        machine: "$46.72 list",
        total: "$0.00–18.22",
        totalUsd: 18.22,
        totalNote: "$0.00 by the price list, $18.22 by the Always Free page",
        orderable: true,
      },
      {
        id: "e5-1",
        type: "E5.Flex, 1 OCPU",
        family: "VM.Standard.E5.Flex",
        cpu: "AMD EPYC",
        arch: "x86",
        size: V2_8GB,
        disk: "Up to 200 GB, free",
        burst: "No",
        machine: "$33.58",
        total: "$33.58",
        totalUsd: 33.58,
        orderable: true,
      },
    ],
  },
];

/** Servers we priced for a validator with its own Ethereum node. */
interface NodeRow {
  readonly id: string;
  readonly option: string;
  readonly spec: string;
  readonly machine: string;
  readonly upload: string;
  readonly total: string;
  readonly kind: "rented" | "cloud";
  readonly source: SourceId;
}

export const NODE_ROWS: readonly NodeRow[] = [
  {
    id: "ks-5-a",
    option: "OVHcloud KS-5-A, two 3.84 TB NVMe added",
    spec: "Xeon E-2274G, 4 cores and 8 threads, 32 GB, 500 Mbps",
    machine: "€84.99 ($95)",
    upload: "Unmetered",
    total: "$95",
    kind: "rented",
    source: "ovhDedicated",
  },
  {
    id: "ex63",
    option: "Hetzner EX63",
    spec: "Core Ultra 7 265, 20 cores, 64 GB ECC, two 1 TB NVMe, up to four 3.84 TB",
    machine: "€99–149 ($111–166), €74 setup",
    upload: "Unmetered",
    total: "$111–166 plus drives",
    kind: "rented",
    source: "hetznerDedicated",
  },
  {
    id: "rise-1",
    option: "OVHcloud RISE-1, two 3.84 TB NVMe added",
    spec: "Xeon-E 2386G, 6 cores and 12 threads, 32 GB",
    machine: "€136.99 ($153)",
    upload: "Unmetered",
    total: "$153",
    kind: "rented",
    source: "ovhDedicated",
  },
  {
    id: "rise-3",
    option: "OVHcloud RISE-3, two 3.84 TB NVMe added",
    spec: "Ryzen 9 5900X, 12 cores, 32 GB",
    machine: "€171.99 ($192)",
    upload: "Unmetered",
    total: "$192",
    kind: "rented",
    source: "ovhDedicated",
  },
  {
    id: "ax102",
    option: "Hetzner AX102",
    spec: "Ryzen 9 7950X3D, 16 cores, 128 GB ECC, two 1.92 TB NVMe (up to two 7.68 TB)",
    machine: "€259 ($289), €129 setup",
    upload: "Unmetered",
    total: "$289",
    kind: "rented",
    source: "hetznerDedicated",
  },
  {
    id: "i3en-2xl",
    option: "AWS i3en.2xlarge",
    spec: "8 vCPU Intel, 64 GiB, two 2.5 TB local NVMe",
    machine: "$659.92",
    upload: "$135–216",
    total: "about $805–890",
    kind: "cloud",
    source: "awsNode",
  },
  {
    id: "l8aos",
    option: "Azure L8aos v4",
    spec: "8 vCPU AMD, 64 GiB, six 960 GB local NVMe",
    machine: "$659.92",
    upload: "$131–209",
    total: "about $805–880",
    kind: "cloud",
    source: "azureNode",
  },
  {
    id: "i8ge-2xl",
    option: "AWS i8ge.2xlarge",
    spec: "8 vCPU Graviton4, 64 GiB, two 2.5 TB local NVMe",
    machine: "$692.92",
    upload: "$135–216",
    total: "about $840–920",
    kind: "cloud",
    source: "awsNode",
  },
];

/**
 * What to know about the servers above, from their sources. The cloud
 * types meet the node's spec (4 TB or more of local NVMe, 32 GB or more):
 * at AWS the cheapest that does is i3en.2xlarge, read from the price list.
 */
export const NODE_NOTES: readonly {
  readonly text: string;
  readonly source: SourceId;
}[] = [
  {
    text: "AWS’s cheapest type with 4 TB of local NVMe or more is the i3en.2xlarge, with 8 vCPUs and 64 GiB; no type with 4 vCPUs has that much. Azure’s L8aos v4 costs the same.",
    source: "awsNode",
  },
  {
    text: "The local NVMe of the AWS and Azure types is wiped when the instance stops.",
    source: "awsNode",
  },
  {
    text: "The OVHcloud KS-5-A and RISE-1 have 4 and 6 cores: enough for a node, which needs 4 cores and 8 threads, but fewer than the Rack tier’s 8–16.",
    source: "ovhDedicated",
  },
  {
    text: "The AX102’s two 1.92 TB drives hold a node only as one 3.84 TB volume, without a mirror. For RAID-1, order larger drives, which cost more.",
    source: "hetznerDedicated",
  },
  {
    text: "Hetzner’s AX41 and AX42 come with two 512 GB drives, too little for a node. Google Cloud was not priced for a node.",
    source: "hetznerDedicated",
  },
];
