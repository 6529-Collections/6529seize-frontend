import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { ApiCompetition } from "@/generated/models/ApiCompetition";
import { ApiCompetitionCapability } from "@/generated/models/ApiCompetitionCapability";
import { ApiCompetitionComputedPhase } from "@/generated/models/ApiCompetitionComputedPhase";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

const projectRoot = path.resolve(__dirname, "../..");
const phaseZeroRoot = path.join(
  projectRoot,
  "ops/roadmap/waves-multi-competition/phase-0/baseline"
);

type JsonObject = Record<string, any>;

function readJson(file: string): JsonObject {
  return JSON.parse(fs.readFileSync(path.join(phaseZeroRoot, file), "utf8"));
}

function sourceFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name) ? [file] : [];
  });
}

describe("waves multi-competition Phase 1 frontend contract", () => {
  it("keeps every Phase 0 OpenAPI GET operation available to old clients", () => {
    const baseline = readJson("public-get-openapi-snapshot.json");
    const current = parse(
      fs.readFileSync(path.join(projectRoot, "openapi.yaml"), "utf8")
    ) as JsonObject;
    const failures: string[] = [];
    let count = 0;
    for (const [route, pathItem] of Object.entries(
      baseline.paths as JsonObject
    )) {
      const accepted = (pathItem as JsonObject).get;
      if (!accepted) continue;
      count++;
      const candidate = current.paths?.[route]?.get;
      if (!candidate) {
        failures.push(`GET ${route} is missing`);
        continue;
      }
      if (candidate.operationId !== accepted.operationId) {
        failures.push(`GET ${route} operationId changed`);
      }
      for (const status of Object.keys(accepted.responses ?? {})) {
        if (!candidate.responses?.[status]) {
          failures.push(`GET ${route} response ${status} is missing`);
        }
      }
    }
    expect(count).toBe(183);
    expect(failures).toEqual([]);
  });

  it("preserves the old wave/drop discriminators and generated field maps", () => {
    expect(Object.values(ApiWaveType)).toEqual(["APPROVE", "RANK", "CHAT"]);
    expect(Object.values(ApiDropType)).toEqual([
      "CHAT",
      "PARTICIPATORY",
      "WINNER",
    ]);
    expect(ApiWave.attributeTypeMap.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "id",
        "serial_no",
        "voting",
        "participation",
        "chat",
        "wave",
        "pauses",
      ])
    );
  });

  it("compiles the approved native model without exposing routing internals", () => {
    const competition: ApiCompetition = {
      id: "10000000-0000-4000-8000-000000000001",
      wave_id: "wave-hub",
      type: ApiCompetitionType.Rank,
      title: "Competition",
      description: null,
      lifecycle: ApiCompetitionLifecycle.Published,
      computed_phase: ApiCompetitionComputedPhase.Upcoming,
      config_version: 1,
      participation: {
        group_id: null,
        signature_required: false,
        max_entries_per_participant: null,
        required_metadata: [],
        required_media: [],
        submission_type: null,
        identity_submission_strategy: null,
        identity_submission_duplicates: null,
        starts_at: null,
        ends_at: null,
        terms: null,
      },
      voting: {
        group_id: null,
        credit_type: "TDH",
        credit_scope: "WAVE",
        credit_category: null,
        credit_creditor: null,
        credit_nfts: [],
        signature_required: false,
        starts_at: null,
        ends_at: null,
        max_votes_per_identity_to_entry: null,
        forbid_negative_votes: false,
      },
      decisions: {
        strategy: null,
        next_decision_time: null,
        winning_min_threshold: null,
        winning_max_threshold: null,
        winning_threshold_min_duration_ms: 0,
        max_winners: null,
        time_lock_ms: null,
      },
      winners: {
        max_winners: null,
        winning_min_threshold: null,
        winning_max_threshold: null,
        winning_threshold_min_duration_ms: 0,
      },
      outcome_config: [],
      capabilities: [ApiCompetitionCapability.MainStage],
      permissions: {
        view: true,
        submit: false,
        vote: false,
        administer: false,
      },
      created_at: 1,
      updated_at: 1,
      published_at: null,
      ended_at: null,
      cancelled_at: null,
      archived_at: null,
    };
    const fields = ApiCompetition.attributeTypeMap.map(({ name }) => name);
    expect(competition.id).toBeTruthy();
    expect(fields).not.toContain("storage_mode");
    expect(fields).not.toContain("execution_mode");
    expect(fields).not.toContain("current");
  });

  it("keeps native hubs chat-safe and the immutable primary fixture explicit", () => {
    const fixtures = readJson("representative-fixtures.json")
      .cases as Array<JsonObject>;
    const nativeHub = fixtures.find(
      ({ id }) => id === "native-hub-one-competition-legacy-chat-projection"
    );
    const mixed = fixtures.find(
      ({ id }) => id === "legacy-wave-with-additional-native-competition"
    );
    expect(nativeHub?.wave).toMatchObject({
      type: "CHAT",
      legacy_primary_competition_id: null,
    });
    expect(nativeHub?.legacy_assertions).toMatchObject({
      "wave.wave.type": "CHAT",
      "drop-native-one.drop_type": "CHAT",
      "drop-native-one.rank": null,
    });
    expect(mixed?.legacy_assertions).toMatchObject({
      selected_competition_id: "competition-original",
      "must_not_select_competition-newer": true,
    });
  });

  it("does not consume v3 competition resources in production frontend code", () => {
    const roots = [
      "app",
      "components",
      "contexts",
      "helpers",
      "hooks",
      "lib",
      "services",
      "utils",
    ];
    const violations = roots
      .flatMap((root) => sourceFiles(path.join(projectRoot, root)))
      .filter((file) =>
        /ApiCompetition|ApiWaveV3|\/v3\/waves\//.test(
          fs.readFileSync(file, "utf8")
        )
      )
      .map((file) => path.relative(projectRoot, file));
    expect(violations).toEqual([]);
  });
});
