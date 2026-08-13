import { getMuseumGiftMetadata } from "@/components/museum/MuseumGiftPage";

describe("Museum gift metadata", () => {
  it("does not describe every legacy gift route as the Casey gift", () => {
    const metadata = getMuseumGiftMetadata("6529NM-CA-2026-003");

    expect(metadata.description).toContain(
      "Accessioned gifts and the records that document how works enter the permanent Collection."
    );
  });
});
