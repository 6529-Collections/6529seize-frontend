import { getSubmissionMetadataLengthValidation } from "@/components/waves/memes/submission/utils/submissionMetadata";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";

const buildTraits = (overrides: Partial<TraitsData>): TraitsData =>
  ({
    title: "",
    description: "",
    artist: "",
    ...overrides,
  }) as TraitsData;

describe("submissionMetadata", () => {
  it("uses key-specific metadata value limits", () => {
    const validation = getSubmissionMetadataLengthValidation({
      traits: buildTraits({
        title: "t".repeat(256),
        description: "d".repeat(8001),
        artist: "a".repeat(5001),
      }),
    });

    expect(validation.statusesByKey.title).toMatchObject({
      maxLength: 255,
      isError: true,
    });
    expect(validation.statusesByKey.description).toMatchObject({
      maxLength: 8000,
      isError: true,
    });
    expect(validation.statusesByKey.artist).toMatchObject({
      maxLength: 5000,
      isError: true,
    });
  });

  it("allows long descriptions without raising default metadata limit errors", () => {
    const validation = getSubmissionMetadataLengthValidation({
      traits: buildTraits({
        title: "t".repeat(255),
        description: "d".repeat(8000),
        artist: "a".repeat(5000),
      }),
    });

    expect(validation.hasErrors).toBe(false);
  });
});
