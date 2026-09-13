import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  confirmDocumentation,
  documentationProfileKey,
} from "@/services/api/artwork-documentation-api";

const fetchMock = jest.mocked(globalThis.fetch);

describe("documentation profile selection", () => {
  it("keeps profiles for distinct Waves independently selectable", () => {
    const profile = documentationFixture().profile;
    const firstWave = { ...profile, wave_id: "wave-one" };
    const secondWave = { ...profile, wave_id: "wave-two" };

    expect(documentationProfileKey(firstWave)).not.toBe(
      documentationProfileKey(secondWave)
    );
    expect(documentationProfileKey(firstWave)).not.toBe(
      documentationProfileKey(profile)
    );
    expect(documentationProfileKey({ ...firstWave })).toBe(
      documentationProfileKey(firstWave)
    );
  });

  it("keeps profile, program, and version distinctions within the same Wave", () => {
    const profile = { ...documentationFixture().profile, wave_id: "wave" };
    const variants = [
      profile,
      { ...profile, profile_id: "other-profile" },
      { ...profile, program_id: "other-program" },
      { ...profile, version: profile.version + 1 },
    ];

    expect(new Set(variants.map(documentationProfileKey)).size).toBe(
      variants.length
    );
  });
});

describe("documentation confirmation request", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it.each([
    "artwork-documentation-confirmation-v1",
    "artwork-documentation-confirmation-v2",
  ])(
    "sends the artist's acceptance with the active copy version %s",
    async (copyVersion) => {
      const context = documentationFixture();
      context.draft_version = 7;
      context.profile.confirmation_copy_version = copyVersion;
      const signal = new AbortController().signal;
      const revision = { id: "confirmed-revision" };
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => revision,
      } as Response);

      await expect(
        confirmDocumentation(context, "confirmation-request-key", signal)
      ).resolves.toBe(revision);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.test.6529.io/api/artwork-documentation/contexts/${context.id}/confirmations`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            confirmation_copy_version: copyVersion,
            accepted: true,
          }),
          headers: expect.objectContaining({
            "Idempotency-Key": "confirmation-request-key",
            "If-Match": '"draft-7"',
          }),
          signal,
        })
      );
    }
  );
});
