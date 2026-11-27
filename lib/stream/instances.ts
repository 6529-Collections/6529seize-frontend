import type { Address } from "viem";

/**
 * 6529 Stream contract instances on Sepolia. Every address the Stream test
 * pages use comes from here, keyed by instance name, so a new deployment is
 * swapped in one place. Values are copied from the contracts repository's
 * deployment record (6529-works `deployments/11155111/`).
 */
export interface StreamInstance {
  /** Short instance name, as the contracts repository calls it. */
  readonly name: string;
  /** The deployment record file in the contracts repository. */
  readonly record: string;
  /** The first block to scan for this instance's events. */
  readonly startBlock: bigint;
  /**
   * Whether creating a curated 6529 Stream work can be done by any wallet.
   * On r8 curation approval needs keys the website does not hold.
   */
  readonly curatedCreationOpen: boolean;
  readonly addresses: {
    readonly accounts: Address;
    readonly contentStore: Address;
    readonly economics: Address;
    readonly englishAuction: Address;
    readonly editionAuction: Address;
    readonly independentEditionAuction: Address;
    readonly independentRegistry: Address;
    readonly independent721Deployer: Address;
    readonly independentEditionsDeployer: Address;
    readonly packageRegistry: Address;
    readonly renderer: Address;
    readonly saleStarter: Address;
    /** SplitLedger, recorded as SplitFactory in the deployment record. */
    readonly splitLedger: Address;
    readonly stream: Address;
    readonly streamDirectory: Address;
    readonly streamEditions: Address;
    readonly workFacts: Address;
    readonly museumVault: Address;
  };
}

const R8: StreamInstance = {
  name: "r8",
  record: "deployments/11155111/core-1795440624.json",
  startBlock: 12_196_001n,
  curatedCreationOpen: false,
  addresses: {
    accounts: "0xdE5781c21fbCCF11056F2b7af6b299a2970B55Ba",
    contentStore: "0xa22F278ffB83416Ba72B12d867970fc9f6f34eB1",
    economics: "0xDB9d78844dc7a06297644536C06A14EA2Cd14f0D",
    englishAuction: "0x3075498Ba1A52518f4f19b24A6DB9511f0311Fb8",
    editionAuction: "0x43f3D854D85c9163C8C6b5064ab22ceF855EF4Ce",
    independentEditionAuction: "0x6beD438ecFd9fbF2a808aE07300D2DbC8000232b",
    independentRegistry: "0xaE49cE82F1448a2B60ee7863624AEBf575Cb75a5",
    independent721Deployer: "0x68286E3d2CeDC92bca1d1270Ead2531D489d0f9f",
    independentEditionsDeployer: "0xa606b6f0d9FB76578457c45eB0e17B8001cA20a4",
    packageRegistry: "0xcAcB4ea395c3F265a1DceEAED795Bd3eF05d6Ecb",
    renderer: "0x4Ca69fd081cc3bbFb5360c9224057eEA117e37f2",
    saleStarter: "0xAEBA344701692a7898cCD8515fE5e00CbbCd2274",
    splitLedger: "0x43A78e628F6cc1C73524D227B32Ea5d5059567Ce",
    stream: "0xf2F45cC99a24C100a42f084a88E9697E0a798F6C",
    streamDirectory: "0x7c2c78f346Bc49fCaB5dEd8Ea1898aC08423EaEd",
    streamEditions: "0xaED9aB8079fcDC789e29119193853E02dDbf3060",
    workFacts: "0x7fe774a5bD72ca2Eda2ad471d1655BE73673DD29",
    museumVault: "0x52405E7Ba3fA10937C1F030f5b616b89B855E844",
  },
};

export const STREAM_INSTANCES = { r8: R8 } as const;

export type StreamInstanceName = keyof typeof STREAM_INSTANCES;

/** The instance the test pages run against. Change it here to move instance. */
export const ACTIVE_STREAM_INSTANCE: StreamInstanceName = "r8";

export function getStreamInstance(): StreamInstance {
  return STREAM_INSTANCES[ACTIVE_STREAM_INSTANCE];
}
