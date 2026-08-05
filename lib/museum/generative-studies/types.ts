export type MuseumGenerativeMapKind =
  | "exhaustive_lattice"
  | "finite_combinatorial"
  | "sampled_field"
  | "dynamic_state";

export interface MuseumGenerativeStage {
  readonly title: string;
  readonly description: string;
}

export interface MuseumGenerativeAxisValue {
  readonly label: string;
  readonly description?: string | undefined;
  readonly count?: number | undefined;
}

export interface MuseumGenerativeAxis {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly values: readonly MuseumGenerativeAxisValue[];
}

export interface MuseumHeldCoordinate {
  readonly label: string;
  readonly value: string;
}

export interface MuseumHeldPosition {
  readonly objectId: string;
  readonly title: string;
  readonly coordinates: readonly MuseumHeldCoordinate[];
  readonly reading: string;
}

export interface MuseumExhaustiveLatticeVisualization {
  readonly kind: "exhaustive_lattice";
  readonly design: "pre_process_collision_lattice";
  readonly rows: readonly string[];
  readonly columns: readonly {
    readonly group: string;
    readonly values: readonly string[];
  }[];
  readonly selected: {
    readonly rowIndex: number;
    readonly columnGroupIndex: number;
    readonly valueIndex: number;
  };
}

export interface MuseumFiniteCombinatorialVisualization {
  readonly kind: "finite_combinatorial";
  readonly design: "empty_rooms_amphitheater";
  readonly groups: readonly {
    readonly label: string;
    readonly count: number;
  }[];
  readonly selectedGroupIndex: number;
  readonly selectedCode: string;
  readonly formCounts: readonly {
    readonly label: string;
    readonly count: number;
  }[];
}

export interface MuseumSampledFieldVisualization {
  readonly kind: "sampled_field";
  readonly design: "century_adjacency_loom" | "cosmos_state_atlas";
  readonly dimensions: readonly {
    readonly id: string;
    readonly label: string;
    readonly values: readonly {
      readonly label: string;
      readonly count?: number | undefined;
    }[];
  }[];
}

export interface MuseumDynamicStateVisualization {
  readonly kind: "dynamic_state";
  readonly design: "phototaxis_causal_trace";
  readonly stateLabels: readonly string[];
  readonly lights?: readonly {
    readonly x: number;
    readonly y: number;
  }[];
}

export type MuseumGenerativeVisualization =
  | MuseumExhaustiveLatticeVisualization
  | MuseumFiniteCombinatorialVisualization
  | MuseumSampledFieldVisualization
  | MuseumDynamicStateVisualization;

export interface MuseumGenerativeStudy {
  readonly projectId: string;
  readonly projectSlug: string;
  readonly projectTitle: string;
  readonly artistName: string;
  readonly mapKind: MuseumGenerativeMapKind;
  readonly mapLabel: string;
  readonly thesis: string;
  readonly coverageStatement: string;
  readonly stages: readonly MuseumGenerativeStage[];
  readonly axes: readonly MuseumGenerativeAxis[];
  readonly heldPositions: readonly MuseumHeldPosition[];
  readonly finding: string;
  readonly caveats: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly visualization: MuseumGenerativeVisualization;
}

export interface MuseumMintedToken {
  readonly invocation: number;
  readonly tokenId: string;
  readonly tokenHash: string;
  readonly mediaUrl: string;
  readonly traits: Readonly<Record<string, string>>;
  readonly editionProfile: {
    readonly statisticalRank: number;
    readonly total: number;
  };
}

export interface MuseumMintedProjectIndex {
  readonly schema: "museum.generative.minted-index.v2";
  readonly projectSlug: string;
  readonly snapshotId: string;
  readonly observedAt: string;
  readonly population: Readonly<Record<string, unknown>>;
  readonly descriptor: {
    readonly algorithmId: "6529-nextgen-trait-prevalence-v1";
    readonly resultSha256: string;
    readonly reviewRef: "descriptor-package-review-2026-08-02";
  };
  readonly tokens: readonly MuseumMintedToken[];
}
