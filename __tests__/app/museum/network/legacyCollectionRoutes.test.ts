import { notFound, permanentRedirect } from "next/navigation";
import MuseumLegacyApprovedCollectionPage from "@/app/museum/network/collections/[slug]/page";
import MuseumCollectionsLegacyPage from "@/app/museum/network/collections/page";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import type {
  MuseumPublication,
  MuseumPublicationLoadState,
} from "@/lib/museum/publication/types";

jest.mock("next/navigation", () => ({
  permanentRedirect: jest.fn(),
  notFound: jest.fn(() => {
    throw new Error("not_found");
  }),
}));

jest.mock("@/lib/museum/publication/runtimeBundle", () => ({
  getMuseumPublicationBundle: jest.fn(),
}));

const mockedNotFound = jest.mocked(notFound);
const mockedBundle = jest.mocked(getMuseumPublicationBundle);

const legacyPublication = {
  entityGraph: undefined,
  routeAliases: [],
} as unknown as MuseumPublication;

function legacyBundle(approvedCollections: readonly object[]) {
  return {
    publicationState: {
      status: "current",
      publication: legacyPublication,
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    } as MuseumPublicationLoadState,
    view: { approvedCollections } as never,
  };
}

function typedBundle(
  routeAliases: readonly { legacyRoute: string; canonicalRoute: string }[]
) {
  return {
    publicationState: {
      status: "current",
      publication: {
        routeAliases,
        entityGraph: { identityInventory: { routeAliases } },
      } as unknown as MuseumPublication,
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    } as MuseumPublicationLoadState,
    view: {
      approvedCollections: [
        {
          approvalId: "APP-0001",
          preferredName: "Autoglyphs",
          scopeDefinition: "Generative works",
        },
      ],
    } as never,
  };
}

describe("Museum legacy collection routes", () => {
  it("sends the plural legacy collections index to the permanent Collection", () => {
    MuseumCollectionsLegacyPage();

    expect(permanentRedirect).toHaveBeenCalledWith(
      "/museum/network/collection"
    );
  });

  it("maps a known approved collection slug to the Gift Acquisitions pathway", async () => {
    mockedBundle.mockResolvedValue(
      legacyBundle([
        {
          approvalId: "APP-0001",
          preferredName: "Autoglyphs",
          scopeDefinition: "Generative works",
        },
      ])
    );

    await MuseumLegacyApprovedCollectionPage({
      params: Promise.resolve({ slug: "autoglyphs" }),
    });

    expect(permanentRedirect).toHaveBeenCalledWith(
      "/museum/network/acquisition-programs/gift-acquisitions#autoglyphs"
    );
  });

  it("404s an unknown approved collection slug instead of inventing a destination", async () => {
    mockedBundle.mockResolvedValue(legacyBundle([]));

    await expect(
      MuseumLegacyApprovedCollectionPage({
        params: Promise.resolve({ slug: "unknown" }),
      })
    ).rejects.toThrow("not_found");
    expect(mockedNotFound).toHaveBeenCalled();
  });

  it("uses the typed route alias before any legacy collection projection", async () => {
    mockedBundle.mockResolvedValue(
      typedBundle([
        {
          legacyRoute: "/museum/network/collections/autoglyphs",
          canonicalRoute:
            "/museum/network/acquisition-programs/gift-acquisitions#autoglyphs",
        },
      ])
    );

    await MuseumLegacyApprovedCollectionPage({
      params: Promise.resolve({ slug: "autoglyphs" }),
    });

    expect(permanentRedirect).toHaveBeenCalledWith(
      "/museum/network/acquisition-programs/gift-acquisitions#autoglyphs"
    );
  });

  it("fails closed when a typed publication has no approved-collection alias", async () => {
    mockedBundle.mockResolvedValue(typedBundle([]));

    await expect(
      MuseumLegacyApprovedCollectionPage({
        params: Promise.resolve({ slug: "autoglyphs" }),
      })
    ).rejects.toThrow("not_found");
  });
});
