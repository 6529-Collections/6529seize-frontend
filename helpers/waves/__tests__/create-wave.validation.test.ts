import { CREATE_WAVE_VALIDATION_ERROR, getCreateWaveValidationErrors } from "../create-wave.validation";
import { CreateWaveConfig, CreateWaveStep, WaveSignatureType } from "../../../types/waves.types";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import { ApiWaveCreditType } from "../../../generated/models/ApiWaveCreditType";
import { ApiWaveParticipationRequirement } from "../../../generated/models/ApiWaveParticipationRequirement";
import { ApiWaveMetadataType } from "../../../generated/models/ApiWaveMetadataType";

const createBaseConfig = (): CreateWaveConfig => ({
  overview: {
    type: ApiWaveType.Approve,
    signatureType: WaveSignatureType.NONE,
    name: "Test Wave",
    image: null,
  },
  groups: {
    canView: null,
    canDrop: null,
    canVote: null,
    canChat: null,
    admin: null,
  },
  dates: {
    submissionStartDate: 0,
    votingStartDate: 0,
    endDate: 0,
  },
  drops: {
    noOfApplicationsAllowedPerParticipant: null,
    requiredTypes: [],
    requiredMetadata: [],
  },
  chat: {
    enabled: false,
  },
  voting: {
    type: ApiWaveCreditType.Tdh,
    category: null,
    profileId: null,
  },
  outcomes: [],
  approval: {
    threshold: null,
    thresholdTimeMs: null,
  },
});

describe("Wave Name Validation", () => {
  it("should validate empty name", () => {
    const config = {
      ...createBaseConfig(),
      overview: {
        ...createBaseConfig().overview,
        name: "",
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.OVERVIEW,
      config,
    });

    expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED);
  });

  it("should validate name within length limit", () => {
    const config = {
      ...createBaseConfig(),
      overview: {
        ...createBaseConfig().overview,
        name: "A".repeat(250),
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.OVERVIEW,
      config,
    });

    expect(errors).not.toContain(CREATE_WAVE_VALIDATION_ERROR.NAME_TOO_LONG);
    expect(errors).not.toContain(CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED);
  });

  it("should validate name exceeding length limit", () => {
    const config = {
      ...createBaseConfig(),
      overview: {
        ...createBaseConfig().overview,
        name: "A".repeat(251),
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.OVERVIEW,
      config,
    });

    expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.NAME_TOO_LONG);
  });
});

describe("Wave Dates Validation", () => {
  describe("Chat Wave", () => {
    it("should not validate any dates for chat waves", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        dates: {
          submissionStartDate: 0,
          votingStartDate: 0,
          endDate: 0,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe("Rank Wave", () => {
    it("should require submission start date to be non-zero", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Rank,
        },
        dates: {
          submissionStartDate: 0,
          votingStartDate: 1000,
          endDate: 2000,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_START_DATE_REQUIRED);
    });

    it("should require voting start date to be non-zero", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Rank,
        },
        dates: {
          submissionStartDate: 1000,
          votingStartDate: 0,
          endDate: 2000,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_REQUIRED);
    });

    it("should require end date to be non-zero", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Rank,
        },
        dates: {
          submissionStartDate: 1000,
          votingStartDate: 2000,
          endDate: 0,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED);
    });

    it("should require voting start to be after or equal to submission start", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Rank,
        },
        dates: {
          submissionStartDate: 100,
          votingStartDate: 50,
          endDate: 200,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_SUBMISSION_START_DATE);
    });

    it("should require end date to be after voting start", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Rank,
        },
        dates: {
          submissionStartDate: 1000,
          votingStartDate: 2000,
          endDate: 1500,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE);
    });

    it("should accept valid dates", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Rank,
        },
        dates: {
          submissionStartDate: 1000,
          votingStartDate: 2000,
          endDate: 3000,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe("Approve Wave", () => {
    it("should require submission start date to be non-zero", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        dates: {
          submissionStartDate: 0,
          votingStartDate: 1000,
          endDate: 0,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_START_DATE_REQUIRED);
    });

    it("should require voting start date to be non-zero", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        dates: {
          submissionStartDate: 1000,
          votingStartDate: 0,
          endDate: 0,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_REQUIRED);
    });

    it("should not require end date", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        dates: {
          submissionStartDate: 1000,
          votingStartDate: 1000,
          endDate: 0,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).not.toContain(CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED);
    });

    it("should require submission and voting dates to be equal", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        dates: {
          submissionStartDate: 100,
          votingStartDate: 200,
          endDate: 300,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_SUBMISSION_START_DATE);
    });

    it("should accept valid dates", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        dates: {
          submissionStartDate: 1000,
          votingStartDate: 1000,
          endDate: 0,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DATES,
        config,
      });

      expect(errors).toHaveLength(0);
    });
  });
});

describe("Wave Groups Validation", () => {
  describe("Chat Wave", () => {
    it("should not allow canDrop group", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        groups: {
          canView: null,
          canDrop: "some-group",
          canVote: null,
          canChat: null,
          admin: null,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.GROUPS,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING);
    });

    it("should not allow canVote group", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        groups: {
          canView: null,
          canDrop: null,
          canVote: "some-group",
          canChat: null,
          admin: null,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.GROUPS,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING);
    });

    it("should accept valid group configuration with admin", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        groups: {
          canView: "view-group",
          canDrop: null,
          canVote: null,
          canChat: "chat-group",
          admin: "admin-group",
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.GROUPS,
        config,
      });

      expect(errors).toHaveLength(0);
    });

    it("should accept valid group configuration without admin", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        groups: {
          canView: "view-group",
          canDrop: null,
          canVote: null,
          canChat: "chat-group",
          admin: null,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.GROUPS,
        config,
      });

      expect(errors).toHaveLength(0);
    });

    it("should allow same group for multiple permissions", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        groups: {
          canView: "same-group",
          canDrop: null,
          canVote: null,
          canChat: "same-group",
          admin: "admin-group",
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.GROUPS,
        config,
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe("Rank Wave", () => {
    it("should accept valid group configuration with admin", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Rank,
        },
        groups: {
          canView: "view-group",
          canDrop: "drop-group",
          canVote: "vote-group",
          canChat: "chat-group",
          admin: "admin-group",
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.GROUPS,
        config,
      });

      expect(errors).toHaveLength(0);
    });

    it("should accept valid group configuration without admin", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Rank,
        },
        groups: {
          canView: "view-group",
          canDrop: "drop-group",
          canVote: "vote-group",
          canChat: "chat-group",
          admin: null,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.GROUPS,
        config,
      });

      expect(errors).toHaveLength(0);
    });

    it("should accept all null groups", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Rank,
        },
        groups: {
          canView: null,
          canDrop: null,
          canVote: null,
          canChat: null,
          admin: null,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.GROUPS,
        config,
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe("Approve Wave", () => {
    it("should accept valid group configuration with admin", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        groups: {
          canView: "view-group",
          canDrop: "drop-group",
          canVote: "vote-group",
          canChat: "chat-group",
          admin: "admin-group",
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.GROUPS,
        config,
      });

      expect(errors).toHaveLength(0);
    });

    it("should accept valid group configuration without admin", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        groups: {
          canView: "view-group",
          canDrop: "drop-group",
          canVote: "vote-group",
          canChat: "chat-group",
          admin: null,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.GROUPS,
        config,
      });

      expect(errors).toHaveLength(0);
    });

    it("should accept all null groups", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        groups: {
          canView: null,
          canDrop: null,
          canVote: null,
          canChat: null,
          admin: null,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.GROUPS,
        config,
      });

      expect(errors).toHaveLength(0);
    });
  });
});

describe("Wave Drops Validation", () => {
  describe("Chat Wave", () => {
    it("should require noOfApplicationsAllowedPerParticipant to be null", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        drops: {
          noOfApplicationsAllowedPerParticipant: 1,
          requiredTypes: [],
          requiredMetadata: [],
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DROPS,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_APPLICATIONS_PER_PARTICIPANT);
    });

    it("should require requiredTypes to be empty", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        drops: {
          noOfApplicationsAllowedPerParticipant: null,
          requiredTypes: [ApiWaveParticipationRequirement.Image],
          requiredMetadata: [],
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DROPS,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_REQUIRED_TYPES);
    });

    it("should require requiredMetadata to be empty", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        drops: {
          noOfApplicationsAllowedPerParticipant: null,
          requiredTypes: [],
          requiredMetadata: [{ key: "some-key", type: ApiWaveMetadataType.String }],
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DROPS,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_REQUIRED_METADATA);
    });

    it("should accept valid drops configuration", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        drops: {
          noOfApplicationsAllowedPerParticipant: null,
          requiredTypes: [],
          requiredMetadata: [],
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.DROPS,
        config,
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe("Rank & Approve Waves", () => {
    const waveTypes = [ApiWaveType.Rank, ApiWaveType.Approve];

    waveTypes.forEach((waveType) => {
      describe(waveType, () => {
        it("should require noOfApplicationsAllowedPerParticipant to be positive if provided", () => {
          const config = {
            ...createBaseConfig(),
            overview: {
              ...createBaseConfig().overview,
              type: waveType,
            },
            drops: {
              noOfApplicationsAllowedPerParticipant: 0,
              requiredTypes: [],
              requiredMetadata: [],
            },
          };

          const errors = getCreateWaveValidationErrors({
            step: CreateWaveStep.DROPS,
            config,
          });

          expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.APPLICATIONS_PER_PARTICIPANT_MUST_BE_POSITIVE);
        });

        it("should accept null noOfApplicationsAllowedPerParticipant", () => {
          const config = {
            ...createBaseConfig(),
            overview: {
              ...createBaseConfig().overview,
              type: waveType,
            },
            drops: {
              noOfApplicationsAllowedPerParticipant: null,
              requiredTypes: [],
              requiredMetadata: [],
            },
          };

          const errors = getCreateWaveValidationErrors({
            step: CreateWaveStep.DROPS,
            config,
          });

          expect(errors).toHaveLength(0);
        });

        it("should accept empty requiredTypes", () => {
          const config = {
            ...createBaseConfig(),
            overview: {
              ...createBaseConfig().overview,
              type: waveType,
            },
            drops: {
              noOfApplicationsAllowedPerParticipant: 1,
              requiredTypes: [],
              requiredMetadata: [],
            },
          };

          const errors = getCreateWaveValidationErrors({
            step: CreateWaveStep.DROPS,
            config,
          });

          expect(errors).toHaveLength(0);
        });

        it("should accept valid requiredTypes", () => {
          const config = {
            ...createBaseConfig(),
            overview: {
              ...createBaseConfig().overview,
              type: waveType,
            },
            drops: {
              noOfApplicationsAllowedPerParticipant: 1,
              requiredTypes: [ApiWaveParticipationRequirement.Image, ApiWaveParticipationRequirement.Video],
              requiredMetadata: [],
            },
          };

          const errors = getCreateWaveValidationErrors({
            step: CreateWaveStep.DROPS,
            config,
          });

          expect(errors).toHaveLength(0);
        });

        it("should accept empty requiredMetadata", () => {
          const config = {
            ...createBaseConfig(),
            overview: {
              ...createBaseConfig().overview,
              type: waveType,
            },
            drops: {
              noOfApplicationsAllowedPerParticipant: 1,
              requiredTypes: [],
              requiredMetadata: [],
            },
          };

          const errors = getCreateWaveValidationErrors({
            step: CreateWaveStep.DROPS,
            config,
          });

          expect(errors).toHaveLength(0);
        });

        it("should require unique keys in requiredMetadata", () => {
          const config = {
            ...createBaseConfig(),
            overview: {
              ...createBaseConfig().overview,
              type: waveType,
            },
            drops: {
              noOfApplicationsAllowedPerParticipant: 1,
              requiredTypes: [],
              requiredMetadata: [
                { key: "same-key", type: ApiWaveMetadataType.String },
                { key: "same-key", type: ApiWaveMetadataType.Number },
              ],
            },
          };

          const errors = getCreateWaveValidationErrors({
            step: CreateWaveStep.DROPS,
            config,
          });

          expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_NON_UNIQUE);
        });

        it("should accept valid requiredMetadata", () => {
          const config = {
            ...createBaseConfig(),
            overview: {
              ...createBaseConfig().overview,
              type: waveType,
            },
            drops: {
              noOfApplicationsAllowedPerParticipant: 1,
              requiredTypes: [],
              requiredMetadata: [
                { key: "key1", type: ApiWaveMetadataType.String },
                { key: "key2", type: ApiWaveMetadataType.Number },
              ],
            },
          };

          const errors = getCreateWaveValidationErrors({
            step: CreateWaveStep.DROPS,
            config,
          });

          expect(errors).toHaveLength(0);
        });
      });
    });
  });
});

describe("Wave Voting Validation", () => {
  describe("Chat Wave", () => {
    it("should require all voting fields to be null", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        voting: {
          type: ApiWaveCreditType.Tdh,
          category: null,
          profileId: null,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.VOTING,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING);
    });

    it("should accept valid voting configuration", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Chat,
        },
        voting: {
          type: null,
          category: null,
          profileId: null,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.VOTING,
        config,
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe("Rank & Approve Waves", () => {
    const waveTypes = [ApiWaveType.Rank, ApiWaveType.Approve];

    waveTypes.forEach((waveType) => {
      describe(waveType, () => {
        it("should require voting type", () => {
          const config = {
            ...createBaseConfig(),
            overview: {
              ...createBaseConfig().overview,
              type: waveType,
            },
            voting: {
              type: null,
              category: null,
              profileId: null,
            },
          };

          const errors = getCreateWaveValidationErrors({
            step: CreateWaveStep.VOTING,
            config,
          });

          expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.VOTING_TYPE_REQUIRED);
        });

        describe("TDH Voting", () => {
          it("should not allow category", () => {
            const config = {
              ...createBaseConfig(),
              overview: {
                ...createBaseConfig().overview,
                type: waveType,
              },
              voting: {
                type: ApiWaveCreditType.Tdh,
                category: "some-category",
                profileId: null,
              },
            };

            const errors = getCreateWaveValidationErrors({
              step: CreateWaveStep.VOTING,
              config,
            });

            expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.TDH_VOTING_CANNOT_HAVE_CATEGORY);
          });

          it("should not allow profileId", () => {
            const config = {
              ...createBaseConfig(),
              overview: {
                ...createBaseConfig().overview,
                type: waveType,
              },
              voting: {
                type: ApiWaveCreditType.Tdh,
                category: null,
                profileId: "some-profile-id",
              },
            };

            const errors = getCreateWaveValidationErrors({
              step: CreateWaveStep.VOTING,
              config,
            });

            expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.TDH_VOTING_CANNOT_HAVE_PROFILE_ID);
          });

          it("should accept valid configuration", () => {
            const config = {
              ...createBaseConfig(),
              overview: {
                ...createBaseConfig().overview,
                type: waveType,
              },
              voting: {
                type: ApiWaveCreditType.Tdh,
                category: null,
                profileId: null,
              },
            };

            const errors = getCreateWaveValidationErrors({
              step: CreateWaveStep.VOTING,
              config,
            });

            expect(errors).toHaveLength(0);
          });
        });

        describe("REP Voting", () => {
          it("should require category", () => {
            const config = {
              ...createBaseConfig(),
              overview: {
                ...createBaseConfig().overview,
                type: waveType,
              },
              voting: {
                type: ApiWaveCreditType.Rep,
                category: null,
                profileId: "some-profile-id",
              },
            };

            const errors = getCreateWaveValidationErrors({
              step: CreateWaveStep.VOTING,
              config,
            });

            expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.REP_VOTING_REQUIRES_CATEGORY);
          });

          it("should not allow empty category", () => {
            const config = {
              ...createBaseConfig(),
              overview: {
                ...createBaseConfig().overview,
                type: waveType,
              },
              voting: {
                type: ApiWaveCreditType.Rep,
                category: "",
                profileId: "some-profile-id",
              },
            };

            const errors = getCreateWaveValidationErrors({
              step: CreateWaveStep.VOTING,
              config,
            });

            expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.REP_VOTING_REQUIRES_CATEGORY);
          });

          it("should require profileId", () => {
            const config = {
              ...createBaseConfig(),
              overview: {
                ...createBaseConfig().overview,
                type: waveType,
              },
              voting: {
                type: ApiWaveCreditType.Rep,
                category: "some-category",
                profileId: null,
              },
            };

            const errors = getCreateWaveValidationErrors({
              step: CreateWaveStep.VOTING,
              config,
            });

            expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.REP_VOTING_REQUIRES_PROFILE_ID);
          });

          it("should not allow empty profileId", () => {
            const config = {
              ...createBaseConfig(),
              overview: {
                ...createBaseConfig().overview,
                type: waveType,
              },
              voting: {
                type: ApiWaveCreditType.Rep,
                category: "some-category",
                profileId: "",
              },
            };

            const errors = getCreateWaveValidationErrors({
              step: CreateWaveStep.VOTING,
              config,
            });

            expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.REP_VOTING_REQUIRES_PROFILE_ID);
          });

          it("should accept valid configuration", () => {
            const config = {
              ...createBaseConfig(),
              overview: {
                ...createBaseConfig().overview,
                type: waveType,
              },
              voting: {
                type: ApiWaveCreditType.Rep,
                category: "some-category",
                profileId: "some-profile-id",
              },
            };

            const errors = getCreateWaveValidationErrors({
              step: CreateWaveStep.VOTING,
              config,
            });

            expect(errors).toHaveLength(0);
          });
        });
      });
    });
  });
});

describe("Wave Approval Validation", () => {
  describe("Chat & Rank Waves", () => {
    const waveTypes = [ApiWaveType.Chat, ApiWaveType.Rank];

    waveTypes.forEach((waveType) => {
      describe(waveType, () => {
        it("should require threshold to be null", () => {
          const config = {
            ...createBaseConfig(),
            overview: {
              ...createBaseConfig().overview,
              type: waveType,
            },
            approval: {
              threshold: 100,
              thresholdTimeMs: null,
            },
          };

          const errors = getCreateWaveValidationErrors({
            step: CreateWaveStep.APPROVAL,
            config,
          });

          expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_MUST_BE_NULL);
        });

        it("should require thresholdTimeMs to be null", () => {
          const config = {
            ...createBaseConfig(),
            overview: {
              ...createBaseConfig().overview,
              type: waveType,
            },
            approval: {
              threshold: null,
              thresholdTimeMs: 100,
            },
          };

          const errors = getCreateWaveValidationErrors({
            step: CreateWaveStep.APPROVAL,
            config,
          });

          expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_MUST_BE_NULL);
        });

        it("should accept valid approval configuration", () => {
          const config = {
            ...createBaseConfig(),
            overview: {
              ...createBaseConfig().overview,
              type: waveType,
            },
            approval: {
              threshold: null,
              thresholdTimeMs: null,
            },
          };

          const errors = getCreateWaveValidationErrors({
            step: CreateWaveStep.APPROVAL,
            config,
          });

          expect(errors).toHaveLength(0);
        });
      });
    });
  });

  describe("Approve Wave", () => {
    it("should require threshold", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        approval: {
          threshold: null,
          thresholdTimeMs: 100,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.APPROVAL,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED);
    });

    it("should require positive threshold", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        approval: {
          threshold: 0,
          thresholdTimeMs: 100,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.APPROVAL,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED);
    });

    it("should require thresholdTimeMs", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        approval: {
          threshold: 100,
          thresholdTimeMs: null,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.APPROVAL,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_REQUIRED);
    });

    it("should require positive thresholdTimeMs", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        approval: {
          threshold: 100,
          thresholdTimeMs: 0,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.APPROVAL,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_REQUIRED);
    });

    it("should require thresholdTimeMs to be smaller than wave duration", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        dates: {
          submissionStartDate: 100,
          votingStartDate: 100,
          endDate: 200,
        },
        approval: {
          threshold: 100,
          thresholdTimeMs: 100,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.APPROVAL,
        config,
      });

      expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_MUST_BE_SMALLER_THAN_WAVE_DURATION);
    });

    it("should accept valid approval configuration", () => {
      const config = {
        ...createBaseConfig(),
        overview: {
          ...createBaseConfig().overview,
          type: ApiWaveType.Approve,
        },
        dates: {
          submissionStartDate: 100,
          votingStartDate: 100,
          endDate: 300,
        },
        approval: {
          threshold: 100,
          thresholdTimeMs: 100,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.APPROVAL,
        config,
      });

      expect(errors).toHaveLength(0);
    });
  });
});
