import { buildDropSubmissionMetadata } from "@/components/waves/utils/buildDropSubmissionMetadata";
import {
  canAddDropPart,
  canSubmitComposerAction,
  canSubmitDrop,
  createMetadataHandlers,
  getMetadataNameErrors,
  handleComposerFileChange,
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
import type { CreateDropConfig, CreateDropPart } from "@/entities/IDrop";
import type { CreateDropMetadataType } from "@/components/waves/create-drop-content/types";

describe("CreateDropContent utilities", () => {
  const createFile = (name: string, lastModified: number): File =>
    new File(["file"], name, {
      lastModified,
      type: "image/png",
    });

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

  describe("composer file changes", () => {
    it("rechecks duplicates and remaining capacity when React applies a queued batch", () => {
      const existing = Array.from({ length: 7 }, (_, index) =>
        createFile(`existing-${index}.png`, index)
      );
      const last = createFile("last.png", 100);
      const overflow = createFile("overflow.png", 200);
      const setFiles = jest.fn();
      const setToast = jest.fn();
      handleComposerFileChange({
        newFiles: [existing[0]!, last, overflow],
        files: [],
        drop: null,
        waveId: "wave-1",
        keepOptionsVisible: true,
        setFiles,
        setToast,
        setShowOptionsState: jest.fn(),
        closeOnNextInputRef: { current: false },
      });

      const update = setFiles.mock.calls[0][0];
      expect(update(existing)).toEqual([...existing, last]);
      expect(update([...existing, last])).toEqual([...existing, last]);
      expect(setToast).not.toHaveBeenCalled();
    });

    it("retains files added by another batch before React applies the update", () => {
      const first = createFile("first.png", 100);
      const second = createFile("second.png", 100);
      const setFiles = jest.fn();
      handleComposerFileChange({
        newFiles: [second],
        files: [],
        drop: null,
        waveId: "wave-1",
        keepOptionsVisible: true,
        setFiles,
        setToast: jest.fn(),
        setShowOptionsState: jest.fn(),
        closeOnNextInputRef: { current: false },
      });
      expect(setFiles.mock.calls[0][0]([first])).toEqual([first, second]);
    });

    it("enforces the upload budget after existing drop part attachments", () => {
      const setFiles = jest.fn();
      const setToast = jest.fn();
      const setShowOptionsState = jest.fn();
      const currentFile = createFile("current.png", 100);
      const newFile = createFile("new.png", 200);

      handleComposerFileChange({
        newFiles: [newFile],
        drop: {
          parts: [
            {
              content: "existing",
              quoted_drop: null,
              media: Array.from({ length: 7 }, (_, index) =>
                createFile(`existing-${index}.png`, index)
              ),
            },
          ],
        } as any,
        files: [currentFile],
        keepOptionsVisible: true,
        waveId: "wave-1",
        setToast,
        setFiles,
        setShowOptionsState,
        closeOnNextInputRef: { current: false },
      });

      expect(setFiles).not.toHaveBeenCalled();
      expect(setToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "warning",
          message: expect.stringContaining("Extra files were not added"),
        })
      );
      expect(setShowOptionsState).not.toHaveBeenCalled();
    });
  });

  describe("metadata handlers", () => {
    it("retains legacy custom values, rejects unnamed values, and omits empty rows", () => {
      let metadata: CreateDropMetadataType[] = [
        {
          id: "legacy",
          key: "Medium",
          type: null,
          value: null,
          required: false,
        },
        { id: "blank", key: "", type: null, value: "", required: false },
      ];
      const setMetadata: React.Dispatch<
        React.SetStateAction<CreateDropMetadataType[]>
      > = (updater) => {
        metadata = typeof updater === "function" ? updater(metadata) : updater;
      };
      const handlers = createMetadataHandlers({
        setMetadata,
        generateMetadataId: () => "new",
      });
      handlers.onChangeValue({ index: 0, newValue: "Digital" });
      expect(convertMetadataToDropMetadata(metadata)).toEqual([
        { data_key: "Medium", data_value: "Digital" },
      ]);
      handlers.onChangeKey({ index: 0, newKey: " " });
      expect(getMetadataNameErrors(metadata, "en-US")).toEqual({
        legacy: "Enter a field name.",
      });
      handlers.onChangeKey({ index: 0, newKey: "Medium" });
      expect(getMetadataNameErrors(metadata, "en-US")).toEqual({});
    });

    it("clears string metadata values without storing literal null", () => {
      let metadata: CreateDropMetadataType[] = [
        {
          id: "title",
          key: "title",
          type: ApiWaveMetadataType.String,
          value: "Existing title",
          required: false,
        },
      ];
      const setMetadata = jest.fn((updater: any) => {
        metadata = typeof updater === "function" ? updater(metadata) : updater;
      });

      const { onChangeValue } = createMetadataHandlers({
        setMetadata,
        generateMetadataId: () => "metadata-id",
      });

      onChangeValue({ index: 0, newValue: null });

      expect(metadata[0]?.value).toBeNull();
    });
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

    it("allows 50,000 storm characters and rejects the next character", () => {
      const drop = {
        parts: [
          { ...existingPart, content: "a".repeat(15_000) },
          { ...existingPart, content: "b".repeat(15_000) },
        ],
      } as CreateDropConfig;

      expect(
        canAddDropPart({
          markdown: "c".repeat(20_000),
          files: [],
          drop,
          hasPendingInlineImageUpload: false,
        })
      ).toBe(true);

      expect(
        canAddDropPart({
          markdown: "c".repeat(20_001),
          files: [],
          drop,
          hasPendingInlineImageUpload: false,
        })
      ).toBe(false);
    });

    it("allows the former 24,000-character Storm boundary", () => {
      expect(
        canAddDropPart({
          markdown: "b".repeat(9_000),
          files: [],
          drop: {
            parts: [{ ...existingPart, content: "a".repeat(15_000) }],
          } as CreateDropConfig,
          hasPendingInlineImageUpload: false,
        })
      ).toBe(true);
    });

    it("enforces the 25,000-character limit for each Storm part", () => {
      expect(
        canAddDropPart({
          markdown: "a".repeat(25_000),
          files: [],
          drop: null,
          hasPendingInlineImageUpload: false,
        })
      ).toBe(true);

      expect(
        canAddDropPart({
          markdown: "a".repeat(25_001),
          files: [],
          drop: null,
          hasPendingInlineImageUpload: false,
        })
      ).toBe(false);
    });

    it("enforces the 65,535-byte UTF-8 limit for each Storm part", () => {
      expect(
        canAddDropPart({
          markdown: "界".repeat(21_845),
          files: [],
          drop: null,
          hasPendingInlineImageUpload: false,
        })
      ).toBe(true);

      expect(
        canAddDropPart({
          markdown: "界".repeat(21_846),
          files: [],
          drop: null,
          hasPendingInlineImageUpload: false,
        })
      ).toBe(false);
    });

    it("rejects whitespace-only storm parts", () => {
      expect(
        canAddDropPart({
          markdown: "   ",
          files: [],
          drop: null,
          hasPendingInlineImageUpload: false,
        })
      ).toBe(false);

      expect(
        canSubmitDrop({
          ...baseCanSubmitParams,
          markdown: "   ",
          parts: [],
        })
      ).toBe(false);
    });

    it("keeps save changes disabled when an edited part is empty", () => {
      expect(
        canSubmitComposerAction({
          canAddPart: false,
          canSubmit: true,
          editingPartIndex: 0,
          hasMissingRequirements: false,
          isStormMode: true,
        })
      ).toBe(false);

      expect(
        canSubmitComposerAction({
          canAddPart: true,
          canSubmit: true,
          editingPartIndex: 0,
          hasMissingRequirements: false,
          isStormMode: true,
        })
      ).toBe(true);
    });

    it("blocks final submission until requirements are complete", () => {
      expect(
        canSubmitComposerAction({
          canAddPart: false,
          canSubmit: true,
          editingPartIndex: null,
          hasMissingRequirements: true,
          isStormMode: false,
        })
      ).toBe(false);

      expect(
        canSubmitComposerAction({
          canAddPart: true,
          canSubmit: true,
          editingPartIndex: null,
          hasMissingRequirements: true,
          isStormMode: true,
        })
      ).toBe(true);
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
