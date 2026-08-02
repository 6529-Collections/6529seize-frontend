export const MUSEUM_REPOSITORY = "6529-Collections/6529networkmuseum";
export const MUSEUM_BRANCH = "main";
const MUSEUM_MANIFEST_PATH = "release-artifacts/latest/record-manifest.json";
export const MUSEUM_MANIFEST_URL = `https://raw.githubusercontent.com/${MUSEUM_REPOSITORY}/${MUSEUM_BRANCH}/${MUSEUM_MANIFEST_PATH}`;
export const MUSEUM_REPOSITORY_URL = `https://github.com/${MUSEUM_REPOSITORY}`;

export type MuseumSourceState =
  | "fresh"
  | "partial"
  | "stale"
  | "unavailable"
  | "invalid";

export interface MuseumManifestEntry {
  readonly path: string;
  readonly sha256: string;
  readonly size: number;
}

export interface MuseumRelease {
  readonly manifestType: string;
  readonly manifestVersion: string;
  readonly manifestSha256: string;
  readonly manifestCommitment: string | null;
  readonly entries: readonly MuseumManifestEntry[];
  readonly observedAt: string;
}

export interface MuseumDocument {
  readonly path: string;
  readonly sha256: string;
  readonly size: number;
  readonly contentType: "markdown" | "json";
  readonly text: string;
}

export interface MuseumCorpus {
  readonly sourceState: MuseumSourceState;
  readonly release: MuseumRelease | null;
  readonly documents: Readonly<Record<string, MuseumDocument>>;
  readonly errorCode?: string | undefined;
}

export interface MuseumTextDocument {
  readonly path: string;
  readonly title: string;
  readonly excerpt: string;
  readonly markdown: string;
}

export interface MuseumGovernanceDecision {
  readonly decisionId: string;
  readonly serialNo: number | null;
  readonly title: string;
  readonly decisionClass: string;
  readonly observedWaveStatus: string;
  readonly governanceEffect: string;
  readonly disposition: string | null;
  readonly rating: number | null;
  readonly ratersCount: number | null;
  readonly createdAt: string | null;
  readonly sourceUrl: string | null;
  readonly sourcePath: string;
}

export interface MuseumApprovedCollection {
  readonly approvalId: string;
  readonly preferredName: string;
  readonly scopeDefinition: string;
  readonly category: string;
  readonly status: string;
  readonly decisionId: string;
  readonly exclusions: readonly string[];
  readonly sourcePath: string;
}

export interface MuseumSelectedWork {
  readonly recordId: string;
  readonly outcomePath: string | null;
  readonly status: string;
  readonly artist: string;
  readonly title: string;
  readonly submissionDropId: string | null;
  readonly winnerPlace: number | null;
  readonly voteTotal: number | null;
  readonly voterCount: number | null;
}

export interface MuseumProgram {
  readonly programId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly status: string;
  readonly statusAsOf: string | null;
  readonly curatorialFrame: string;
  readonly rules: readonly string[];
  readonly nonClaims: readonly string[];
  readonly selectedWorks: readonly MuseumSelectedWork[];
  readonly sourcePath: string;
  readonly selectedWorksPath: string | null;
}

export interface MuseumAccessionLot {
  readonly accessionLotId: string;
  readonly preferredTitle: string;
  readonly objectCount: number | null;
  readonly donationStatus: string;
  readonly accessionStatus: string;
  readonly donorPublicCredit: string | null;
  readonly custodyEns: string | null;
  readonly custodyAddress: string | null;
  readonly receiptTransactionHash: string | null;
  readonly receiptBlockNumber: number | null;
  readonly receiptBlockTime: string | null;
  readonly evidenceRefs: readonly string[];
  readonly completionLimits: readonly string[];
  readonly sourcePath: string;
}

export interface MuseumObjectRecord {
  readonly objectId: string;
  readonly accessionLotId: string | null;
  readonly title: string;
  readonly artist: string;
  readonly classification: string;
  readonly status: string;
  readonly scope: string;
  readonly sourcePath: string;
  readonly record: unknown;
}

export interface MuseumView {
  readonly sourceState: MuseumSourceState;
  readonly release: MuseumRelease | null;
  readonly mission: MuseumTextDocument | null;
  readonly policies: readonly MuseumTextDocument[];
  readonly methodology: readonly MuseumTextDocument[];
  readonly governance: readonly MuseumGovernanceDecision[];
  readonly approvedCollections: readonly MuseumApprovedCollection[];
  readonly programs: readonly MuseumProgram[];
  readonly accessions: readonly MuseumAccessionLot[];
  readonly objects: readonly MuseumObjectRecord[];
  readonly errorCode?: string | undefined;
}
