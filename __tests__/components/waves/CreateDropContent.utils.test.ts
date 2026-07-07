import { buildDropSubmissionMetadata } from "@/components/waves/utils/buildDropSubmissionMetadata";
import {
  canAddDropPart,
  canSubmitDrop,
} from "@/components/waves/create-drop-content/content-helpers";
import { convertMetadataToDropMetadata } from "@/components/waves/utils/convertMetadataToDropMetadata";
import { getIdentitySubmissionMetadataErrors } from "@/components/waves/utils/identitySubmissionMetadataValidation";
import {
  getEffectiveIdentitySubmitAttempt,
  getEffectiveSelectedIdentity,
  getIdentitySubmissionScopeKey,
} from "@/components/waves/utils/identitySubmissionState";
import type { SelectableIdentityOption } from "@/components/utils/input/profile-search/getSelectableIdentity";
import { IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR } from "@/helpers/waves/identity-submission-metadata";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import type { CreateDropPart } from "@/entities/IDrop";

describe("CreateDropContent utilities", () => {
  const viewerIdentity: SelectableIdentityOption = {
    value: "0xabc",
    label: "alice",
    secondaryLabel: "0xabc",
    avatarUrl: null,
    profileId: "viewer-1",
  };
  const selectedIdentity: SelectableIdentityOption = {
    value: "0xdef",
    label: "bob",
    secondaryLabel: "0xdef",
    avatarUrl: null,
    profileId: "viewer-2",
  };

  describe("convertMetadataToDropMetadata", () => {
    it("filters out entries without key or value", () => {
      const result = convertMetadataToDropMetadata([
        {
          key: "a",
          type: ApiWaveMetadataType.String,
          value: "1",
          required: true,
        },
        { key: null, type: null, value: null, required: false },
        {
          key: "b",
          type: ApiWaveMetadataType.Number,
          value: 2,
          required: false,
        },
      ]);
      expect(result).toEqual([
        { data_key: "a", data_value: "1" },
        { data_key: "b", data_value: "2" },
      ]);
    });
  });

  it("handles numeric metadata values", () => {
    const out = convertMetadataToDropMetadata([
      {
        key: "num",
        type: ApiWaveMetadataType.Number,
        value: 10,
        required: true,
      },
    ]);

    expect(out).toEqual([{ data_key: "num", data_value: "10" }]);
  });

  it("appends strategy-owned identity metadata without duplicating the key", () => {
    const out = buildDropSubmissionMetadata({
      metadata: [
        {
          key: "identity",
          type: ApiWaveMetadataType.String,
          value: "manual-value",
          required: false,
        },
        {
          key: "title",
          type: ApiWaveMetadataType.String,
          value: "drop title",
          required: false,
        },
      ] as any,
      identity: "0xabc",
    });

    expect(out).toEqual([
      { data_key: "title", data_value: "drop title" },
      { data_key: "identity", data_value: "0xabc" },
    ]);
  });

  it("preserves manual identity metadata when no strategy identity is provided", () => {
    const out = buildDropSubmissionMetadata({
      metadata: [
        {
          key: "identity",
          type: ApiWaveMetadataType.String,
          value: "manual-value",
          required: false,
        },
      ] as any,
      identity: null,
    });

    expect(out).toEqual([{ data_key: "identity", data_value: "manual-value" }]);
  });

  it("flags reserved metadata keys during identity submissions", () => {
    const errors = getIdentitySubmissionMetadataErrors({
      isIdentitySubmissionExperience: true,
      metadata: [
        { id: "reserved", key: " Identity " },
        { id: "title", key: "title" },
      ],
    });

    expect(errors).toEqual({
      reserved: IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR,
    });
  });

  it("allows reserved metadata keys outside identity submissions", () => {
    const errors = getIdentitySubmissionMetadataErrors({
      isIdentitySubmissionExperience: false,
      metadata: [{ id: "reserved", key: "identity" }],
    });

    expect(errors).toEqual({});
  });

  describe("drop content gating", () => {
    const existingPart: CreateDropPart = {
      content: "existing part",
      quoted_drop: null,
      media: [],
    };
    const baseCanSubmitParams = {
      files: [],
      hasMetadata: false,
      hasValidPoll: false,
      hasPendingInlineImageUpload: false,
      hasMetadataValidationErrors: false,
      hasPollValidationError: false,
    };

    it("applies the storm cap to current editor markdown when parts exist", () => {
      expect(
        canSubmitDrop({
          ...baseCanSubmitParams,
          markdown: null,
          parts: [existingPart],
        })
      ).toBe(true);

      expect(
        canSubmitDrop({
          ...baseCanSubmitParams,
          markdown: "x".repeat(241),
          parts: [existingPart],
        })
      ).toBe(false);
    });

    it("preserves whitespace-only add-part behavior without making it submittable", () => {
      expect(
        canAddDropPart({
          markdown: "   ",
          files: [],
          drop: null,
          hasPendingInlineImageUpload: false,
        })
      ).toBe(true);

      expect(
        canSubmitDrop({
          ...baseCanSubmitParams,
          markdown: "   ",
          parts: [],
        })
      ).toBe(false);
    });
  });

  describe("identity submission state", () => {
    it("derives OnlyMyself from the viewer identity without draft state", () => {
      const scopeKey = getIdentitySubmissionScopeKey({
        waveId: "wave-1",
        isIdentitySubmissionExperience: true,
        identitySubmissionMode:
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself,
      });

      expect(
        getEffectiveSelectedIdentity({
          isIdentitySubmissionExperience: true,
          identitySubmissionMode:
            ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself,
          viewerIdentity,
          selectedIdentityState: null,
          scopeKey,
        })
      ).toEqual(viewerIdentity);
    });

    it("ignores stale draft identity from a different scope", () => {
      const staleScopeKey = getIdentitySubmissionScopeKey({
        waveId: "wave-1",
        isIdentitySubmissionExperience: true,
        identitySubmissionMode:
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
      });
      const currentScopeKey = getIdentitySubmissionScopeKey({
        waveId: "wave-2",
        isIdentitySubmissionExperience: true,
        identitySubmissionMode:
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
      });

      expect(
        getEffectiveSelectedIdentity({
          isIdentitySubmissionExperience: true,
          identitySubmissionMode:
            ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
          viewerIdentity,
          selectedIdentityState: {
            scopeKey: staleScopeKey,
            value: selectedIdentity,
          },
          scopeKey: currentScopeKey,
        })
      ).toBeNull();
    });

    it("keeps submit-attempt state scoped to the current wave and mode", () => {
      const staleScopeKey = getIdentitySubmissionScopeKey({
        waveId: "wave-1",
        isIdentitySubmissionExperience: true,
        identitySubmissionMode:
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
      });
      const currentScopeKey = getIdentitySubmissionScopeKey({
        waveId: "wave-2",
        isIdentitySubmissionExperience: true,
        identitySubmissionMode:
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
      });

      expect(
        getEffectiveIdentitySubmitAttempt({
          attemptState: {
            scopeKey: staleScopeKey,
            value: true,
          },
          scopeKey: currentScopeKey,
        })
      ).toBe(false);
    });
  });
});
