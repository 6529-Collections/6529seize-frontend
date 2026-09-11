import {
  MUSEUM_NAVIGATION_ITEMS,
  museumNavigationActiveSection,
} from "@/components/museum/MuseumNavigation";
import {
  buildMuseumEntityContext,
  buildMuseumWorkContext,
} from "@/lib/museum/publication/ia";
import {
  museumCollectionWorkHrefForSourceId,
  museumAcquisitionHrefForLegacyRoute,
  museumAcquisitionHrefForSourceId,
  museumAcquisitionProgramHrefForSourceId,
  museumWorkHref,
  museumWorkHrefForSourceId,
  resolveMuseumAcquisitionSlug,
} from "@/lib/museum/publication/routes";
import type { MuseumPublication } from "@/lib/museum/publication/types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

function typedPublication(): MuseumPublication {
  return {
    identity: { commit: "a".repeat(40) },
    works: [
      {
        id: "6529NM-W-0001",
        collectionMembership: true,
        acquisitionIds: ["6529NM-CA-2026-001"],
        programIds: [],
      },
      {
        id: "6529NM-W-0008",
        collectionMembership: false,
        acquisitionIds: ["6529NM-CA-2026-002"],
        programIds: ["6529NM-AP-ENT-0002"],
      },
      {
        id: "6529NM-W-0024",
        collectionMembership: false,
        acquisitionIds: ["6529NM-CA-2026-003"],
        programIds: [],
      },
    ],
    workAliases: [
      {
        kind: "work_source_alias",
        sourceObjectId: "6529NM.2026.001.01",
        workId: "6529NM-W-0001",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
      {
        kind: "work_source_alias",
        sourceObjectId: "6529NM-AP-01-OUT-001",
        workId: "6529NM-W-0008",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
      {
        kind: "work_source_alias",
        sourceObjectId: "6529NM-PG-2026-001.OBJ-001",
        workId: "6529NM-W-0024",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
    ],
    routeAliases: [
      {
        legacyRoute: "/museum/network/objects/route-only-alias",
        canonicalRoute: "/museum/network/works/6529NM-W-0001",
        canonicalEntityId: "6529NM-W-0001",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
      {
        legacyRoute: "/museum/network/accessions/legacy-accession",
        canonicalRoute:
          "/museum/network/acquisitions/the-system-in-seven-states",
        canonicalEntityId: "6529NM-CA-2026-001",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
      {
        legacyRoute: "/museum/network/programs/keys-and-gates",
        canonicalRoute: "/museum/network/acquisition-programs/keys-and-gates",
        canonicalEntityId: "6529NM-AP-ENT-0002",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
      {
        legacyRoute: "/museum/network/gifts/legacy-gift",
        canonicalRoute:
          "/museum/network/acquisitions/the-system-in-seven-states",
        canonicalEntityId: "6529NM-CA-2026-001",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
    ],
    curatedAcquisitions: [
      {
        id: "6529NM-CA-2026-001",
        slug: "the-system-in-seven-states",
        sourceAliases: ["6529NM.2026.001"],
      },
      {
        id: "6529NM-CA-2026-003",
        slug: "conflict-at-its-edges",
        sourceAliases: ["6529NM-PG-2026-001"],
      },
    ],
    acquisitionAliases: [
      {
        kind: "acquisition_source_alias",
        alias: "6529NM.2026.001",
        acquisitionId: "6529NM-CA-2026-001",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
      {
        kind: "acquisition_source_alias",
        alias: "6529NM-PG-2026-001",
        acquisitionId: "6529NM-CA-2026-003",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
    ],
    acquisitionPrograms: [
      {
        id: "6529NM-AP-ENT-0002",
        slug: "keys-and-gates",
        sourceAliases: ["6529NM-AP-01"],
      },
    ],
    artworks: [],
    artists: [],
    projects: [],
    documents: [],
    gifts: [],
    accessions: [],
    programs: [],
    declaredSourcePaths: [],
  } as unknown as MuseumPublication;
}

describe("Museum IA route boundaries", () => {
  it("keeps the five public navigation labels and active sections exact", () => {
    expect(
      MUSEUM_NAVIGATION_ITEMS.map((item) => t(DEFAULT_LOCALE, item.labelKey))
    ).toEqual(["Collection", "Artists", "Acquisitions", "Research", "About"]);
    expect(museumNavigationActiveSection("/museum/network/collection")).toBe(
      "collection"
    );
    expect(
      museumNavigationActiveSection("/museum/network/artists/casey-reas")
    ).toBe("artists");
    expect(
      museumNavigationActiveSection(
        "/museum/network/acquisitions/keys-and-gates"
      )
    ).toBe("acquisitions");
    expect(
      museumNavigationActiveSection(
        "/museum/network/acquisition-programs/keys-and-gates"
      )
    ).toBe("acquisitions");
    expect(museumNavigationActiveSection("/museum/network/research")).toBe(
      "research"
    );
    expect(museumNavigationActiveSection("/museum/network/governance")).toBe(
      "about"
    );
    expect(museumNavigationActiveSection("/museum/network/rights")).toBe(
      "about"
    );
  });

  it("fails closed on ambiguous canonical Work, Project, and Organization routes", () => {
    expect(
      museumNavigationActiveSection("/museum/network/works/6529NM-W-0001")
    ).toBeNull();
    expect(
      museumNavigationActiveSection("/museum/network/works/6529NM-W-0008")
    ).toBeNull();
    expect(
      museumNavigationActiveSection("/museum/network/works/6529NM-W-0024")
    ).toBeNull();
    expect(
      museumNavigationActiveSection("/museum/network/projects/casey-reas")
    ).toBeNull();
    expect(
      museumNavigationActiveSection(
        "/museum/network/organizations/magnum-photos"
      )
    ).toBeNull();
  });

  it("resolves source aliases to canonical typed routes without string-derived identity", () => {
    const publication = typedPublication();
    expect(museumWorkHrefForSourceId(publication, "6529NM.2026.001.01")).toBe(
      "/museum/network/works/6529NM-W-0001"
    );
    expect(museumWorkHrefForSourceId(publication, "6529NM-AP-01-OUT-001")).toBe(
      "/museum/network/works/6529NM-W-0008"
    );
    expect(
      museumWorkHrefForSourceId(publication, "6529NM-PG-2026-001.OBJ-001")
    ).toBe("/museum/network/works/6529NM-W-0024");
    expect(museumWorkHrefForSourceId(publication, "route-only-alias")).toBe(
      "/museum/network/works/6529NM-W-0001"
    );
    expect(
      museumAcquisitionHrefForSourceId(publication, "6529NM.2026.001")
    ).toBe("/museum/network/acquisitions/the-system-in-seven-states");
    expect(
      museumAcquisitionHrefForSourceId(publication, "6529NM-PG-2026-001")
    ).toBe("/museum/network/acquisitions/conflict-at-its-edges");
    expect(
      resolveMuseumAcquisitionSlug(publication, "legacy-accession")
    ).toBeNull();
    expect(
      resolveMuseumAcquisitionSlug(publication, "keys-and-gates")
    ).toBeNull();
    expect(resolveMuseumAcquisitionSlug(publication, "legacy-gift")).toBeNull();
    expect(
      museumAcquisitionProgramHrefForSourceId(publication, "6529NM-AP-01")
    ).toBe("/museum/network/acquisition-programs/keys-and-gates");
    expect(
      museumWorkHrefForSourceId(publication, "unresolved-source-id")
    ).toBeNull();
    expect(
      museumAcquisitionHrefForLegacyRoute(
        publication,
        "6529NM-AP-01",
        "/museum/network/gifts/"
      )
    ).toBeNull();
    expect(
      museumAcquisitionHrefForLegacyRoute(
        publication,
        "6529NM-AP-01-OUT-001",
        "/museum/network/accessions/"
      )
    ).toBeNull();
    expect(
      museumAcquisitionHrefForLegacyRoute(
        publication,
        "legacy-gift",
        "/museum/network/gifts/"
      )
    ).toBe("/museum/network/acquisitions/the-system-in-seven-states");
    expect(
      museumAcquisitionHrefForLegacyRoute(
        publication,
        "6529NM.2026.001",
        "/museum/network/gifts/"
      )
    ).toBe("/museum/network/acquisitions/the-system-in-seven-states");
    expect(
      museumAcquisitionHrefForLegacyRoute(
        publication,
        "keys-and-gates",
        "/museum/network/gifts/"
      )
    ).toBeNull();
  });

  it("rejects invalid relation objects while constructing the entity context", () => {
    expect(
      buildMuseumEntityContext({
        kind: "project",
        id: "6529NM-PRJ-0001",
        label: "A project",
        breadcrumbs: [],
        primaryRelations: [
          {
            kind: "work",
            id: "6529NM-W-0001",
            label: "A work",
            href: " ",
            relation: "Part of",
          },
        ],
        sourcePath: null,
        sourceCommit: "a".repeat(40),
      })
    ).toBeNull();
  });

  it("does not serialize an unresolved legacy Work alias in the typed graph", () => {
    const publication = {
      ...typedPublication(),
      artworks: [{ id: "legacy-object-id", title: "Legacy object" }],
    } as unknown as MuseumPublication;

    expect(
      buildMuseumWorkContext(publication, "legacy-object-id", null)
    ).toBeNull();
  });

  it("serializes only canonical Work entity IDs", () => {
    expect(museumWorkHref("6529NM-W-0001")).toBe(
      "/museum/network/works/6529NM-W-0001"
    );
    for (const sourceAlias of [
      "6529NM.2026.001.01",
      "6529NM-AP-01-OUT-001",
      "6529NM-PG-2026-001.OBJ-001",
      "A Work Title",
    ]) {
      expect(() => museumWorkHref(sourceAlias)).toThrow(
        "museum_work_id_not_canonical"
      );
    }
  });

  it("keeps the permanent Collection alias narrower than generic Work aliases", () => {
    const publication = typedPublication();
    expect(
      museumCollectionWorkHrefForSourceId(publication, "6529NM.2026.001.01")
    ).toBe("/museum/network/works/6529NM-W-0001");
    expect(
      museumCollectionWorkHrefForSourceId(publication, "6529NM-AP-01-OUT-001")
    ).toBeNull();
    expect(
      museumCollectionWorkHrefForSourceId(
        publication,
        "6529NM-PG-2026-001.OBJ-001"
      )
    ).toBe("/museum/network/works/6529NM-W-0024");
  });
});
