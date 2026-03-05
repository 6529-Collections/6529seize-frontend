import type { OperationalData } from "@/components/waves/memes/submission/types/OperationalData";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";
import {
  METADATA_VALUE_MAX_LENGTH,
  METADATA_VALUE_WARNING_THRESHOLD,
  buildSubmissionMetadata,
  getSubmissionMetadataLengthValidation,
} from "@/components/waves/memes/submission/utils/submissionMetadata";

const buildTraits = (): TraitsData =>
  ({
    title: "Title",
    description: "Description",
  }) as TraitsData;

const buildOperationalData = (commentary: string): OperationalData => ({
  airdrop_config: [
    {
      id: "a1",
      address: "0x1234567890123456789012345678901234567890",
      count: 20,
    },
  ],
  payment_info: {
    payment_address: "0x1234567890123456789012345678901234567890",
    has_designated_payee: false,
    designated_payee_name: "",
  },
  allowlist_batches: [],
  additional_media: {
    artist_profile_media: [],
    artwork_commentary_media: [],
    preview_image: "",
    promo_video: "",
  },
  commentary,
  about_artist: "about",
});

describe("submissionMetadata utils", () => {
  it("flags warning at threshold and error above limit", () => {
    const traits = buildTraits();

    const warningValidation = getSubmissionMetadataLengthValidation({
      traits,
      operationalData: buildOperationalData(
        "a".repeat(METADATA_VALUE_WARNING_THRESHOLD)
      ),
    });

    expect(warningValidation.statusesByKey.commentary?.isWarning).toBe(true);
    expect(warningValidation.statusesByKey.commentary?.isError).toBe(false);

    const errorValidation = getSubmissionMetadataLengthValidation({
      traits,
      operationalData: buildOperationalData(
        "a".repeat(METADATA_VALUE_MAX_LENGTH + 1)
      ),
    });

    expect(errorValidation.hasErrors).toBe(true);
    expect(errorValidation.statusesByKey.commentary?.isError).toBe(true);
  });

  it("keeps only valid airdrop entries when serializing metadata", () => {
    const traits = buildTraits();

    const metadata = buildSubmissionMetadata({
      traits,
      operationalData: {
        ...buildOperationalData("commentary"),
        airdrop_config: [
          {
            id: "invalid",
            address: "0x123",
            count: 10,
          },
          {
            id: "valid",
            address: "0x1234567890123456789012345678901234567890",
            count: 10,
          },
        ],
      },
    });

    const airdropMetadata = metadata.find(
      (item) => item.data_key === "airdrop_config"
    );

    expect(airdropMetadata).toBeDefined();
    expect(airdropMetadata?.data_value).toContain('"id":"valid"');
    expect(airdropMetadata?.data_value).not.toContain('"id":"invalid"');
  });
});
