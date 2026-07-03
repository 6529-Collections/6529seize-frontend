import {
  canEditWave,
  createDirectMessageWave,
  convertWaveToUpdateWave,
  getCreateWaveStepStatus,
} from "@/helpers/waves/waves.helpers";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CreateWaveStepStatus } from "@/types/waves.types";

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(() => Promise.resolve("wave")),
}));

import { commonApiPost } from "@/services/api/common-api";

describe("waves.helpers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCreateWaveStepStatus", () => {
    it("returns DONE when step index is less than active", () => {
      expect(
        getCreateWaveStepStatus({ stepIndex: 0, activeStepIndex: 2 })
      ).toBe(CreateWaveStepStatus.DONE);
    });

    it("returns ACTIVE when step index equals active", () => {
      expect(
        getCreateWaveStepStatus({ stepIndex: 2, activeStepIndex: 2 })
      ).toBe(CreateWaveStepStatus.ACTIVE);
    });

    it("returns PENDING when step index is greater than active", () => {
      expect(
        getCreateWaveStepStatus({ stepIndex: 3, activeStepIndex: 2 })
      ).toBe(CreateWaveStepStatus.PENDING);
    });
  });

  describe("convertWaveToUpdateWave", () => {
    const makeWave = (
      options: {
        readonly votingPeriod?: unknown;
        readonly participationPeriod?: unknown;
      } = {}
    ): any => {
      const resolvedVotingPeriod = Object.prototype.hasOwnProperty.call(
        options,
        "votingPeriod"
      )
        ? options.votingPeriod
        : { min: 1, max: 10 };
      const resolvedParticipationPeriod = Object.prototype.hasOwnProperty.call(
        options,
        "participationPeriod"
      )
        ? options.participationPeriod
        : { min: 2, max: 20 };

      return {
        name: "wave1",
        picture: "pic.png",
        voting: {
          scope: { group: { id: "vgroup" } },
          credit_type: "credit",
          credit_scope: ApiWaveCreditScope.Wave,
          credit_category: "cat",
          creditor: { id: "cred1" },
          signature_required: false,
          period: resolvedVotingPeriod,
          forbid_negative_votes: true,
        },
        visibility: { scope: { group: { id: "vis" } } },
        chat: { scope: { group: { id: "chat" } }, enabled: true },
        participation: {
          scope: { group: { id: "part" } },
          no_of_applications_allowed_per_participant: 2,
          required_media: null,
          required_metadata: [],
          signature_required: true,
          period: resolvedParticipationPeriod,
          terms: "terms",
        },
        wave: {
          admin_drop_deletion_enabled: true,
          type: "TYPE",
          winning_threshold: 3,
          max_winners: 2,
          max_votes_per_identity_to_drop: 1,
          time_lock_ms: 100,
          admin_group: { group: { id: "admin" } },
          decisions_strategy: "strategy",
        },
      };
    };

    it("maps fields correctly", () => {
      const wave = makeWave();

      const result = convertWaveToUpdateWave(wave);
      expect(result).toEqual({
        name: "wave1",
        picture: "pic.png",
        voting: {
          scope: { group_id: "vgroup" },
          credit_type: "credit",
          credit_scope: ApiWaveCreditScope.Wave,
          credit_category: "cat",
          creditor_id: "cred1",
          signature_required: false,
          period: { min: 1, max: 10 },
          forbid_negative_votes: true,
        },
        visibility: { scope: { group_id: "vis" } },
        chat: {
          scope: { group_id: "chat" },
          enabled: true,
          links_disabled: false,
        },
        participation: {
          scope: { group_id: "part" },
          no_of_applications_allowed_per_participant: 2,
          required_media: null,
          required_metadata: [],
          signature_required: true,
          period: { min: 2, max: 20 },
          terms: "terms",
        },
        wave: {
          admin_drop_deletion_enabled: true,
          type: "TYPE",
          winning_threshold: 3,
          max_winners: 2,
          max_votes_per_identity_to_drop: 1,
          time_lock_ms: 100,
          admin_group: { group_id: "admin" },
          decisions_strategy: "strategy",
        },
      });
    });

    it("preserves approve threshold hold time", () => {
      const wave = makeWave();
      wave.wave.winning_threshold_min_duration_ms = 120_000;

      const result = convertWaveToUpdateWave(wave);

      expect(result.wave).toMatchObject({
        winning_threshold_min_duration_ms: 120_000,
      });
    });

    it("preserves null approve threshold hold time", () => {
      const wave = makeWave();
      wave.wave.winning_threshold_min_duration_ms = null;

      const result = convertWaveToUpdateWave(wave);

      expect(result.wave).toHaveProperty(
        "winning_threshold_min_duration_ms",
        null
      );
    });

    it("omits approve threshold hold time when the source is missing", () => {
      const wave = makeWave();

      const result = convertWaveToUpdateWave(wave);

      expect(result.wave).not.toHaveProperty(
        "winning_threshold_min_duration_ms"
      );
    });

    it("preserves existing slow mode cooldown", () => {
      const wave = makeWave();
      wave.chat.slow_mode_cooldown_ms = 30_000;

      const result = convertWaveToUpdateWave(wave);

      expect(result.chat).toEqual({
        scope: { group_id: "chat" },
        enabled: true,
        links_disabled: false,
        slow_mode_cooldown_ms: 30_000,
      });
    });

    it("omits slow mode when wave has no slow mode", () => {
      const wave = makeWave();

      const result = convertWaveToUpdateWave(wave);

      expect(result.chat).not.toHaveProperty("slow_mode_cooldown_ms");
    });

    it("preserves disabled links", () => {
      const wave = makeWave();
      wave.chat.links_disabled = true;

      const result = convertWaveToUpdateWave(wave);

      expect(result.chat).toMatchObject({
        links_disabled: true,
      });
    });

    it("preserves card-set TDH credit NFTs", () => {
      const creditNfts = [
        { contract: "0xmemes", token_id: 1 },
        { contract: "0xmemes", token_id: 2 },
      ];
      const wave = makeWave();
      wave.voting.credit_type = ApiWaveCreditType.CardSetTdh;
      wave.voting.credit_nfts = creditNfts;

      const result = convertWaveToUpdateWave(wave);

      expect(result.voting).toMatchObject({
        credit_type: ApiWaveCreditType.CardSetTdh,
        credit_nfts: creditNfts,
      });
    });

    it("does not add credit NFTs for standard voting", () => {
      const wave = makeWave();
      wave.voting.credit_type = ApiWaveCreditType.Tdh;
      wave.voting.credit_nfts = [{ contract: "0xmemes", token_id: 1 }];

      const result = convertWaveToUpdateWave(wave);

      expect(result.voting).not.toHaveProperty("credit_nfts");
    });

    it("preserves voting credit scope", () => {
      const wave = makeWave();
      wave.voting.credit_scope = ApiWaveCreditScope.Drop;

      const result = convertWaveToUpdateWave(wave);

      expect(result.voting).toMatchObject({
        credit_scope: ApiWaveCreditScope.Drop,
      });
    });

    it("clears participation terms for chat wave updates", () => {
      const wave = makeWave();
      wave.wave.type = ApiWaveType.Chat;
      wave.participation.terms = "Legacy chat terms.";
      wave.participation.signature_required = true;

      const result = convertWaveToUpdateWave(wave);

      expect(result.participation).toMatchObject({
        terms: null,
        signature_required: false,
      });
    });

    it.each([
      ["voting", null],
      ["voting", undefined],
      ["participation", null],
      ["participation", undefined],
    ])("omits %s period when it is %s", (periodType, periodValue) => {
      const wave =
        periodType === "voting"
          ? makeWave({ votingPeriod: periodValue })
          : makeWave({ participationPeriod: periodValue });

      const result = convertWaveToUpdateWave(wave);

      if (periodType === "voting") {
        expect(result.voting).not.toHaveProperty("period");
        expect(result.participation).toHaveProperty("period", {
          min: 2,
          max: 20,
        });
        return;
      }

      expect(result.voting).toHaveProperty("period", { min: 1, max: 10 });
      expect(result.participation).not.toHaveProperty("period");
    });
  });

  describe("canEditWave", () => {
    const baseWave: any = {
      author: { handle: "author" },
      wave: { authenticated_user_eligible_for_admin: false },
    };

    it("returns false without connected profile", () => {
      expect(
        canEditWave({
          connectedProfile: null,
          activeProfileProxy: null,
          wave: baseWave,
        })
      ).toBe(false);
    });

    it("returns false when proxy active", () => {
      expect(
        canEditWave({
          connectedProfile: { handle: "author" } as any,
          activeProfileProxy: {} as any,
          wave: baseWave,
        })
      ).toBe(false);
    });

    it("returns true when user is author", () => {
      expect(
        canEditWave({
          connectedProfile: { handle: "author" } as any,
          activeProfileProxy: null,
          wave: baseWave,
        })
      ).toBe(true);
    });

    it("returns true when eligible for admin", () => {
      const wave = {
        ...baseWave,
        wave: { authenticated_user_eligible_for_admin: true },
      };
      expect(
        canEditWave({
          connectedProfile: { handle: "other" } as any,
          activeProfileProxy: null,
          wave,
        })
      ).toBe(true);
    });

    it("returns false otherwise", () => {
      expect(
        canEditWave({
          connectedProfile: { handle: "other" } as any,
          activeProfileProxy: null,
          wave: baseWave,
        })
      ).toBe(false);
    });
  });

  describe("createDirectMessageWave", () => {
    it("posts to API with addresses", async () => {
      const result = await createDirectMessageWave({ addresses: ["a", "b"] });
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: "waves/direct-message/new",
        body: { identity_addresses: ["a", "b"] },
      });
      expect(result).toBe("wave");
    });
  });
});
