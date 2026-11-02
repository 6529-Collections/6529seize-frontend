import {
  buildSubmissionMetadata,
  getSubmissionMetadataLengthValidation,
} from "@/components/waves/memes/submission/utils/submissionMetadata";
import { MemesSubmissionAdditionalInfoKey } from "@/components/waves/memes/submission/types/OperationalData";
import type { OperationalData } from "@/components/waves/memes/submission/types/OperationalData";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";

const buildTraits = (overrides: Partial<TraitsData>): TraitsData =>
  ({
    title: "",
    description: "",
    artist: "",
    ...overrides,
  }) as TraitsData;

describe("submissionMetadata", () => {
  const mockTraits: TraitsData = {
    title: "Test Artwork",
    description: "Test Description",
    artist: "Test Artist",
  };

  const mockOperationalData: OperationalData = {
    airdrop_config: [
      {
        id: "test-1",
        address: "0x1234567890123456789012345678901234567890",
        count: 15,
      },
      {
        id: "test-2",
        address: "0x0987654321098765432109876543210987654321",
        count: 5,
      },
    ],
    payment_info: {
      payment_address: "0x789",
      has_designated_payee: false,
      designated_payee_name: "",
    },
    allowlist_batches: [
      { id: "test-batch-1", contract: "0xabc", token_ids_raw: "1-5" },
    ],
    additional_media: {
      artist_profile_media: ["https://example.com/profile.jpg"],
      artwork_commentary_media: ["https://example.com/commentary.jpg"],
      preview_image: "",
      promo_video: "",
    },
    commentary: "Test Commentary",
    about_artist: "Test About Artist",
  };

  it("includes operational data in metadata when provided", () => {
    const metadata = buildSubmissionMetadata({
      traits: mockTraits,
      operationalData: mockOperationalData,
    });

    const metadataMap = new Map(
      metadata.map((item) => [item.data_key, item.data_value])
    );

    expect(metadataMap.get("title")).toBe("Test Artwork");
    expect(
      metadataMap.get(MemesSubmissionAdditionalInfoKey.AIRDROP_CONFIG)
    ).toBe(JSON.stringify(mockOperationalData.airdrop_config));
    expect(metadataMap.get(MemesSubmissionAdditionalInfoKey.PAYMENT_INFO)).toBe(
      JSON.stringify(mockOperationalData.payment_info)
    );
    expect(
      metadataMap.get(MemesSubmissionAdditionalInfoKey.ALLOWLIST_BATCHES)
    ).toBe(JSON.stringify([{ contract: "0xabc", token_ids: "1-5" }]));
    expect(
      metadataMap.get(MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA)
    ).toBe(JSON.stringify(mockOperationalData.additional_media));
    expect(metadataMap.get(MemesSubmissionAdditionalInfoKey.COMMENTARY)).toBe(
      "Test Commentary"
    );
    expect(metadataMap.get(MemesSubmissionAdditionalInfoKey.ABOUT_ARTIST)).toBe(
      "Test About Artist"
    );
  });

  it("does not include operational fields when not provided", () => {
    const metadata = buildSubmissionMetadata({
      traits: mockTraits,
    });

    const metadataMap = new Map(
      metadata.map((item) => [item.data_key, item.data_value])
    );

    expect(
      metadataMap.has(MemesSubmissionAdditionalInfoKey.AIRDROP_CONFIG)
    ).toBe(false);
    expect(metadataMap.has(MemesSubmissionAdditionalInfoKey.PAYMENT_INFO)).toBe(
      false
    );
    expect(
      metadataMap.has(MemesSubmissionAdditionalInfoKey.ALLOWLIST_BATCHES)
    ).toBe(false);
    expect(
      metadataMap.has(MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA)
    ).toBe(false);
    expect(metadataMap.has(MemesSubmissionAdditionalInfoKey.COMMENTARY)).toBe(
      false
    );
    expect(metadataMap.has(MemesSubmissionAdditionalInfoKey.ABOUT_ARTIST)).toBe(
      false
    );
  });

  it.each<[boolean, string, string | undefined]>([
    [
      true,
      "  An event if selected.\nNo ticket cost.  ",
      "An event if selected.\nNo ticket cost.",
    ],
    [false, "A retained draft", undefined],
    [true, "   ", undefined],
  ])(
    "saves a plan only for a marked action (%s)",
    (isAdditionalActionPromised, plan, expected) => {
      const metadata = buildSubmissionMetadata({
        traits: mockTraits,
        operationalData: {
          ...mockOperationalData,
          additional_action_plan: plan,
        },
        isAdditionalActionPromised,
      });
      expect(
        metadata.find((item) => item.data_key === "additional_action_plan")
          ?.data_value
      ).toBe(expected);
    }
  );

  it("enforces the plan limit only when it would be submitted", () => {
    const input = {
      traits: mockTraits,
      operationalData: {
        ...mockOperationalData,
        additional_action_plan: "p".repeat(5001),
      },
    };
    expect(
      getSubmissionMetadataLengthValidation({
        ...input,
        isAdditionalActionPromised: true,
      }).hasErrors
    ).toBe(true);
    expect(
      getSubmissionMetadataLengthValidation({
        ...input,
        isAdditionalActionPromised: false,
      }).hasErrors
    ).toBe(false);
    expect(
      getSubmissionMetadataLengthValidation({
        ...input,
        isAdditionalActionPromised: true,
        operationalData: {
          ...mockOperationalData,
          additional_action_plan: "p".repeat(5000),
        },
      }).hasErrors
    ).toBe(false);
  });

  it("trims metadata text while preserving internal whitespace and source values", () => {
    const traits = buildTraits({
      title: " \tTest Artwork\n",
      description: "\nFirst  paragraph.\n\nSecond paragraph.\t ",
      artist: "\u00a0Test Artist\u00a0",
      style: "  Digital  art  ",
      pointsPower: 0,
      gradient: false,
    });
    const operationalData = {
      ...mockOperationalData,
      commentary: "\nMade with  AI tools.\n\nMore details. \t",
      about_artist: "  Artist bio.\n\nSecond paragraph.\n",
      payment_info: {
        ...mockOperationalData.payment_info,
        designated_payee_name: " Payee name ",
      },
    };

    const metadata = buildSubmissionMetadata({ traits, operationalData });
    const metadataMap = new Map(
      metadata.map((item) => [item.data_key, item.data_value])
    );

    expect(metadataMap.get("title")).toBe("Test Artwork");
    expect(metadataMap.get("description")).toBe(
      "First  paragraph.\n\nSecond paragraph."
    );
    expect(metadataMap.get("artist")).toBe("Test Artist");
    expect(metadataMap.get("style")).toBe("Digital  art");
    expect(metadataMap.get("pointsPower")).toBe("0");
    expect(metadataMap.get("gradient")).toBe("false");
    expect(metadataMap.get("commentary")).toBe(
      "Made with  AI tools.\n\nMore details."
    );
    expect(metadataMap.get("about_artist")).toBe(
      "Artist bio.\n\nSecond paragraph."
    );
    expect(metadataMap.get("payment_info")).toBe(
      JSON.stringify(operationalData.payment_info)
    );
    expect(traits.title).toBe(" \tTest Artwork\n");
    expect(operationalData.about_artist).toBe(
      "  Artist bio.\n\nSecond paragraph.\n"
    );
  });

  it.each(["", "   ", "\t\n", "\u00a0"])(
    "omits trait values that are empty after trimming (%j)",
    (value) => {
      const metadata = buildSubmissionMetadata({
        traits: buildTraits({ artist: "Artist", bonus: value }),
      });

      expect(metadata).toEqual([{ data_key: "artist", data_value: "Artist" }]);
    }
  );

  it("checks length limits against the trimmed values that will be submitted", () => {
    const validation = getSubmissionMetadataLengthValidation({
      traits: buildTraits({
        title: ` ${"t".repeat(255)} `,
        description: `\n${"d".repeat(8000)}\n`,
      }),
      operationalData: {
        ...mockOperationalData,
        about_artist: `\t${"a".repeat(5000)}\u00a0`,
        commentary: ` ${"c".repeat(5000)}\n`,
      },
    });

    expect(validation.hasErrors).toBe(false);
    expect(validation.statusesByKey["title"]?.length).toBe(255);
    expect(validation.statusesByKey["description"]?.length).toBe(8000);
    expect(validation.statusesByKey["about_artist"]?.length).toBe(5000);
    expect(validation.statusesByKey["commentary"]?.length).toBe(5000);
  });

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
