import { notFound, permanentRedirect } from "next/navigation";
import MuseumLegacyApprovedCollectionPage from "@/app/museum/network/collections/[slug]/page";
import MuseumCollectionsLegacyPage from "@/app/museum/network/collections/page";
import { getMuseumView } from "@/lib/museum/normalize";

jest.mock("next/navigation", () => ({
  permanentRedirect: jest.fn(),
  notFound: jest.fn(() => {
    throw new Error("not_found");
  }),
}));

jest.mock("@/lib/museum/normalize", () => ({
  getMuseumView: jest.fn(),
}));

const mockedNotFound = jest.mocked(notFound);
const mockedView = jest.mocked(getMuseumView);

describe("Museum legacy collection routes", () => {
  it("sends the plural legacy collections index to the acquisitions hub", () => {
    MuseumCollectionsLegacyPage();

    expect(permanentRedirect).toHaveBeenCalledWith(
      "/museum/network/acquisitions"
    );
  });

  it("maps a known approved collection slug to the Gift Acquisitions pathway", async () => {
    mockedView.mockResolvedValue({
      approvedCollections: [
        {
          approvalId: "APP-0001",
          preferredName: "Autoglyphs",
          scopeDefinition: "Generative works",
        },
      ],
    });

    await MuseumLegacyApprovedCollectionPage({
      params: Promise.resolve({ slug: "autoglyphs" }),
    });

    expect(permanentRedirect).toHaveBeenCalledWith(
      "/museum/network/acquisition-programs/gift-acquisitions#autoglyphs"
    );
  });

  it("404s an unknown approved collection slug instead of inventing a destination", async () => {
    mockedView.mockResolvedValue({ approvedCollections: [] });

    await expect(
      MuseumLegacyApprovedCollectionPage({
        params: Promise.resolve({ slug: "unknown" }),
      })
    ).rejects.toThrow("not_found");
    expect(mockedNotFound).toHaveBeenCalled();
  });
});
